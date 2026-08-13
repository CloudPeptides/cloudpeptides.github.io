/**
 * Public password-reset completion — researcher-account recovery.
 * Identical logic to src/pages/api/auth/reset-password.ts (the admin
 * equivalent); see that file's header comment for the full reasoning
 * behind the code/token-pair handling and the isRecoverySession check.
 * Kept as a separate route only so a researcher's reset flow never
 * shares a URL/route with the admin one.
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
  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `account-reset-password:${ip}`);
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

  await client.auth.signOut();

  return json({ success: true }, 200);
};
