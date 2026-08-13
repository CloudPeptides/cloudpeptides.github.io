/**
 * Environment-aware robots.txt. Mandatory researcher-account gate
 * (2026-08-13): the production behavior below changed from "Allow: /"
 * to an explicit allow-list of only the pages an unauthenticated
 * crawler can actually reach (src/middleware.ts's PUBLIC_ACCOUNT_PATHS)
 * — everything else on the site now requires a signed-in, certified
 * researcher account, and a search engine can never hold one. Listing
 * protected paths as crawlable would just send bots into a redirect
 * loop to /login; disallowing them here is the honest, correct
 * description of what's actually publicly reachable. Non-production
 * hosts (the staging Worker) are unchanged: fully disallowed either way.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { isIndexableHost } from '../lib/site-env';

export const GET: APIRoute = ({ site, url }) => {
  const siteBase = site?.toString().replace(/\/$/, '') ?? 'https://cloudpeptides.org';
  const indexable = isIndexableHost(url.hostname, site);

  const body = indexable
    ? `User-agent: *\nAllow: /login\nAllow: /register\nAllow: /verify-email\nAllow: /forgot-password\nAllow: /reset-password\nAllow: /terms\nAllow: /privacy\nAllow: /research-use-policy\nDisallow: /\n\nSitemap: ${siteBase}/sitemap.xml\n`
    : `# Staging environment — intentionally excluded from search indexing so it never\n# competes with the production domain (${siteBase}). The sitemap below is left\n# reachable for manual testing only; it is not an invitation to crawl.\nUser-agent: *\nDisallow: /\n\nSitemap: https://${url.hostname}/sitemap.xml\n`;

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
