#!/usr/bin/env node
/**
 * Appends response-header rules to the Cloudflare `_headers` file the
 * @astrojs/cloudflare adapter already generates at dist/client/_headers
 * (it writes the immutable Cache-Control rule for /_astro/* there).
 *
 * Why this exists at all, instead of just doing everything in
 * src/middleware.ts: middleware only runs for requests Astro itself
 * routes (on-demand pages, API routes). Prerendered/static pages (the
 * shop pages, homepage) are pre-built HTML served directly from the
 * Cloudflare assets binding — confirmed empirically via `wrangler dev`
 * that even with wrangler.jsonc's `assets.run_worker_first: true`,
 * those responses never pass through Astro's middleware chain. The
 * `_headers` file is Cloudflare's own mechanism for attaching headers
 * to asset-binding-served responses, so it's the only way to cover
 * static routes; middleware.ts remains the mechanism for on-demand
 * routes. Together they cover every response. Cloudflare merges
 * headers from every matching `_headers` block for a given path, so
 * this file's `/*` rule and the adapter's own `/_astro/*` rule both
 * apply to files under /_astro/ without conflict.
 *
 * The CSP here intentionally differs from src/middleware.ts's — see
 * src/lib/security-headers.ts's file-level comment for the full
 * reasoning (short version: a script-src nonce is only meaningful for
 * content generated fresh per request; these routes are static HTML
 * baked once at build time from repo-owned data, never the database,
 * so their two known inline scripts are allowed via 'unsafe-inline'
 * instead of a build-time-shared nonce). STATIC_CSP below must be kept
 * in sync with src/lib/security-headers.ts's STATIC_CSP constant.
 *
 * Environment-aware, the same way src/lib/site-env.ts is for runtime
 * requests — but this file is baked at *build* time (there is no
 * request/hostname yet), so the signal has to be a build-time env var
 * instead. Defaults to staging (noindex, no HSTS) when SITE_ENV is
 * unset, which is correct for every build this project currently
 * produces (there is no separate production build process yet — see
 * the cutover plan, docs/planning/production-cutover-plan.md, for the
 * SITE_ENV=production step required at cutover). Fails safe: an unset
 * or unrecognized value is treated as "not production," never the
 * reverse.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const HEADERS_PATH = 'dist/client/_headers';
const isProduction = process.env.SITE_ENV === 'production';

// Keep in sync with src/lib/security-headers.ts's STATIC_CSP constant.
const STATIC_CSP = [
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

if (!existsSync(HEADERS_PATH)) {
  console.warn(`${HEADERS_PATH} not found — skipping (no static output to attach headers to).`);
  process.exit(0);
}

const existing = readFileSync(HEADERS_PATH, 'utf-8');
if (existing.includes('Content-Security-Policy')) {
  console.log(
    '_headers already contains launch-readiness rules — skipping to avoid duplicating them.',
  );
  process.exit(0);
}

const lines = [
  '/*',
  `  Content-Security-Policy: ${STATIC_CSP}`,
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  X-Content-Type-Options: nosniff',
  '  X-Frame-Options: DENY',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
];
if (!isProduction) {
  lines.push('  X-Robots-Tag: noindex, nofollow');
}
if (isProduction) {
  lines.push('  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload');
}

const text = '\n' + lines.join('\n') + '\n';
appendFileSync(HEADERS_PATH, text);
console.log(
  `Appended static-route header rules to ${HEADERS_PATH} (SITE_ENV=${process.env.SITE_ENV ?? '(unset -> staging: noindex, no HSTS)'}).`,
);
