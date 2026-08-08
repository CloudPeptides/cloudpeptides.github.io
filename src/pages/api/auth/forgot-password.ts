/**
 * Password-reset request — admin account recovery. Layered defense
 * matching src/pages/api/auth/login.ts's established pattern:
 *  1. Same-origin check.
 *  2. Request body-size limit.
 *  3. Cloudflare native rate limit (env.FORM_RATE_LIMITER, keyed
 *     per-IP, its own key namespace so it never shares a budget with
 *     login/contact/checkout).
 *  4. Email format validation.
 *  5. Supabase resetPasswordForEmail — answered with the exact same
 *     generic message every time (valid account or not, Supabase send
 *     failure or not, even rate-limited or not), so this endpoint can
 *     never be used to enumerate which emails have admin accounts.
 *
 * Note: Supabase's own built-in mailer (no custom SMTP configured on
 * this project) is tightly rate-limited project-wide — this route's
 * own per-IP limit exists partly to protect that shared quota from
 * being exhausted by repeated submissions, on top of the anti-abuse
 * reasoning above.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createAnonClient, isSameOriginRequest } from '../../../lib/auth';
import { isSingleLineSafe, isValidEmail, sanitizeText } from '../../../lib/form-validation';
import { buildResetRedirectUrl } from '../../../lib/password-reset';
import { checkRateLimit } from '../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../lib/request-limits';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const GENERIC_MESSAGE =
  'If an account exists for that email address, a password reset link has been sent.';

export const POST: APIRoute = async ({ request, url }) => {
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }

  const bodyRead = await readBodyWithLimit(request);
  if (!bodyRead.ok) {
    return json({ success: false, error: bodyRead.error ?? 'Invalid request body.' }, 413);
  }
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(bodyRead.text ?? '');
  } catch {
    return json({ success: false, error: 'Invalid request body.' }, 400);
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `forgot-password:${ip}`);
  if (!rate.allowed) {
    // Still the generic success message, deliberately — see the header
    // comment above. The rate limit has already done its real job here
    // (no Supabase call happens below), so nothing is lost by not
    // surfacing a distinct "too many requests" response.
    return json({ success: true, message: GENERIC_MESSAGE }, 200);
  }

  const email = sanitizeText(input.email, 200);
  if (!email || !isValidEmail(email) || !isSingleLineSafe(email)) {
    // A format rejection only reveals "this isn't a well-formed email
    // address" — never whether a matching account exists.
    return json({ success: false, error: 'Please enter a valid email address.' }, 400);
  }

  try {
    const client = createAnonClient();
    await client.auth.resetPasswordForEmail(email, {
      redirectTo: buildResetRedirectUrl(url.origin),
    });
  } catch {
    // Swallowed deliberately — a transient Supabase-side failure must
    // not produce a different response than "no such account," or the
    // difference itself becomes an enumeration oracle.
  }

  return json({ success: true, message: GENERIC_MESSAGE }, 200);
};
