/**
 * Public, unauthenticated Supabase reads for the shop (Batch 4 of the
 * "Add Product / Peptide" workflow, 2026-08-10) — src/lib/shop_products
 * is now the canonical source for the public shop/product pages and
 * checkout price validation, replacing the static src/lib/shop-products.ts
 * array (kept in the repo, unremoved, as the documented rollback path
 * until Supabase parity + rollback are proven — see the Batch 4
 * migration report).
 *
 * Deliberately a SEPARATE module from src/lib/supabase.ts (which reads
 * published RESEARCH content: compounds/claims/sources/studies/
 * regulatory_records). Keeping these as two distinct files that are
 * never imported into each other's pages is the actual mechanism that
 * enforces CLAUDE.md §7's "Research and commerce data stay structurally
 * separate" on the shop side — shop/index.astro and shop/[id].astro
 * must never import src/lib/supabase.ts, and this file must never join
 * into compounds/claims/studies/regulatory_records (same rule
 * shop-products.ts's own header comment already documented).
 *
 * Anon key only, same posture as src/lib/supabase.ts — RLS
 * (shop_products_select_published, supabase/migrations/
 * 20260810090000_shop_products_schema.sql) is the real security
 * boundary; the explicit .eq('public_status', 'published') filters
 * below are defense-in-depth, not the enforcement mechanism.
 */
import { createClient } from '@supabase/supabase-js';
import type { CatalogEntry } from './form-validation';
import type { Product, ProductOption } from './shop-products';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseConfig(): boolean {
  return Boolean(url && anonKey);
}

function getClient() {
  if (!hasSupabaseConfig()) {
    throw new Error('PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY are not configured.');
  }
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

interface PublicShopRow {
  code: string;
  name: string;
  spec: string;
  count: number;
  price: number;
  product_slug: string | null;
  product_categories: { name: string } | null;
}

const PUBLIC_SHOP_SELECT = 'code, name, spec, count, price, product_slug, product_categories(name)';

/**
 * Groups flat published SKU rows into the exact Product/ProductOption
 * shape the static catalog always produced, so every existing pure
 * function (src/lib/shop.ts's formatMoney/filterProducts/
 * lowestPriceOption) and every existing page template keeps working
 * completely unchanged — this is the one function that makes the
 * cutover possible without touching that code at all. Pure/exported so
 * it's directly unit-testable without a live Supabase connection.
 *
 * A row with no product_slug is excluded — it has no public product
 * page to belong to (an admin-only SKU, per the field's own hint text
 * on the product edit page). `featured` has no defined meaning for
 * Supabase-sourced products (nothing has ever read that field even on
 * the static catalog it's ported from — see shop-products.ts) and is
 * always false here, never a fabricated guess.
 */
export function groupShopProductRows(rows: PublicShopRow[]): Product[] {
  const bySlug = new Map<string, Product>();
  for (const row of rows) {
    if (!row.product_slug) continue;
    const option: ProductOption = {
      code: row.code,
      spec: row.spec,
      count: row.count,
      price: row.price,
    };
    const existing = bySlug.get(row.product_slug);
    if (existing) {
      existing.options.push(option);
    } else {
      bySlug.set(row.product_slug, {
        id: row.product_slug,
        name: row.name,
        category: row.product_categories?.name ?? '',
        options: [option],
        featured: false,
      });
    }
  }
  return [...bySlug.values()];
}

/** The full public shop listing — every published, slugged SKU,
 * grouped into products. Ordered by name so grouping is stable and the
 * grid reads the same way run to run. */
export async function listPublicShopProducts(): Promise<Product[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('shop_products')
    .select(PUBLIC_SHOP_SELECT)
    .eq('public_status', 'published')
    .order('name', { ascending: true })
    .order('price', { ascending: true });
  if (error) throw error;
  return groupShopProductRows((data ?? []) as unknown as PublicShopRow[]);
}

/** One product page's worth of variants by product_slug — returns null
 * if nothing published shares that slug (replaces getStaticPaths's
 * build-time 404 behavior with an on-demand equivalent). */
export async function getPublicShopProduct(slug: string): Promise<Product | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('shop_products')
    .select(PUBLIC_SHOP_SELECT)
    .eq('public_status', 'published')
    .eq('product_slug', slug)
    .order('price', { ascending: true });
  if (error) throw error;
  const grouped = groupShopProductRows((data ?? []) as unknown as PublicShopRow[]);
  return grouped[0] ?? null;
}

/** For src/pages/api/checkout.ts — flattened into the shape
 * src/lib/form-validation.ts's buildCatalogResolver expects
 * (productId = product_slug, optionCode = code). Published rows only,
 * queried fresh on every checkout request, never cached — the whole
 * point of this function existing is that checkout never trusts a
 * client-supplied price, only what's live in the database right now. */
export async function listCheckoutCatalogEntries(): Promise<CatalogEntry[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('shop_products')
    .select('code, name, spec, price, product_slug')
    .eq('public_status', 'published')
    .not('product_slug', 'is', null);
  if (error) throw error;
  return (data ?? [])
    .filter((r): r is typeof r & { product_slug: string } => Boolean(r.product_slug))
    .map((r) => ({
      productId: r.product_slug,
      optionCode: r.code,
      name: r.name,
      spec: r.spec,
      price: r.price,
    }));
}
