/**
 * Legacy GitHub Pages URL → new-site path redirects (CLAUDE.md §10:
 * "Preserve every legacy URL via documented permanent (301) redirects
 * at cutover"). Transcribed exactly from
 * docs/planning/legacy-redirect-map.md — that document is the source
 * of truth (generated from the real migration extraction and the real
 * shop catalog); keep the two in sync if either changes.
 *
 * Deliberately excludes every URL in that document's remaining "Not
 * yet migrated" entries (faq/research/category-listing pages) — no
 * rebuilt equivalent exists for those yet, so redirecting them now
 * would send a visitor to a 404 instead of GitHub Pages' still-live
 * original. `/about.html` was in that list until src/pages/about.astro
 * shipped; add further entries here only once each real replacement
 * page ships.
 *
 * Consumed by src/pages/product.html.astro and
 * src/pages/[legacy].html.astro — real, matched Astro routes, not
 * src/middleware.ts (see product.html.astro's header comment for why:
 * Cloudflare's Workers Static Assets binding intercepts any path with
 * no matching static file before the Worker/middleware ever runs,
 * confirmed live). Runs on every environment, not gated to the
 * production hostname — a legacy path redirecting to its new
 * equivalent is correct regardless of which host serves it, and
 * running it on staging too means it's already proven working before
 * cutover ever needs it.
 */

export const LEGACY_PATH_REDIRECTS: Record<string, string> = {
  // Research compound/stack pages (56) — legacy `/{file}.html` -> new
  // `/research/compounds/{slug}` (slug = filename minus .html, no renames).
  '/5-amino-1mq.html': '/research/compounds/5-amino-1mq',
  '/adamax.html': '/research/compounds/adamax',
  '/ahk-cu.html': '/research/compounds/ahk-cu',
  '/aicar.html': '/research/compounds/aicar',
  '/aod-9604.html': '/research/compounds/aod-9604',
  '/ara-290.html': '/research/compounds/ara-290',
  '/botulinum-toxin.html': '/research/compounds/botulinum-toxin',
  '/bpc-157.html': '/research/compounds/bpc-157',
  '/bpc-157-tb-500.html': '/research/compounds/bpc-157-tb-500',
  '/cagrilintide.html': '/research/compounds/cagrilintide',
  '/calm-focus-stack.html': '/research/compounds/calm-focus-stack',
  '/cartalax.html': '/research/compounds/cartalax',
  '/cerebrolysin.html': '/research/compounds/cerebrolysin',
  '/cjc-1295-dac.html': '/research/compounds/cjc-1295-dac',
  '/cjc-1295-no-dac.html': '/research/compounds/cjc-1295-no-dac',
  '/cjc-1295-no-dac-ipamorelin.html': '/research/compounds/cjc-1295-no-dac-ipamorelin',
  '/dsip.html': '/research/compounds/dsip',
  '/elite-anti-aging-stack.html': '/research/compounds/elite-anti-aging-stack',
  '/enhanced-sleep-stack.html': '/research/compounds/enhanced-sleep-stack',
  '/epithalon-compound.html': '/research/compounds/epithalon-compound',
  '/ghk-cu.html': '/research/compounds/ghk-cu',
  '/glow-blend.html': '/research/compounds/glow-blend',
  '/glutathione.html': '/research/compounds/glutathione',
  '/growth-hormone-fat-loss-stack.html': '/research/compounds/growth-hormone-fat-loss-stack',
  '/growth-hormone-muscle-building-stack.html':
    '/research/compounds/growth-hormone-muscle-building-stack',
  '/hcg.html': '/research/compounds/hcg',
  '/igf-1-lr3.html': '/research/compounds/igf-1-lr3',
  '/ipamorelin.html': '/research/compounds/ipamorelin',
  '/kisspeptin-10.html': '/research/compounds/kisspeptin-10',
  '/klow-blend.html': '/research/compounds/klow-blend',
  '/kpv.html': '/research/compounds/kpv',
  '/lemon-bottle.html': '/research/compounds/lemon-bottle',
  '/melanotan-i.html': '/research/compounds/melanotan-i',
  '/melanotan-ii.html': '/research/compounds/melanotan-ii',
  '/mots-c.html': '/research/compounds/mots-c',
  '/nad-plus.html': '/research/compounds/nad-plus',
  '/neuro-cognitive-stack.html': '/research/compounds/neuro-cognitive-stack',
  '/oxytocin-acetate.html': '/research/compounds/oxytocin-acetate',
  '/pe-22-28.html': '/research/compounds/pe-22-28',
  '/pe-22-29.html': '/research/compounds/pe-22-29',
  '/pinealon.html': '/research/compounds/pinealon',
  '/pt-141.html': '/research/compounds/pt-141',
  '/retatrutide.html': '/research/compounds/retatrutide',
  '/selank.html': '/research/compounds/selank',
  '/semaglutide.html': '/research/compounds/semaglutide',
  '/semax.html': '/research/compounds/semax',
  '/sermorelin.html': '/research/compounds/sermorelin',
  '/ss-31.html': '/research/compounds/ss-31',
  '/tb-500.html': '/research/compounds/tb-500',
  '/tesamorelin.html': '/research/compounds/tesamorelin',
  '/thymalin-thymulin.html': '/research/compounds/thymalin-thymulin',
  '/thymosin-alpha-1.html': '/research/compounds/thymosin-alpha-1',
  '/tirzepatide.html': '/research/compounds/tirzepatide',
  '/ultimate-fat-loss-stack.html': '/research/compounds/ultimate-fat-loss-stack',
  '/upgraded-glow-stack.html': '/research/compounds/upgraded-glow-stack',
  '/wolverine-stack.html': '/research/compounds/wolverine-stack',

  // Shop / contact / home / about
  '/shop.html': '/shop',
  '/cart.html': '/shop/cart',
  '/contact.html': '/contact',
  '/index.html': '/',
  '/about.html': '/about',
};

/**
 * `/product.html?id=<slug>` -> `/shop/<slug>` — every one of the 47
 * legacy product-query-string URLs maps to exactly `/shop/{id}` with
 * no renaming (verified against docs/planning/legacy-redirect-map.md's
 * full per-product table), so this is a rule, not 47 separate literal
 * entries. `/shop/[id].astro` already renders its own honest 404 for
 * an id that doesn't exist, so no extra validation against the product
 * catalog is needed here.
 */
export function resolveLegacyProductRedirect(
  pathname: string,
  searchParams: URLSearchParams,
): string | null {
  if (pathname !== '/product.html') return null;
  const id = searchParams.get('id');
  if (!id) return null;
  return `/shop/${id}`;
}

/** Resolves any legacy URL (path-only or the product.html?id= pattern)
 * to its new-site equivalent, or null if this path has no mapping
 * (either it was never a legacy URL, or it's in the deliberately-
 * excluded "not yet migrated" set above). */
export function resolveLegacyRedirect(
  pathname: string,
  searchParams: URLSearchParams,
): string | null {
  return LEGACY_PATH_REDIRECTS[pathname] ?? resolveLegacyProductRedirect(pathname, searchParams);
}
