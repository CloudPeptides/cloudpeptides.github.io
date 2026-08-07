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
 * per-environment configuration — and at cutover, once the Worker is
 * actually bound to the real production domain, indexing turns on
 * automatically with no code change, the same way canonical URLs already
 * work.
 */
export function isIndexableHost(
  requestHostname: string,
  siteUrl: URL | string | undefined,
): boolean {
  if (!siteUrl) return false;
  const site = typeof siteUrl === 'string' ? new URL(siteUrl) : siteUrl;
  return requestHostname.toLowerCase() === site.hostname.toLowerCase();
}
