/**
 * Private, admin-editable pricing catalog — backed by
 * public.admin_pricing_catalog (supabase/migrations/
 * 20260808170000_admin_pricing_catalog.sql), not a static file. RLS on
 * that table restricts every operation (select/insert/update/delete)
 * to admin role — every function here still expects to be called with
 * a client whose authorization has already been established by the
 * caller (route/page), matching src/lib/admin/users.ts's own
 * documented convention: this file performs no authorization itself.
 *
 * NOT the public shop catalog (src/lib/shop-products.ts, a static
 * file, live on production, driving the real cart/checkout). This
 * table has no public read path at all. Supplier cost is never
 * stored, selected, or returned anywhere in this file —
 * tests/unit/pricing-catalog.test.ts asserts this at the schema level
 * (no `cost`-shaped key ever appears on a fetched row).
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface PricingCatalogEntry {
  id: string;
  code: string;
  name: string;
  spec: string;
  count: number;
  price: number;
  category: string;
  updated_at: string;
}

export const PRICING_CATALOG_CATEGORIES = [
  'Beauty + Repair',
  'Weight Loss + Metabolic',
  'Repair + Other',
] as const;

/** True when a kit is the standard 10-vial size — drives the "10-vial
 * kit" label (XT100 is the one documented exception, count 1). */
export function isTenVialKit(count: number): boolean {
  return count === 10;
}

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
const MAX_PRICE = 100000;

/**
 * Validates a price as a positive USD amount with at most two decimal
 * places. Deliberately validates the raw string before any float
 * parsing — checking decimal-place count *after* parseFloat is
 * unreliable (floating-point representation can introduce or hide
 * trailing digits), so the regex runs on the original input text.
 */
export function validatePrice(input: unknown): { valid: boolean; error?: string; value?: number } {
  const text =
    typeof input === 'number' ? String(input) : typeof input === 'string' ? input.trim() : '';
  if (!text) {
    return { valid: false, error: 'Price is required.' };
  }
  if (!PRICE_PATTERN.test(text)) {
    return {
      valid: false,
      error: 'Price must be a positive amount with at most two decimal places.',
    };
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0) {
    return { valid: false, error: 'Price must be greater than zero.' };
  }
  if (value > MAX_PRICE) {
    return { valid: false, error: 'Price is unreasonably large.' };
  }
  return { valid: true, value };
}

export async function listPricingCatalog(client: SupabaseClient): Promise<PricingCatalogEntry[]> {
  const { data, error } = await client
    .from('admin_pricing_catalog')
    .select('id, code, name, spec, count, price, category, updated_at')
    .order('category', { ascending: true })
    .order('code', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PricingCatalogEntry[];
}

export async function getPricingCatalogEntry(
  client: SupabaseClient,
  id: string,
): Promise<PricingCatalogEntry | null> {
  const { data, error } = await client
    .from('admin_pricing_catalog')
    .select('id, code, name, spec, count, price, category, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as PricingCatalogEntry | null) ?? null;
}

/** Updates only the price column — every other field (code, name,
 * spec, count, category) is fixed at seed time and not editable from
 * this feature. Returns the updated row, or null if no row matched
 * (id didn't exist — the RLS-denied case surfaces as a Postgres error
 * instead, caught by the caller). */
export async function updatePricingCatalogPrice(
  client: SupabaseClient,
  id: string,
  price: number,
): Promise<PricingCatalogEntry | null> {
  const { data, error } = await client
    .from('admin_pricing_catalog')
    .update({ price })
    .eq('id', id)
    .select('id, code, name, spec, count, price, category, updated_at')
    .maybeSingle();
  if (error) throw error;
  return (data as PricingCatalogEntry | null) ?? null;
}
