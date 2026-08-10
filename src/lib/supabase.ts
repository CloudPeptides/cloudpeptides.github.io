/**
 * Client-safe Supabase client — anon key only, never the service-role
 * key. Used from server-rendered Astro pages (runs in the Worker, not
 * shipped to the browser as this module is only imported in page
 * frontmatter) to read published research content. RLS is what actually
 * enforces "anon only sees status='published' (or published-reachable)"
 * rows — the explicit `.eq('status', 'published')` filters below are
 * defense-in-depth, not the real security boundary. See
 * supabase/migrations/20260807120000_anon_read_supporting_tables.sql for
 * the Phase 3 policies that make the joins below possible at all.
 */
import { createClient } from '@supabase/supabase-js';
import type {
  CompoundWithRelations,
  EvidenceQuality,
  SourceType,
  StudyDesign,
} from './database.types';
import {
  maxEvidenceQuality,
  resolveEvidenceDisplayType,
  type EvidenceDisplayType,
} from './evidence';

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

// Nested select used for the directory list. Deliberately heavier than
// Phase 1's version (which had no way to power evidence-based filters/
// sorting) but still bounded: 56 compounds total, each with a handful of
// claims/sources — this is a single request, not an N+1 pattern.
const COMPOUND_LIST_SELECT = `id, slug, name, display_name, entity_kind, category, identity_confidence, status, expert_review_flag_reason, updated_at,
      compound_aliases ( alias ),
      claims!claims_compound_id_fkey (
        evidence_quality,
        claim_sources (
          sources ( id, source_type, studies ( study_design ) )
        )
      ),
      regulatory_records ( regulatory_status )`;

interface RawListRow {
  id: string;
  slug: string;
  name: string;
  display_name: string | null;
  entity_kind: string;
  category: string | null;
  identity_confidence: string;
  status: string;
  expert_review_flag_reason: string | null;
  updated_at: string;
  compound_aliases: { alias: string }[];
  claims: {
    evidence_quality: EvidenceQuality | null;
    claim_sources: {
      sources: { id: string; source_type: string; studies: { study_design: string | null } | null };
    }[];
  }[];
  regulatory_records: { regulatory_status: string }[];
}

export interface CompoundListItem {
  id: string;
  slug: string;
  name: string;
  display_name: string | null;
  entity_kind: string;
  category: string | null;
  identity_confidence: string;
  status: string;
  expert_review_flag_reason: string | null;
  updated_at: string;
  compound_aliases: { alias: string }[];
  /** Distinct sources cited across every claim — used as the directory's "study count." */
  studyCount: number;
  hasHumanEvidence: boolean;
  maxEvidenceQuality: EvidenceQuality | null;
  regulatoryStatuses: string[];
  evidenceTypes: EvidenceDisplayType[];
}

function deriveListItem(row: RawListRow): CompoundListItem {
  const sourceIds = new Set<string>();
  const evidenceTypes = new Set<EvidenceDisplayType>();
  let hasHumanEvidence = false;
  for (const claim of row.claims) {
    for (const cs of claim.claim_sources) {
      sourceIds.add(cs.sources.id);
      const design = cs.sources.studies?.study_design ?? null;
      const displayType = resolveEvidenceDisplayType(
        cs.sources.source_type as SourceType,
        design as StudyDesign | null,
      );
      evidenceTypes.add(displayType);
      if (displayType === 'human') hasHumanEvidence = true;
    }
  }
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    display_name: row.display_name,
    entity_kind: row.entity_kind,
    category: row.category,
    identity_confidence: row.identity_confidence,
    status: row.status,
    expert_review_flag_reason: row.expert_review_flag_reason,
    updated_at: row.updated_at,
    compound_aliases: row.compound_aliases,
    studyCount: sourceIds.size,
    hasHumanEvidence,
    maxEvidenceQuality: maxEvidenceQuality(row.claims.map((c) => c.evidence_quality)),
    regulatoryStatuses: [...new Set(row.regulatory_records.map((r) => r.regulatory_status))],
    evidenceTypes: [...evidenceTypes],
  };
}

export async function listPublishedCompounds(): Promise<CompoundListItem[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('compounds')
    .select(COMPOUND_LIST_SELECT)
    .eq('status', 'published')
    .order('name');
  if (error) throw error;
  return ((data ?? []) as unknown as RawListRow[]).map(deriveListItem);
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
      claims!claims_compound_id_fkey ( *, claim_sources ( *, sources ( *, source_identifiers (*), studies (*) ) ) ),
      regulatory_records ( *, sources ( *, source_identifiers (*) ) ),
      stack_components!stack_components_stack_id_fkey ( *, compounds!stack_components_component_compound_id_fkey ( id, slug, name, status ) )`,
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  // stack_components' nested compound is fetched without a status filter
  // (Postgres nested-select can't apply one), so a component that isn't
  // itself published is filtered out here rather than trusted from the
  // query shape — a stack should never link out to a component whose own
  // profile 404s.
  type StackComponentRow = CompoundWithRelations['stack_components'][number] & {
    compounds: { status?: string };
  };
  const typed = data as unknown as Omit<CompoundWithRelations, 'stack_components'> & {
    stack_components: StackComponentRow[];
  };
  typed.stack_components = typed.stack_components.filter(
    (sc) => sc.compounds?.status === 'published',
  );
  return typed as CompoundWithRelations;
}

export interface RelatedCompound {
  slug: string;
  name: string;
  entity_kind: string;
}

/**
 * "Related compounds" for the profile sidebar — real data only, no
 * fabricated topic/relationship graph. Uses the existing
 * stack_components table's *reverse* direction: which published
 * stacks/blends include this compound as a component (e.g. BPC-157's
 * related list includes "BPC-157 + TB-500" because that blend's
 * stack_components row points back at BPC-157). Never invents a
 * relationship that isn't already represented in the schema.
 */
export async function getRelatedCompounds(compoundId: string): Promise<RelatedCompound[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('stack_components')
    .select('compounds!stack_components_stack_id_fkey ( slug, name, entity_kind, status )')
    .eq('component_compound_id', compoundId);
  if (error) throw error;
  return (data ?? [])
    .map((row) => row.compounds as unknown as RelatedCompound & { status: string })
    .filter(
      (c): c is RelatedCompound & { status: string } => Boolean(c) && c.status === 'published',
    )
    .map(({ slug, name, entity_kind }) => ({ slug, name, entity_kind }));
}
