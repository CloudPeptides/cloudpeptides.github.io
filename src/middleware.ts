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

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const indexable = isIndexableHost(context.url.hostname, context.site);
  const nonce = generateNonce();
  context.locals.indexable = indexable;
  context.locals.cspNonce = nonce;

  const response = await next();

  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS_BASE)) {
    headers.set(name, value);
  }
  headers.set('Content-Security-Policy', buildDynamicCsp(nonce));
  if (!indexable) {
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
