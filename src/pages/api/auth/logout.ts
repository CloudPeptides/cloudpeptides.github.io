/**
 * Admin sign-out. Best-effort revocation at Supabase (so the refresh
 * token can't be replayed after logout) followed by an unconditional
 * cookie clear — the cookie clear always happens even if the revoke
 * call fails, so a signed-out browser is never left holding a cookie
 * it believes is still valid.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import {
  clearSessionCookies,
  createAnonClient,
  isSameOriginRequest,
  readSessionCookies,
} from '../../../lib/auth';

function json(body: unknown, status: number, extraHeaders: string[]): Response {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const cookie of extraHeaders) headers.append('Set-Cookie', cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

export const POST: APIRoute = async ({ request, url }) => {
  const secure = url.protocol === 'https:';
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403, []);
  }

  const { accessToken, refreshToken } = readSessionCookies(request.headers.get('cookie'));
  if (accessToken && refreshToken) {
    try {
      const client = createAnonClient();
      await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      await client.auth.signOut();
    } catch {
      // Best-effort — cookies are cleared below regardless.
    }
  }

  return json({ success: true }, 200, clearSessionCookies(secure));
};
