/**
 * Data access + validation for the "Add Product / Peptide" admin
 * wizard (src/pages/admin/products/new.astro) and product management
 * (src/pages/admin/products/index.astro). Every function here expects
 * a client whose authorization was already established by the caller —
 * same convention as src/lib/admin/users.ts and src/lib/admin/
 * pricing-catalog.ts.
 *
 * Structurally: shop_products is the commerce catalog table the
 * Blueprint's own §14 comment anticipated. compound_id links a shop
 * product to its research identity — nullable and optional, never
 * required, per the approved research/commerce separation model.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export const ENTITY_KINDS = [
  { value: 'peptide', label: 'Peptide' },
  { value: 'protein', label: 'Protein' },
  { value: 'small_molecule_drug', label: 'Small molecule' },
  { value: 'peptide_blend', label: 'Blend' },
  { value: 'stack', label: 'Stack' },
  { value: 'cosmetic_mixture', label: 'Cosmetic mixture' },
  { value: 'biologic', label: 'Biologic' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'non_peptide_research_compound', label: 'Non-peptide research compound' },
  { value: 'other', label: 'Other' },
] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number]['value'];

export const INTERNAL_STATUSES = ['draft', 'active', 'archived'] as const;
export type InternalStatus = (typeof INTERNAL_STATUSES)[number];

export const PUBLIC_STATUSES = ['private', 'compliance_hold', 'published'] as const;
export type PublicStatus = (typeof PUBLIC_STATUSES)[number];

export interface CompoundSummary {
  id: string;
  slug: string;
  name: string;
  display_name: string | null;
  entity_kind: string;
  status: string;
}

export interface DuplicateCandidate extends CompoundSummary {
  matched_on: 'name' | 'alias';
  matched_text: string;
}

export interface Category {
  id: string;
  name: string;
  display_order: number;
}

export interface ShopProductRow {
  id: string;
  compound_id: string | null;
  code: string;
  name: string;
  spec: string;
  count: number;
  price: number;
  category_id: string;
  internal_status: InternalStatus;
  public_status: PublicStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  product_slug: string | null;
  legacy_source_id: string | null;
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CODE_PATTERN = /^[A-Za-z0-9-]+$/;
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

export function validateSlug(value: unknown): { valid: boolean; error?: string } {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return { valid: false, error: 'Slug is required.' };
  if (text.length > 100) return { valid: false, error: 'Slug is too long.' };
  if (!SLUG_PATTERN.test(text)) {
    return {
      valid: false,
      error: 'Slug must be lowercase letters, numbers, and single hyphens only.',
    };
  }
  return { valid: true };
}

export function validateProductCode(value: unknown): { valid: boolean; error?: string } {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return { valid: false, error: 'Product code is required.' };
  if (text.length > 40) return { valid: false, error: 'Product code is too long.' };
  if (!CODE_PATTERN.test(text)) {
    return { valid: false, error: 'Product code may only contain letters, numbers, and hyphens.' };
  }
  return { valid: true };
}

export function validatePrice(input: unknown): { valid: boolean; error?: string; value?: number } {
  const text =
    typeof input === 'number' ? String(input) : typeof input === 'string' ? input.trim() : '';
  if (!text) return { valid: false, error: 'Price is required.' };
  if (!PRICE_PATTERN.test(text)) {
    return {
      valid: false,
      error: 'Price must be a positive amount with at most two decimal places.',
    };
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0)
    return { valid: false, error: 'Price must be greater than zero.' };
  if (value > 100000) return { valid: false, error: 'Price is unreasonably large.' };
  return { valid: true, value };
}

export function validateCount(input: unknown): { valid: boolean; error?: string; value?: number } {
  const value = typeof input === 'number' ? input : Number(input);
  if (!Number.isInteger(value) || value <= 0) {
    return { valid: false, error: 'Count must be a positive whole number.' };
  }
  return { valid: true, value };
}

/** Step 1 duplicate check — fuzzy match against both compound names
 * and aliases via pg_trgm similarity, so "GHK Cu" and "GHK-Cu" both
 * surface the same existing record. Never auto-blocks creation — the
 * caller decides whether a match is close enough to link instead. */
