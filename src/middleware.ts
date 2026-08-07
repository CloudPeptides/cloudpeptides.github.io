/**
 * Site-wide response middleware. Runs on every request — including
 * prerendered/static routes — because wrangler.jsonc sets
 * `assets.run_worker_first: true` specifically so this file can apply
 * headers uniformly rather than only to the on-demand routes Astro
 * middleware would otherwise cover.
 *
 * IMPORTANT, verified empirically (not assumed): prerendered/static
 * output (the shop pages, homepage) is still served directly from the
 * Cloudflare assets binding and never actually reaches this file, even
 * with run_worker_first — confirmed via `wrangler dev` that a static
 * route's response carries none of the headers set below. Those routes
 * get their own copy of the same headers via the Cloudflare `_headers`
 * mechanism instead (scripts/postbuild-headers.mjs, appended to
 * dist/client/_headers after build). This file is the source of truth
 * for on-demand routes: the research directory/profiles, sitemap,
 * robots.txt, and the API routes — everywhere real per-request
 * variation (a nonce, a request-specific noindex decision) matters.
 */
import { defineMiddleware } from 'astro:middleware';
import { isIndexableHost } from './lib/site-env';
import { SECURITY_HEADERS_BASE, buildDynamicCsp } from './lib/security-headers';
import { hasMinRole, resolveSession } from './lib/auth';

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

// /admin/login must stay reachable without a session (it's how you get
// one); every other /admin/* page requires a signed-in, contributor+
// account. /api/auth/* (login/logout themselves) are deliberately NOT
// under /api/admin, so they're never gated here either.
const PUBLIC_ADMIN_PATHS = new Set(['/admin/login']);

function isProtectedAdminPage(pathname: string): boolean {
  return pathname.startsWith('/admin') && !PUBLIC_ADMIN_PATHS.has(pathname);
}

function isProtectedAdminApi(pathname: string): boolean {
  return pathname.startsWith('/api/admin');
}

export const onRequest = defineMiddleware(async (context, next) => {
  const indexable = isIndexableHost(context.url.hostname, context.site);
  const nonce = generateNonce();
  context.locals.indexable = indexable;
  context.locals.cspNonce = nonce;
  context.locals.session = null;

  const pathname = context.url.pathname;
  // Resolved for every /admin* path, including /admin/login itself —
  // that page needs to know "is someone already signed in" to redirect
  // them straight through rather than show the form again. Only
  // isProtectedAdminPage()/isProtectedAdminApi() paths actually enforce
  // the redirect-or-401 below.
  const needsSession = pathname.startsWith('/admin') || isProtectedAdminApi(pathname);
  let sessionSetCookies: string[] = [];

  if (needsSession) {
    const secureCookies = context.url.protocol === 'https:';
    const resolved = await resolveSession(context.request.headers.get('cookie'), secureCookies);
    context.locals.session = resolved.session;
    sessionSetCookies = resolved.setCookies;

    // Baseline gate only: "signed in, at least contributor." Individual
    // /api/admin/* routes and /admin/* pages still perform their own
    // finer-grained role check (editor for publish, admin for user
    // management) — this is deliberately not the only place authorization
    // happens (CLAUDE.md §8: never rely on a single client-facing check).
    // /admin/login itself is exempt from this enforcement (it still
    // resolves the session above, purely so the login page can bounce an
    // already-authenticated visitor onward).
    const enforced = isProtectedAdminPage(pathname) || isProtectedAdminApi(pathname);
    const authorized = !enforced || hasMinRole(resolved.session?.role, 'contributor');
    if (!authorized) {
      if (isProtectedAdminApi(pathname)) {
        const headers = new Headers({ 'Content-Type': 'application/json' });
        for (const cookie of sessionSetCookies) headers.append('Set-Cookie', cookie);
        return new Response(JSON.stringify({ success: false, error: 'Authentication required.' }), {
          status: resolved.session ? 403 : 401,
          headers,
        });
      }
      const redirectUrl = new URL('/admin/login', context.url);
      redirectUrl.searchParams.set('next', pathname);
      const headers = new Headers({ Location: redirectUrl.toString() });
      for (const cookie of sessionSetCookies) headers.append('Set-Cookie', cookie);
      return new Response(null, { status: 302, headers });
    }
  }

  const response = await next();

  const headers = new Headers(response.headers);
  for (const cookie of sessionSetCookies) headers.append('Set-Cookie', cookie);
  for (const [name, value] of Object.entries(SECURITY_HEADERS_BASE)) {
    headers.set(name, value);
  }
  headers.set('Content-Security-Policy', buildDynamicCsp(nonce));
  if (!indexable || pathname.startsWith('/admin')) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  // HSTS only makes sense — and is only safe — on the actual production
  // hostname. *.workers.dev is a shared, multi-tenant Cloudflare domain;
  // sending Strict-Transport-Security there is harmless in isolation but
  // adds nothing (Cloudflare already enforces HTTPS on it) and this
  // guard is what keeps it from ever being sent with `includeSubDomains`
  // against a domain this app doesn't own the whole of. On the real
  // production host it's fully appropriate.
  if (indexable && context.url.protocol === 'https:') {
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
