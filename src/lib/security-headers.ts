/**
 * Security-header definitions shared by src/middleware.ts (on-demand
 * routes — research profiles/directory, sitemap, API routes) and
 * scripts/postbuild-headers.mjs (prerendered/static routes — shop
 * pages, homepage), which duplicates the STATIC_CSP string below since
 * it runs as a plain post-build Node script outside the Vite/Astro
 * toolchain and can't import a .ts module directly. Keep the two in
 * sync if either changes.
 *
 * Two different Content-Security-Policy strings, not one, because of a
 * real constraint: a script-src nonce is only meaningfully protective
 * for content generated fresh per request. On-demand routes get a real
 * per-request random nonce (src/middleware.ts) because they render
 * database content (compound names, claim text) — the one place this
 * app actually has anything resembling untrusted/editorial input.
 * Prerendered routes (the shop catalog, sourced entirely from the
 * repo-owned src/lib/shop-products.ts, never the database) are static
 * HTML baked once at build time with no per-visitor randomness
 * available at all; wiring a build-time-shared nonce between the HTML
 * and the Cloudflare `_headers` file for that near-zero-risk surface
 * wasn't judged worth the added complexity, so those routes' CSP
 * allows 'unsafe-inline' for the two known static inline scripts
 * (BaseLayout's theme-flash-prevention bootstrap and JSON-LD block,
 * also used on these pages) instead.
 *
 * Both variants share the same allowlist reasoning for third-party
 * origins:
 *  - fonts.googleapis.com / fonts.gstatic.com — the Google Fonts
 *    <link> in BaseLayout.astro.
 *  - challenges.cloudflare.com — the Turnstile widget script/iframe
 *    (src/scripts/turnstile-widget.ts), loaded only once a sitekey is
 *    configured.
 *  - No Supabase origin is needed in connect-src: src/lib/supabase.ts
 *    is imported only from page frontmatter (server-side, runs in the
 *    Worker) and is never imported by any src/scripts/*.ts client
 *    bundle — confirmed there is no direct client-side fetch to
 *    Supabase anywhere in this app.
 */

export const SECURITY_HEADERS_BASE: Record<string, string> = {
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
};

export function buildDynamicCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self' https://challenges.cloudflare.com",
    'frame-src https://challenges.cloudflare.com',
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

// Kept in sync with scripts/postbuild-headers.mjs's STATIC_CSP constant.
export const STATIC_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com",
  'frame-src https://challenges.cloudflare.com',
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');
