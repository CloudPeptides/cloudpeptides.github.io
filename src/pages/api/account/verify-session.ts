/**
 * Completes email verification. Supabase's confirmation link redirects
 * the browser to /verify-email carrying either a PKCE `?code=` (server-
 * readable) or implicit-flow tokens in the URL *fragment* (`#access_
 * token=...`, never sent to any server — src/pages/verify-email.astro's
 * own inline script reads whichever shape is present and POSTs it
 * here). This route exchanges that for a real Supabase session and
 * establishes this app's own HttpOnly session cookies — the same
 * cookie-setting step src/pages/api/auth/login.ts performs after
 * signInWithPassword, just reached from a different starting point.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { buildSessionCookies, createAnonClient, isSameOriginRequest } from '../../../lib/auth';
import { checkRateLimit } from '../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../lib/request-limits';

function json(body: unknown, status: number, extraHeaders?: string[]): Response {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const cookie of extraHeaders ?? []) headers.append('Set-Cookie', cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

const EXPIRED_MESSAGE =
  'This verification link is invalid or has expired. Please sign in to request a new one.';

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
  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `verify-session:${ip}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many attempts. Please try again shortly.' }, 429);
  }

  const code = typeof input.code === 'string' ? input.code : '';
  const accessToken = typeof input.accessToken === 'string' ? input.accessToken : '';
  const refreshToken = typeof input.refreshToken === 'string' ? input.refreshToken : '';
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

  const cookies = buildSessionCookies(
    exchange.data.session.access_token,
    exchange.data.session.refresh_token,
    url.protocol === 'https:',
  );
  return json({ success: true }, 200, cookies);
};
