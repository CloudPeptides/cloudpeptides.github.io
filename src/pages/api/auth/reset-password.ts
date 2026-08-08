/**
 * Password-reset completion. Exchanges the Supabase recovery session
 * for a live session, confirms it was actually issued for password
 * recovery (not just any valid token pair — src/lib/password-reset.ts's
 * isRecoverySession), sets the new password via updateUser() on that
 * same session, then immediately signs it out. This only ever updates
 * the existing auth.users row's password in place — no user is
 * created, no role/permission row is touched.
 *
 * Accepts either shape the recovery link can hand back to the client:
 *  - `{ code }` — PKCE-style exchange (exchangeCodeForSession).
 *  - `{ accessToken, refreshToken }` — implicit-style token pair
 *    (setSession), the flow this app's server-side-only Supabase usage
 *    actually produces (src/lib/auth.ts never sets `flowType: 'pkce'`
 *    anywhere, and a PKCE code_verifier requires persistent browser
 *    storage this app's stateless server clients never have) — `code`
 *    is supported defensively in case that ever changes, not because
 *    it's the path this repo's own recovery emails take today.
 * src/pages/admin/reset-password.astro's own script is what extracts
 * whichever shape is present in the callback URL and posts it here.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createAnonClient, isSameOriginRequest } from '../../../lib/auth';
import {
  describePasswordUpdateError,
  isRecoverySession,
  validateNewPassword,
} from '../../../lib/password-reset';
import { checkRateLimit } from '../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../lib/request-limits';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const EXPIRED_MESSAGE =
  'This password reset link is invalid or has expired. Please request a new one.';

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
  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `reset-password:${ip}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many attempts. Please try again shortly.' }, 429);
  }

  const code = typeof input.code === 'string' ? input.code : '';
  const accessToken = typeof input.accessToken === 'string' ? input.accessToken : '';
  const refreshToken = typeof input.refreshToken === 'string' ? input.refreshToken : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const confirmPassword = typeof input.confirmPassword === 'string' ? input.confirmPassword : '';

  const passwordCheck = validateNewPassword(password, confirmPassword);
  if (!passwordCheck.valid) {
    return json({ success: false, error: passwordCheck.error }, 400);
  }
  if (!code && !(accessToken && refreshToken)) {
    return json({ success: false, error: EXPIRED_MESSAGE }, 400);
  }

  const client = createAnonClient();

  const exchange = code
    ? await client.auth.exchangeCodeForSession(code)
    : await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (exchange.error || !exchange.data.session) {
    return json({ success: false, error: EXPIRED_MESSAGE }, 400);
  }

  if (!isRecoverySession(exchange.data.session.access_token)) {
    return json({ success: false, error: EXPIRED_MESSAGE }, 400);
  }

  const { error: updateError } = await client.auth.updateUser({ password });
  if (updateError) {
    return json({ success: false, error: describePasswordUpdateError(updateError.message) }, 400);
  }

  // Revoke the recovery session immediately — it must not remain a
  // live, usable session after the password change it existed for.
  await client.auth.signOut();

  return json({ success: true }, 200);
};
