/**
 * Dynamic sitemap — on-demand because it includes live published-
 * compound routes (queried the same way the directory page does, same
 * RLS boundary: anon key, status='published' only). Explicitly never
 * includes: draft compounds (excluded by the query itself, not a
 * filter after the fact), the dev-only erc-000 fixture route (it isn't
 * a real page outside the opt-in dev-fixture flag and is never returned
 * by this query either way), /shop/cart (session-specific, not
 * meaningful to index), or any /api/* route.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { hasSupabaseConfig, listPublishedCompounds } from '../lib/supabase';
import { PRODUCTS } from '../lib/shop-products';

function urlEntry(loc: string, changefreq: string, priority: string): string {
  return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export const GET: APIRoute = async ({ site }) => {
  const base = site?.toString().replace(/\/$/, '') ?? 'https://cloudpeptides.github.io';

  const staticEntries = [
    urlEntry(`${base}/`, 'weekly', '1.0'),
    urlEntry(`${base}/research/compounds`, 'daily', '0.9'),
    urlEntry(`${base}/shop`, 'weekly', '0.9'),
    urlEntry(`${base}/contact`, 'monthly', '0.5'),
  ];

  const productEntries = PRODUCTS.map((p) => urlEntry(`${base}/shop/${p.id}`, 'monthly', '0.7'));

  let compoundEntries: string[] = [];
  if (hasSupabaseConfig()) {
    try {
      const compounds = await listPublishedCompounds();
      compoundEntries = compounds.map((c) =>
        urlEntry(`${base}/research/compounds/${c.slug}`, 'weekly', '0.8'),
      );
    } catch {
      // Sitemap degrades to the static+product routes rather than 500ing
      // — a temporarily-stale sitemap is far better than none at all.
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticEntries, ...productEntries, ...compoundEntries].join('\n')}\n</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
