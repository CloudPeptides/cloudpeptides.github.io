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
