/**
 * Site-wide response middleware. Runs on every request — including
 * prerendered/static routes — because wrangler.jsonc sets
 * `assets.run_worker_first: true` specifically so this file can apply
 * headers uniformly rather than only to the on-demand routes Astro
 * middleware would otherwise cover.
 *
 * IMPORTANT, verified empirically (not assumed): prerendered/static
 * output is still served directly from the Cloudflare assets binding
 * and never actually reaches this file, even with run_worker_first —
 * confirmed via `wrangler dev` that a static route's response carries
 * none of the headers set below. This is also why every page this file
 * is meant to gate (see PUBLIC_PATHS below) MUST declare
 * `export const prerender = false` — a page left statically prerendered
 * bypasses this file, and therefore the auth gate, entirely, regardless
 * of what this file says about it. src/pages/terms.astro, privacy.astro,
 * and research-use-policy.astro are the deliberate exception: they are
 * meant to be public, so staying prerendered (faster, simpler) is fine
 * for them specifically.
 *
 * Mandatory researcher-account gate (2026-08-13, approved): every
 * route in the app now requires a signed-in, non-suspended session by
 * default — the previous version of this file only gated /admin* and
 * /api/admin/*. PUBLIC_PATHS below is the complete, explicit allow-list
 * of what an unauthenticated visitor may still reach; everything else
 * is protected, including routes added after this comment was written
 * (deny-by-default, not deny-by-enumeration of what's sensitive).
 */
import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { isIndexableHost, isStagingReadOnly } from './lib/site-env';
import { SECURITY_HEADERS_BASE, buildDynamicCsp } from './lib/security-headers';
import {
  clearSessionCookies,
  createUserScopedClient,
  hasMinRole,
  resolveSession,
} from './lib/auth';
import { getLatestAttestation, getResearcherProfile } from './lib/researcher';
import { needsCertification } from './lib/researcher-certification';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

// /admin/login and its own password-recovery pages must stay reachable
// without a session (a locked-out admin has no session by definition).
const PUBLIC_ADMIN_PATHS = new Set([
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
]);

// The public researcher-account gate's own entry points, plus the
// legal pages a visitor must be able to read before creating an
// account. /certify is deliberately NOT here — it requires a session
// (an uncertified researcher is still authenticated), it just skips the
// *certification* check specifically (see isCertifyPath below).
const PUBLIC_ACCOUNT_PATHS = new Set([
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
  '/research-use-policy',
  '/404',
  '/robots.txt',
  '/sitemap.xml',
]);

// Unauthenticated-callable API routes — the actions that establish or
// recover a session in the first place. Every other /api/* route
// requires a session, admin ones additionally requiring contributor+.
const PUBLIC_API_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/account/register',
  '/api/account/login',
  '/api/account/forgot-password',
  '/api/account/reset-password',
  '/api/account/verify-session',
]);

// Astro's static output serves prerendered pages at their directory-
// index URL (/privacy/index.html) and redirects the bare, no-slash
// request to it — found live: that redirect target IS a real request
// this middleware evaluates, so '/privacy' and '/privacy/' must both be
// recognized as the same public path, or the second hop (the one that
// actually renders content) gets wrongly treated as protected. On-
// demand routes never hit this (Astro doesn't append a trailing slash
// to those), but normalizing here costs nothing and is correct for
// both kinds of route either way.
function normalizePathname(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function isPublicPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return (
    PUBLIC_ADMIN_PATHS.has(normalized) ||
    PUBLIC_ACCOUNT_PATHS.has(normalized) ||
    PUBLIC_API_PATHS.has(normalized)
  );
}

function isProtectedAdminPage(pathname: string): boolean {
  return pathname.startsWith('/admin') && !PUBLIC_ADMIN_PATHS.has(pathname);
}

function isProtectedAdminApi(pathname: string): boolean {
  return pathname.startsWith('/api/admin');
}

function isApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

