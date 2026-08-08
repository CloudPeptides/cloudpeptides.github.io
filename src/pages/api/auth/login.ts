/**
 * Admin sign-in — email/password via Supabase Auth. Layered defense,
 * cheapest/most-decisive first, matching src/pages/api/contact.ts's
 * established pattern:
 *  1. Same-origin check (src/lib/auth.ts's isSameOriginRequest).
 *  2. Request body-size limit.
 *  3. Cloudflare native rate limit (env.FORM_RATE_LIMITER, shared
 *     binding, keyed `login:${ip}` so it doesn't share a budget with
 *     the contact/checkout routes' own keys).
 *  4. Field validation.
 *  5. Supabase signInWithPassword — a generic "invalid email or
 *     password" on any failure, never revealing which field was wrong
 *     or whether the account exists.
 *  6. Role gate: a plain 'member' has no legitimate reason to hold an
 *     admin session at all (every real admin page requires
 *     contributor+) — reject and immediately revoke rather than hand
 *     out a cookie nothing can use.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  buildSessionCookies,
  createAnonClient,
  hasMinRole,
  isSameOriginRequest,
  type Role,
} from '../../../lib/auth';
import { isSingleLineSafe, isValidEmail, sanitizeText } from '../../../lib/form-validation';
import { checkRateLimit } from '../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../lib/request-limits';

function json(body: unknown, status: number, extraHeaders?: string[]): Response {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const cookie of extraHeaders ?? []) headers.append('Set-Cookie', cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

function decodeRole(accessToken: string): Role {
  try {
    const payload = JSON.parse(
      atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    );
    return (payload.user_role as Role) ?? 'member';
  } catch {
    return 'member';
  }
}

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
  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `login:${ip}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many attempts. Please try again shortly.' }, 429);
  }

  const email = sanitizeText(input.email, 200);
  const password = typeof input.password === 'string' ? input.password : '';
  if (!email || !password || !isValidEmail(email) || !isSingleLineSafe(email)) {
    return json({ success: false, error: 'Invalid email or password.' }, 400);
  }

  const client = createAnonClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return json({ success: false, error: 'Invalid email or password.' }, 401);
  }

  const role = decodeRole(data.session.access_token);
  if (!hasMinRole(role, 'contributor')) {
    // Valid credentials, but this account has no dashboard access at
    // all — revoke the session we just created rather than leave an
    // unusable-but-live refresh token behind.
    await client.auth.signOut();
    return json({ success: false, error: 'This account does not have dashboard access.' }, 403);
  }

  const cookies = buildSessionCookies(
    data.session.access_token,
    data.session.refresh_token,
    url.protocol === 'https:',
  );
  return json({ success: true }, 200, cookies);
};
