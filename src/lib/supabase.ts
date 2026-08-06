/**
 * Client-safe Supabase client — anon key only, never the service-role
 * key. Used from server-rendered Astro pages (runs in the Worker, not
 * shipped to the browser as this module is only imported in page
 * frontmatter) to read published research content. RLS is what actually
 * enforces "anon only sees status='published'" — the explicit
 * .eq('status', 'published') filters below are defense-in-depth, not
 * the real security boundary.
 */
import { createClient } from '@supabase/supabase-js';
import type { CompoundWithRelations } from './database.types';

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

const COMPOUND_LIST_SELECT = 'id, slug, name, entity_kind, category, identity_confidence, status';

export interface CompoundListItem {
  id: string;
  slug: string;
  name: string;
  entity_kind: string;
  category: string | null;
  identity_confidence: string;
  status: string;
}

export async function listPublishedCompounds(): Promise<CompoundListItem[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('compounds')
    .select(COMPOUND_LIST_SELECT)
    .eq('status', 'published')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getPublishedCompoundBySlug(
  slug: string,
): Promise<CompoundWithRelations | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('compounds')
    .select(
      `*,
      compound_aliases (*),
      claims!claims_compound_id_fkey ( *, claim_sources ( *, sources (*) ) ),
      regulatory_records ( *, sources (*) ),
      stack_components!stack_components_stack_id_fkey ( *, compounds!stack_components_component_compound_id_fkey ( id, slug, name ) )`,
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw error;
  return data as CompoundWithRelations | null;
}
