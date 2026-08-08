/**
 * Server-side session handling for the admin dashboard — Supabase Auth,
 * email/password, cookie-based JWT session. This is the ONLY place that
 * decides "who is making this request" for every /admin page and
 * /api/admin/* route (src/middleware.ts calls resolveSession(); routes
 * that need finer-grained checks call requireRole() themselves).
 *
 * Security model (CLAUDE.md §8, Blueprint v2 §16):
 *  - The access-token cookie is never trusted at face value. Every
 *    request re-verifies it against Supabase Auth itself
 *    (`auth.getUser(token)` — a real network check that the token is
 *    genuine, unexpired, and unrevoked) before reading anything out of
 *    it. Only *after* that verification do we decode the token's own
 *    payload to read the `user_role` custom claim the Custom Access
 *    Token Hook embedded at login (that claim cannot be forged by a
 *    client — it's inside the Supabase-signed JWT).
 *  - Ordinary editorial writes use createUserScopedClient(), which
 *    attaches the acting user's own verified access token as the
 *    Authorization header — every such write is enforced by Postgres
 *    RLS as that user, not by anything in this file. This file's own
 *    hasMinRole()/requireRole() checks are a second, defense-in-depth
 *    layer that produces a clear 401/403 instead of an opaque RLS
 *    error — never a substitute for RLS.
 *  - createServiceClient() (the service-role key) is reserved for the
 *    narrowly-scoped, already-authorized-as-admin routes that manage
 *    user_roles itself (src/pages/api/admin/users/*) — user_roles has
 *    no client INSERT/UPDATE/DELETE grant at all (Phase 2 migrations),
 *    so no other path is even possible.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from 'cloudflare:workers';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseConfig(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export const ACCESS_COOKIE = 'cp-admin-at';
export const REFRESH_COOKIE = 'cp-admin-rt';

// Matches supabase/config.toml's auth.jwt_expiry (3600s). The refresh
// cookie is long-lived — the access cookie is what actually gates
// anything, and it's re-verified server-side on every request anyway.
const ACCESS_MAX_AGE = 3600;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export type Role = 'member' | 'contributor' | 'editor' | 'admin';

// Mirrors supabase/migrations/20260806144902_roles_and_security.sql's
// role_rank() exactly — kept in sync by hand since this app has no
// generated-types pipeline (see database.types.ts's own header comment).
const ROLE_RANK: Record<Role, number> = { member: 1, contributor: 2, editor: 3, admin: 4 };

export function hasMinRole(role: Role | null | undefined, min: Role): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

function isRole(value: unknown): value is Role {
  return value === 'member' || value === 'contributor' || value === 'editor' || value === 'admin';
}

/** Cookies are Secure only over a real HTTPS request — required so
 * login still works under plain-http local dev (`astro dev`); the
 * deployed staging Worker is always HTTPS, so this is never relaxed
 * there. Mirrors the same environment-aware reasoning already used by
 * src/middleware.ts's HSTS-only-when-https guard. */
function cookieAttrs(maxAge: number, secure: boolean): string {
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

export function buildSessionCookies(
  accessToken: string,
  refreshToken: string,
  secure: boolean,
): string[] {
  return [
    `${ACCESS_COOKIE}=${accessToken}; ${cookieAttrs(ACCESS_MAX_AGE, secure)}`,
    `${REFRESH_COOKIE}=${refreshToken}; ${cookieAttrs(REFRESH_MAX_AGE, secure)}`,
  ];
}

export function clearSessionCookies(secure: boolean): string[] {
  return [
    `${ACCESS_COOKIE}=; ${cookieAttrs(0, secure)}`,
    `${REFRESH_COOKIE}=; ${cookieAttrs(0, secure)}`,
  ];
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function readSessionCookies(cookieHeader: string | null): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  return {
    accessToken: readCookie(cookieHeader, ACCESS_COOKIE),
    refreshToken: readCookie(cookieHeader, REFRESH_COOKIE),
  };
}

/** Reads the `user_role` custom claim out of an already-verified access
 * token. Never call this on a token that hasn't just been confirmed
 * genuine via verifyAccessToken()/refreshSession() below — decoding a
 * JWT's payload proves nothing about its authenticity by itself. */
function decodeJwtRole(accessToken: string): Role {
  try {
    const payload = accessToken.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json) as { user_role?: unknown };
    return isRole(claims.user_role) ? claims.user_role : 'member';
  } catch {
    return 'member';
  }
}

