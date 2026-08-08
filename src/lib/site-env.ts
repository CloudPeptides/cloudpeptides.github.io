/**
 * Single source of truth for "is this request running on the intended
 * production host" — used by middleware.ts (X-Robots-Tag header),
 * robots.txt.ts (crawl rules), and BaseLayout.astro (the <meta
 * name="robots"> fallback). Deliberately host-based rather than an env
 * var the deploy config has to remember to set correctly: astro.config.
 * mjs's `site` already names the one domain this app is allowed to
 * consider "production" (it's also what canonical URLs and the sitemap
 * are built from), so comparing the live request's hostname against it
 * is a single fact that can't drift out of sync with itself. The
 * *.workers.dev staging Worker's hostname will never equal that
 * configured site, so it fails safe to "not indexable" with zero
 * per-environment configuration.
 *
 * `site` is now the real, purchased production domain
 * (cloudpeptides.org, purchased 2026-08-07) — but that domain is not
 * yet attached to any Worker and its DNS/nameserver propagation to
 * Cloudflare is still pending, so nothing currently live can actually
 * be reached at that hostname. This function is exactly what keeps
 * that safe: the staging Worker's real hostname
 * (cloudpeptides-staging.jessica-holsopple3.workers.dev) never equals
 * `site`, so it stays noindexed and Disallow: / regardless of `site`'s
 * value. At cutover, once a production Worker is actually bound to
 * cloudpeptides.org, indexing turns on automatically with no code
 * change here, the same way canonical URLs already work.
 */
export function isIndexableHost(
  requestHostname: string,
  siteUrl: URL | string | undefined,
): boolean {
  if (!siteUrl) return false;
  const site = typeof siteUrl === 'string' ? new URL(siteUrl) : siteUrl;
  return requestHostname.toLowerCase() === site.hostname.toLowerCase();
}

/**
 * Whether this deployment must refuse every database write — the
 * safety boundary for the shared-database architecture decided
 * 2026-08-08 (docs/planning/production-cutover-plan.md §1): staging
 * and production now point at the *same* Supabase project
 * (`riuxojncmnhogclrhoys`), so nothing at the database/RLS layer can
 * tell staging and production traffic apart — a contributor/editor/
 * admin JWT is equally "real" no matter which Worker issued the
 * request. This is the application-level control that fills that gap:
 * once production launches, the staging Worker gets
 * `STAGING_READ_ONLY=true` (a plain Worker var, not a secret — see
 * wrangler.jsonc) and src/middleware.ts refuses every non-GET
 * `/api/admin/*` request regardless of the caller's role.
 *
 * Deliberately a plain string-equality check on the raw env value
 * (never assumed to already be boolean — Cloudflare Worker vars are
 * always strings) and defaults to `false` (writable) for anything
 * other than the exact string `"true"`, including unset/undefined —
 * fails toward "staging behaves as it does today," not toward
 * silently locking out ongoing editorial work before cutover.
 */
export function isStagingReadOnly(rawValue: string | undefined): boolean {
  return rawValue === 'true';
}
