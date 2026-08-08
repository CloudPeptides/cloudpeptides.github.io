/**
 * Environment-aware robots.txt. Replaces the previous static
 * public/robots.txt (which had no way to differ between the staging
 * Worker and eventual production) — on-demand so it can read the live
 * request's hostname via src/lib/site-env.ts, the same signal
 * middleware.ts uses for the X-Robots-Tag header. Production behavior
 * (Allow: / + sitemap reference) is unchanged from the prior static
 * file; on any non-production host — concretely, right now, the
 * cloudpeptides-staging *.workers.dev Worker — it instead disallows
 * everything, so this stays correct with zero changes at cutover.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { isIndexableHost } from '../lib/site-env';

export const GET: APIRoute = ({ site, url }) => {
  const siteBase = site?.toString().replace(/\/$/, '') ?? 'https://cloudpeptides.org';
  const indexable = isIndexableHost(url.hostname, site);

  const body = indexable
    ? `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /shop/cart\n\nSitemap: ${siteBase}/sitemap.xml\n`
    : `# Staging environment — intentionally excluded from search indexing so it never\n# competes with the production domain (${siteBase}). The sitemap below is left\n# reachable for manual testing only; it is not an invitation to crawl.\nUser-agent: *\nDisallow: /\n\nSitemap: https://${url.hostname}/sitemap.xml\n`;

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
