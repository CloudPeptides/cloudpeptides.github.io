/**
 * Sign-out (shared by /admin and the public researcher-account gate —
 * this route is role-agnostic, see src/scripts/account-logout.ts and
 * admin's own logout button). Best-effort revocation at Supabase (so
 * the refresh token can't be replayed after logout) followed by an
 * unconditional cookie clear — the cookie clear always happens even if
 * the revoke call fails, so a signed-out browser is never left holding
 * a cookie it believes is still valid.
 *
 * `scope: 'local'` is deliberate, not the supabase-js default: plain
 * signOut() defaults to `scope: 'global'`, which revokes EVERY active
 * session for that user account — every other device/browser/tab that
 * happens to be signed in as the same user gets logged out too. Found
 * live while investigating a real e2e-suite failure cascade: two
 * concurrent sessions for the same test account, one signing out with
 * the default global scope, silently invalidated the other mid-test.
 * 'local' revokes only the session tied to the token pair actually
 * presented to this request — the correct behavior for an ordinary
 * "sign out on this device" action either way, not just a test fix.
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
      await client.auth.signOut({ scope: 'local' });
    } catch {
      // Best-effort — cookies are cleared below regardless.
    }
  }

  return json({ success: true }, 200, clearSessionCookies(secure));
};
