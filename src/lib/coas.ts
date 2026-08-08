/**
 * Batch COA (Certificate of Analysis) queries — commerce domain,
 * structurally separate from src/lib/supabase.ts's research-content
 * queries (CLAUDE.md §7: no FK from evidence tables into commerce
 * tables, and this file never imports anything from that one either).
 * COAs are batch-testing documentation, never scientific evidence —
 * see src/pages/disclaimer.astro's own section on this.
 *
 * Anon-key client only, same pattern as supabase.ts: RLS
 * (batch_coas_select_published, supabase/migrations/
 * 20260808150000_commerce_coa_gallery.sql) is what actually enforces
 * "anon only ever sees status = 'published' rows" — the explicit
 * `.eq('status', 'published')` filter below is defense-in-depth, not
 * the real boundary.
 */
import { createClient } from '@supabase/supabase-js';

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

export const COA_BUCKET = 'coa-documents';

/** The public Storage URL for a COA file — safe to construct from just
 * the path (no signing needed, the bucket is public), but only ever
 * actually reachable when storage.objects' own RLS policy finds a
 * matching, published batch_coas row (see the migration referenced
 * above) — an unpublished or orphaned path 403s even though this URL
 * shape "looks" public. */
export function getCoaFileUrl(filePath: string): string {
  return `${url}/storage/v1/object/public/${COA_BUCKET}/${filePath}`;
}

export interface PublishedCoa {
  id: string;
  peptide_name: string;
  batch_identifier: string | null;
  testing_lab: string;
  test_date: string | null;
  verification_url: string | null;
  notes: string | null;
  file_path: string;
  file_mime_type: string;
  original_filename: string;
  published_at: string | null;
}

export async function listPublishedCoas(): Promise<PublishedCoa[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('batch_coas')
    .select(
      'id, peptide_name, batch_identifier, testing_lab, test_date, verification_url, notes, file_path, file_mime_type, original_filename, published_at',
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PublishedCoa[];
}
