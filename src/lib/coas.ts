/**
 * Batch COA (Certificate of Analysis) queries — commerce domain,
 * structurally separate from src/lib/supabase.ts's research-content
 * queries (CLAUDE.md §7). COAs are batch-testing documentation, never
 * scientific evidence — see src/pages/disclaimer.astro.
 *
 * Mandatory researcher-account gate (2026-08-13): `anon` no longer has
 * any grant on batch_coas, and the coa-documents Storage bucket is no
 * longer public (supabase/migrations/20260813121000_gate_revoke_anon_
 * access.sql) — every read here uses the visitor's own verified access
 * token, and file URLs are short-lived signed URLs
 * (getCoaSignedUrl(), storage.objects RLS applies to the signing call
 * itself) rather than the old public object URL. Admin already used
 * this same createSignedUrl() pattern for this bucket
 * (src/pages/admin/coas/[id].astro) — unaffected by this change.
 */
import { createUserScopedClient } from './auth';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseConfig(): boolean {
  return Boolean(url && anonKey);
}

function getClient(accessToken: string) {
  if (!hasSupabaseConfig()) {
    throw new Error('PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY are not configured.');
  }
  return createUserScopedClient(accessToken);
}

export const COA_BUCKET = 'coa-documents';

const SIGNED_URL_TTL_SECONDS = 3600;

/** A short-lived signed URL for a COA file — the bucket is private, so
 * this is the only way to reach the file bytes at all now; the signing
 * call itself is subject to storage.objects RLS (only succeeds for a
 * signed-in visitor and a published row, or an admin). Returns null on
 * any failure rather than throwing — a single broken/missing file must
 * not take down the whole gallery page. */
export async function getCoaSignedUrl(
  accessToken: string,
  filePath: string,
): Promise<string | null> {
  const supabase = getClient(accessToken);
  const { data, error } = await supabase.storage
    .from(COA_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}

export interface PublishedCoa {
  id: string;
  peptide_name: string;
  batch_identifier: string | null;
  testing_lab: string;
  test_date: string | null;
  verification_url: string | null;
  notes: string | null;
  purity_result: string | null;
  testing_method: string | null;
  file_path: string;
  file_mime_type: string;
  original_filename: string;
  published_at: string | null;
  /** The linked shop_products row's code/name — the canonical SKU
   * display, sourced live through product_id rather than any column on
   * batch_coas itself (CLAUDE.md §7: no duplicate SKU data). Null for
   * an older COA with no product_id, or one whose linked product isn't
   * itself readable — both cases the client simply can't see, so
   * PostgREST returns null for the embed rather than erroring; render
   * accordingly, never throw on a missing link. */
  shop_products: { code: string; name: string } | null;
}

export async function listPublishedCoas(accessToken: string): Promise<PublishedCoa[]> {
  const supabase = getClient(accessToken);
  const { data, error } = await supabase
    .from('batch_coas')
    .select(
      'id, peptide_name, batch_identifier, testing_lab, test_date, verification_url, notes, purity_result, testing_method, file_path, file_mime_type, original_filename, published_at, shop_products(code, name)',
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PublishedCoa[];
}