export async function findPossibleDuplicateCompounds(
  client: SupabaseClient,
  query: string,
): Promise<DuplicateCandidate[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const [byName, byAlias] = await Promise.all([
    client
      .from('compounds')
      .select('id, slug, name, display_name, entity_kind, status')
      .ilike('name', `%${q}%`)
      .limit(10),
    client
      .from('compound_aliases')
      .select('alias, compounds(id, slug, name, display_name, entity_kind, status)')
      .ilike('alias', `%${q}%`)
      .limit(10),
  ]);

  const results: DuplicateCandidate[] = [];
  const seen = new Set<string>();

  for (const row of byName.data ?? []) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    results.push({ ...row, matched_on: 'name', matched_text: row.name });
  }
  for (const row of byAlias.data ?? []) {
    const compound = row.compounds as unknown as CompoundSummary | null;
    if (!compound || seen.has(compound.id)) continue;
    seen.add(compound.id);
    results.push({ ...compound, matched_on: 'alias', matched_text: row.alias });
  }
  return results;
}

export async function listCompoundsForLinking(client: SupabaseClient): Promise<CompoundSummary[]> {
  const { data, error } = await client
    .from('compounds')
    .select('id, slug, name, display_name, entity_kind, status')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listCategories(client: SupabaseClient): Promise<Category[]> {
  const { data, error } = await client
    .from('product_categories')
    .select('id, name, display_order')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export interface NewCompoundInput {
  canonicalName: string;
  displayName?: string;
  slug: string;
  entityKind: EntityKind;
  aliases: string[];
}

export interface VariantInput {
  code: string;
  name: string;
  spec: string;
  count: number;
  price: number;
  categoryId: string;
  internalStatus: InternalStatus;
  publicStatus: PublicStatus;
}

export interface CreateProductPayload {
  compoundId: string | null;
  newCompound: NewCompoundInput | null;
  stackComponentIds: string[];
  variants: VariantInput[];
  // Groups every variant created in this one save into a single public
  // product page/URL (/shop/<slug>) — shared across all variants,
  // never set per-variant. Null is valid: an admin-only SKU that isn't
  // meant to appear on a standalone public page yet.
  productSlug: string | null;
}

/** Calls the transactional create_product_with_research() Postgres
 * function (supabase/migrations/20260810091000_...) — all writes
 * happen in one database transaction; a failure partway through rolls
 * back everything, so this can never leave a half-created compound or
 * a subset of variants behind. */
export async function createProductWithResearch(
  client: SupabaseClient,
  actorUserId: string,
  payload: CreateProductPayload,
): Promise<{ compoundId: string; productIds: string[] }> {
  const { data, error } = await client.rpc('create_product_with_research', {
    p_actor_user_id: actorUserId,
    p_compound_id: payload.compoundId,
    p_new_compound: payload.newCompound
      ? {
          canonical_name: payload.newCompound.canonicalName,
          display_name: payload.newCompound.displayName ?? '',
          slug: payload.newCompound.slug,
          entity_kind: payload.newCompound.entityKind,
          aliases: payload.newCompound.aliases,
        }
      : null,
    p_stack_component_ids: payload.stackComponentIds,
    p_variants: payload.variants.map((v) => ({
      code: v.code,
      name: v.name,
      spec: v.spec,
      count: v.count,
      price: v.price,
      category_id: v.categoryId,
      internal_status: v.internalStatus,
      public_status: v.publicStatus,
    })),
    p_product_slug: payload.productSlug,
  });
  if (error) throw error;
  return { compoundId: data.compound_id, productIds: data.product_ids };
}

export interface ShopProductListRow extends ShopProductRow {
  category_name: string;
  compound_name: string | null;
  compound_entity_kind: string | null;
  compound_status: string | null;
  coa_count: number;
}

export async function listShopProducts(
  client: SupabaseClient,
  filters: {
    q?: string;
    categoryId?: string;
    internalStatus?: string;
    publicStatus?: string;
    entityKind?: string;
    researchStatus?: string;
  },
): Promise<ShopProductListRow[]> {
  // Joins compound name/entity_kind/status (for the entity-type and
  // research-status filters) and a COA count — a single query rather
  // than N+1 per row. Filtering on an embedded resource's own columns
  // only works reliably against an INNER join in PostgREST, so the
  // compounds embed switches to `!inner` whenever either filter is
  // active — correct behavior either way, since a product with no
  // linked compound can never match an entity-type/research-status
  // filter regardless.
  const needsCompoundInnerJoin = Boolean(filters.entityKind || filters.researchStatus);
  const compoundsEmbed = needsCompoundInnerJoin
    ? 'compounds!inner(name, entity_kind, status)'
    : 'compounds(name, entity_kind, status)';

  let query = client
    .from('shop_products')
    .select(
      `id, compound_id, code, name, spec, count, price, category_id, internal_status, public_status, created_by, created_at, updated_at, product_slug, legacy_source_id, ` +
        `product_categories(name), ${compoundsEmbed}, batch_coas(count)`,
    )
    .order('created_at', { ascending: false });

  if (filters.q) query = query.or(`code.ilike.%${filters.q}%,name.ilike.%${filters.q}%`);
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.internalStatus) query = query.eq('internal_status', filters.internalStatus);
  if (filters.publicStatus) query = query.eq('public_status', filters.publicStatus);
  if (filters.entityKind) query = query.eq('compounds.entity_kind', filters.entityKind);
  if (filters.researchStatus) query = query.eq('compounds.status', filters.researchStatus);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as unknown as ShopProductRow & {
      product_categories: { name: string } | null;
      compounds: { name: string; entity_kind: string; status: string } | null;
      batch_coas: Array<{ count: number }> | { count: number } | null;
    };
    const coaCount = Array.isArray(r.batch_coas)
      ? (r.batch_coas[0]?.count ?? 0)
      : (r.batch_coas?.count ?? 0);
    return {
      ...r,
      category_name: r.product_categories?.name ?? '',
      compound_name: r.compounds?.name ?? null,
      compound_entity_kind: r.compounds?.entity_kind ?? null,
      compound_status: r.compounds?.status ?? null,
      coa_count: coaCount,
    };
  });
}

