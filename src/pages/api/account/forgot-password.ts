/**
 * Public password-reset request — researcher-account recovery. Same
 * layered defense and anti-enumeration posture as src/pages/api/auth/
 * forgot-password.ts (the admin equivalent); kept as a separate route
 * only because the redirect target differs (/reset-password, not
 * /admin/reset-password).
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createAnonClient, isSameOriginRequest } from '../../../lib/auth';
import { isSingleLineSafe, isValidEmail, sanitizeText } from '../../../lib/form-validation';
import { buildAccountResetRedirectUrl } from '../../../lib/password-reset';
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
  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `account-forgot-password:${ip}`);
  if (!rate.allowed) {
    return json({ success: true, message: GENERIC_MESSAGE }, 200);
  }

  const email = sanitizeText(input.email, 200);
  if (!email || !isValidEmail(email) || !isSingleLineSafe(email)) {
    return json({ success: false, error: 'Please enter a valid email address.' }, 400);
  }

  try {
    const client = createAnonClient();
    await client.auth.resetPasswordForEmail(email, {
      redirectTo: buildAccountResetRedirectUrl(url.origin),
    });
  } catch {
    // Swallowed deliberately — see src/pages/api/auth/forgot-password.ts's
    // identical comment: a transient failure must not become an
    // enumeration oracle.
  }

  return json({ success: true, message: GENERIC_MESSAGE }, 200);
};