function jsonResponse(body: unknown, status: number, extraHeaders: string[]): Response {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const cookie of extraHeaders) headers.append('Set-Cookie', cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

function redirectTo(target: string, url: URL, extraHeaders: string[]): Response {
  const redirectUrl = new URL(target, url);
  const headers = new Headers({ Location: redirectUrl.toString() });
  for (const cookie of extraHeaders) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 302, headers });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const indexable = isIndexableHost(context.url.hostname, context.site);
  const nonce = generateNonce();
  context.locals.indexable = indexable;
  context.locals.cspNonce = nonce;
  context.locals.session = null;
  context.locals.stagingReadOnly = isStagingReadOnly(env.STAGING_READ_ONLY);

  const pathname = context.url.pathname;
  const secureCookies = context.url.protocol === 'https:';

  // Session is resolved for every request now (not just /admin*) — the
  // site-wide gate needs to know "who is this" before deciding whether
  // to let a request through at all.
  const resolved = await resolveSession(context.request.headers.get('cookie'), secureCookies);
  context.locals.session = resolved.session;
  const sessionSetCookies: string[] = resolved.setCookies;

  const publicPath = isPublicPath(pathname);

  if (!publicPath) {
    const isAdminArea = isProtectedAdminPage(pathname) || isProtectedAdminApi(pathname);

    // Admin-area role check — checked BEFORE the generic "no session"
    // branch below, and independent of whether a session exists at
    // all, so both "no session" and "signed in, but not contributor+"
    // land on /admin/login (never /login — a plain researcher session
    // hitting /admin/login must see the ordinary sign-in form, not get
    // sent back into this very check in a loop; see admin/login.astro's
    // own matching fix).
    if (isAdminArea) {
      const authorized = hasMinRole(resolved.session?.role, 'contributor');
      if (!authorized) {
        if (isProtectedAdminApi(pathname)) {
          return jsonResponse(
            { success: false, error: 'Authentication required.' },
            resolved.session ? 403 : 401,
            sessionSetCookies,
          );
        }
        const redirectUrl = new URL('/admin/login', context.url);
        redirectUrl.searchParams.set('next', pathname);
        return redirectTo(
          redirectUrl.pathname + redirectUrl.search,
          context.url,
          sessionSetCookies,
        );
      }

      // Shared-database staging/production write boundary — unchanged.
      const STAGING_READ_ONLY_EXEMPT_PREFIX = '/api/admin/pricing-catalog';
      if (
        isProtectedAdminApi(pathname) &&
        !SAFE_METHODS.has(context.request.method) &&
        isStagingReadOnly(env.STAGING_READ_ONLY) &&
        !pathname.startsWith(STAGING_READ_ONLY_EXEMPT_PREFIX)
      ) {
        return jsonResponse(
          {
            success: false,
            error:
              'This deployment is read-only. Staging and production share one database; make editorial changes on the production site instead.',
          },
          403,
          sessionSetCookies,
        );
      }
    } else if (!resolved.session) {
      if (isApiPath(pathname)) {
        return jsonResponse(
          { success: false, error: 'Authentication required.' },
          401,
          sessionSetCookies,
        );
      }
      const redirectUrl = new URL('/login', context.url);
      redirectUrl.searchParams.set('next', pathname);
      return redirectTo(redirectUrl.pathname + redirectUrl.search, context.url, sessionSetCookies);
    } else if (!hasMinRole(resolved.session.role, 'contributor')) {
      // Every other protected route, reached by a plain researcher
      // ('member') account: enforce suspension + certification. Staff
      // roles (contributor+) skip this entirely — they are not
      // researcher accounts and carry no researcher_profiles row.
      const isCertifyPath = pathname === '/certify' || pathname === '/api/account/certify';
      try {
        const client = createUserScopedClient(resolved.session.accessToken);
        const profile = await getResearcherProfile(client, resolved.session.userId);

        if (profile?.account_status === 'suspended') {
          const clearCookies = clearSessionCookies(secureCookies);
          if (isApiPath(pathname)) {
            return jsonResponse(
              { success: false, error: 'This account has been suspended.' },
              403,
              clearCookies,
            );
          }
          const redirectUrl = new URL('/login', context.url);
          redirectUrl.searchParams.set('error', 'suspended');
          return redirectTo(redirectUrl.pathname + redirectUrl.search, context.url, clearCookies);
        }

        if (!isCertifyPath) {
          const latest = await getLatestAttestation(client, resolved.session.userId);
          if (needsCertification(latest, profile?.force_recertify_after ?? null)) {
            if (isApiPath(pathname)) {
              return jsonResponse(
                { success: false, error: 'Researcher certification required.' },
                403,
                sessionSetCookies,
              );
            }
            const redirectUrl = new URL('/certify', context.url);
            redirectUrl.searchParams.set('next', pathname);
            return redirectTo(
              redirectUrl.pathname + redirectUrl.search,
              context.url,
              sessionSetCookies,
            );
          }
        }
      } catch (err) {
        // A transient DB/RLS failure here must fail closed (deny), not
        // silently let an unverified researcher through — this is the
        // one place in this file where "can't tell" and "not allowed"
        // are treated the same.
        console.error('researcher gate check failed:', err instanceof Error ? err.message : err);
        if (isApiPath(pathname)) {
          return jsonResponse(
            { success: false, error: 'Please try again.' },
            503,
            sessionSetCookies,
          );
        }
        return new Response('Something went wrong. Please try again.', {
          status: 503,
          headers: new Headers({ 'Content-Type': 'text/plain' }),
        });
      }
    }
  }

  const response = await next();

  const headers = new Headers(response.headers);
  for (const cookie of sessionSetCookies) headers.append('Set-Cookie', cookie);
  for (const [name, value] of Object.entries(SECURITY_HEADERS_BASE)) {
    headers.set(name, value);
  }
  headers.set('Content-Security-Policy', buildDynamicCsp(nonce));
  // Every protected page is inherently non-indexable regardless of host
  // (a crawler is never authenticated, so it would only ever see the
  // login redirect anyway) — noindex is set for anything outside the
  // small public allow-list, on top of the existing !indexable rule.
  if (!indexable || !publicPath) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  if (indexable && context.url.protocol === 'https:') {
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