function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function verifyAccessToken(
  accessToken: string,
): Promise<{ userId: string; email: string | null } | null> {
  const { data, error } = await anonClient().auth.getUser(accessToken);
  if (error || !data.user) return null;
  return { userId: data.user.id, email: data.user.email ?? null };
}

async function refreshWithToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string | null;
} | null> {
  const { data, error } = await anonClient().auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) return null;
  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    userId: data.session.user.id,
    email: data.session.user.email ?? null,
  };
}

export interface Session {
  userId: string;
  email: string | null;
  role: Role;
  accessToken: string;
}

export interface ResolvedSession {
  session: Session | null;
  /** Non-empty only when a refresh actually happened this request —
   * the caller (middleware) must attach these as Set-Cookie headers on
   * the outgoing response. */
  setCookies: string[];
}

/**
 * Resolves the current request's session from its cookies. Verifies
 * the access token server-side; if it's missing/expired, transparently
 * refreshes using the refresh-token cookie so a session doesn't drop a
 * signed-in editor mid-session just because an hour passed.
 */
export async function resolveSession(
  cookieHeader: string | null,
  secureCookies: boolean,
): Promise<ResolvedSession> {
  if (!hasSupabaseConfig()) return { session: null, setCookies: [] };
  const { accessToken, refreshToken } = readSessionCookies(cookieHeader);

  if (accessToken) {
    const verified = await verifyAccessToken(accessToken);
    if (verified) {
      return {
        session: { ...verified, role: decodeJwtRole(accessToken), accessToken },
        setCookies: [],
      };
    }
  }

  if (refreshToken) {
    const refreshed = await refreshWithToken(refreshToken);
    if (refreshed) {
      return {
        session: {
          userId: refreshed.userId,
          email: refreshed.email,
          role: decodeJwtRole(refreshed.accessToken),
          accessToken: refreshed.accessToken,
        },
        setCookies: buildSessionCookies(
          refreshed.accessToken,
          refreshed.refreshToken,
          secureCookies,
        ),
      };
    }
  }

  return { session: null, setCookies: [] };
}

/** A client scoped to the acting user's own verified JWT — RLS is the
 * real authorization boundary for every call made through this. */
export function createUserScopedClient(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/** Plain anon-key client with no session — used only for the login
 * route's signInWithPassword() call. */
export function createAnonClient(): SupabaseClient {
  return anonClient();
}

/** Service-role client — bypasses RLS entirely. Reserved for
 * src/pages/api/admin/users/* (the only tables with zero client write
 * grant: user_roles, audit_log). Never used for ordinary editorial
 * content. Throws rather than silently no-op if the secret isn't
 * configured in this environment (never written to any file — set via
 * `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`). */
export function createServiceClient(): SupabaseClient {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured in this environment.');
  }
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Lightweight CSRF defense for cookie-authenticated state-changing
 * requests: the SameSite=Lax cookie already blocks the browser from
 * attaching it to a cross-site POST, but browsers still send it on
 * top-level cross-site navigations/GETs — this adds an explicit
 * same-origin check for any request carrying an Origin header (every
 * real fetch() from this app's own admin scripts sends one). A request
 * with no Origin header at all (some non-fetch same-site navigations)
 * is allowed through and relies on SameSite=Lax alone, to avoid
 * breaking legitimate same-site requests that don't set it.
 */
export function isSameOriginRequest(request: Request, url: URL): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === url.origin;
  } catch {
    return false;
  }
}