export async function createCategory(client: SupabaseClient, name: string): Promise<Category> {
  const { data, error } = await client
    .from('product_categories')
    .insert({ name, display_order: 999 })
    .select('id, name, display_order')
    .single();
  if (error) throw error;
  return data;
}

export async function getShopProduct(
  client: SupabaseClient,
  id: string,
): Promise<ShopProductRow | null> {
  const { data, error } = await client
    .from('shop_products')
    .select(
      'id, compound_id, code, name, spec, count, price, category_id, internal_status, public_status, created_by, created_at, updated_at, product_slug, legacy_source_id',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/** "Duplicate as new variant" — copies every field except code (which
 * must stay unique, so it gets a placeholder the admin must change)
 * and forces the copy back to draft/private regardless of the
 * source row's status, so a duplicate is never accidentally
 * publish-ready or public on creation. */
export async function duplicateShopProductAsVariant(
  client: SupabaseClient,
  source: ShopProductRow,
  actorUserId: string,
): Promise<ShopProductRow> {
  const placeholderCode = `${source.code}-COPY-${Date.now().toString(36).toUpperCase()}`;
  const { data, error } = await client
    .from('shop_products')
    .insert({
      compound_id: source.compound_id,
      code: placeholderCode,
      name: source.name,
      spec: source.spec,
      count: source.count,
      price: source.price,
      category_id: source.category_id,
      internal_status: 'draft',
      public_status: 'private',
      created_by: actorUserId,
      // Same product page as the source — this is a new mg-option
      // variant of the same public product, not a new product.
      // legacy_source_id is deliberately NOT copied: a duplicate is a
      // new admin-created row, not itself a migrated legacy SKU.
      product_slug: source.product_slug,
    })
    .select(
      'id, compound_id, code, name, spec, count, price, category_id, internal_status, public_status, created_by, created_at, updated_at, product_slug, legacy_source_id',
    )
    .single();
  if (error) throw error;
  return data;
}

export interface LinkedCoa {
  id: string;
  peptide_name: string;
  testing_lab: string;
  status: string;
  test_date: string | null;
}

export async function listLinkedCoas(
  client: SupabaseClient,
  productId: string,
): Promise<LinkedCoa[]> {
  const { data, error } = await client
    .from('batch_coas')
    .select('id, peptide_name, testing_lab, status, test_date')
    .eq('product_id', productId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** COAs with no product link yet — candidates to attach to this
 * product. Batch_coas.peptide_name is free text (COAs pre-date this
 * schema), so this is a simple unlinked list, not a smart match. */
export async function listUnlinkedCoas(client: SupabaseClient): Promise<LinkedCoa[]> {
  const { data, error } = await client
    .from('batch_coas')
    .select('id, peptide_name, testing_lab, status, test_date')
    .is('product_id', null)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function linkCoaToProduct(
  client: SupabaseClient,
  coaId: string,
  productId: string | null,
): Promise<void> {
  const { error } = await client
    .from('batch_coas')
    .update({ product_id: productId })
    .eq('id', coaId);
  if (error) throw error;
}

export async function getCompound(
  client: SupabaseClient,
  id: string,
): Promise<CompoundSummary | null> {
  const { data, error } = await client
    .from('compounds')
    .select('id, slug, name, display_name, entity_kind, status')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}
