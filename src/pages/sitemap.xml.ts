/**
 * Sitemap — mandatory researcher-account gate (2026-08-13): every
 * research/shop/COA/legal-adjacent route this file used to list is now
 * behind an authentication wall (src/middleware.ts), and a crawler is
 * never authenticated. Listing a protected URL here would only ever
 * send a bot into a redirect loop to /login — worse than useless for
 * SEO purposes, and the previous behavior (listing all published
 * compounds + every shop product) would actively advertise the exact
 * URL shape of gated content to anyone reading this file, unauthenticated,
 * for no benefit. This sitemap now lists only the small set of pages an
 * unauthenticated visitor (human or crawler) can actually reach:
 * /login, /register, and the three legal documents required to be
 * public before registration.
 */
export const prerender = false;

import type { APIRoute } from 'astro';

function urlEntry(loc: string, changefreq: string, priority: string): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export const GET: APIRoute = ({ site }) => {
  const base = site?.toString().replace(/\/$/, '') ?? 'https://cloudpeptides.org';

  const entries = [
    urlEntry(`${base}/login`, 'monthly', '1.0'),
    urlEntry(`${base}/register`, 'monthly', '0.9'),
    urlEntry(`${base}/terms`, 'yearly', '0.3'),
    urlEntry(`${base}/privacy`, 'yearly', '0.3'),
    urlEntry(`${base}/research-use-policy`, 'yearly', '0.3'),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
