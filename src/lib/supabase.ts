/**
 * Research-content reads for signed-in visitors — used from server-
 * rendered Astro pages (runs in the Worker, never shipped to the
 * browser). Mandatory researcher-account gate (2026-08-13): `anon` no
 * longer has any grant on these tables at all (supabase/migrations/
 * 20260813121000_gate_revoke_anon_access.sql) — every call here uses
 * the VISITOR'S OWN verified access token (src/lib/auth.ts's
 * createUserScopedClient()), never a bare anon-key client, so RLS
 * evaluates as `authenticated` and the published-reachable policies
 * (20260813121000's `_select_authenticated` policies) actually apply.
 * Every caller of this module is a page src/middleware.ts has already
 * confirmed is signed in before it ever runs — see that file's gate.
 * The explicit `.eq('status', 'published')` filters below remain
 * defense-in-depth, not the real security boundary.
 */
import type {
  CompoundWithRelations,
  EvidenceQuality,
  SourceType,
  StudyDesign,
} from './database.types';
import { createUserScopedClient } from './auth';
import {
  isLegacySiteSource,
  maxEvidenceQuality,
  resolveEvidenceDisplayType,
  type EvidenceDisplayType,
} from './evidence';

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

// Nested select used for the directory list. Deliberately heavier than
// Phase 1's version (which had no way to power evidence-based filters/
// sorting) but still bounded: 56 compounds total, each with a handful of
// claims/sources — this is a single request, not an N+1 pattern.
const COMPOUND_LIST_SELECT = `id, slug, name, display_name, entity_kind, category, identity_confidence, research_review_status, status, expert_review_flag_reason, updated_at,
      compound_aliases ( alias ),
      claims!claims_compound_id_fkey (
        status,
        evidence_quality,
        claim_sources (
          sources ( id, source_type, url, studies ( study_design ) )
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
  research_review_status: string;
  status: string;
  expert_review_flag_reason: string | null;
  updated_at: string;
  compound_aliases: { alias: string }[];
  claims: {
    status: string;
    evidence_quality: EvidenceQuality | null;
    claim_sources: {
      sources: {
        id: string;
        source_type: string;
        url: string;
        studies: { study_design: string | null } | null;
      };
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
  research_review_status: string;
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
  // Published claims only (excludes the 2026-08-11 archived disclaimer/
  // site-policy boilerplate — see supabase/migrations and audit_log
  // action 'compound_disclaimer_claims_bulk_archive'), and never counts
  // the retired legacy site as a "source" (see evidence.ts's
  // isLegacySiteSource) — it isn't evidence, so it must not inflate the
  // directory card's study count or evidence-type strip either.
  const publishedClaims = row.claims.filter((c) => c.status === 'published');
  const sourceIds = new Set<string>();
  const evidenceTypes = new Set<EvidenceDisplayType>();
  let hasHumanEvidence = false;
  for (const claim of publishedClaims) {
    for (const cs of claim.claim_sources) {
      if (isLegacySiteSource(cs.sources.url)) continue;
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
    research_review_status: row.research_review_status,
    status: row.status,
    expert_review_flag_reason: row.expert_review_flag_reason,
    updated_at: row.updated_at,
    compound_aliases: row.compound_aliases,
    studyCount: sourceIds.size,
    hasHumanEvidence,
    maxEvidenceQuality: maxEvidenceQuality(publishedClaims.map((c) => c.evidence_quality)),
    regulatoryStatuses: [...new Set(row.regulatory_records.map((r) => r.regulatory_status))],
    evidenceTypes: [...evidenceTypes],
  };
}

export async function listPublishedCompounds(accessToken: string): Promise<CompoundListItem[]> {
  const supabase = getClient(accessToken);
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
  accessToken: string,
): Promise<CompoundWithRelations | null> {
  const supabase = getClient(accessToken);
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
export async function getRelatedCompounds(
  compoundId: string,
  accessToken: string,
): Promise<RelatedCompound[]> {
  const supabase = getClient(accessToken);
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
