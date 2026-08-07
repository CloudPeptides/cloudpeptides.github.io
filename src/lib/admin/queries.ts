/**
 * Read queries for the admin dashboard. Every function here takes a
 * user-scoped Supabase client (src/lib/auth.ts's createUserScopedClient)
 * — RLS is what actually restricts what each caller can see; these
 * queries add no `.eq('status', ...)` visibility filtering of their own
 * (contrast with src/lib/supabase.ts's public-site queries, which
 * defense-in-depth-filter to published rows on top of RLS — there's no
 * equivalent "only some editorial rows" concept here, contributor+ is
 * meant to see everything RLS already allows).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CompoundWithRelations, EditorialStatus } from '../database.types';
import { isHiddenFromNormalFlow } from '../reconciliation';
import { EXPERT_REVIEW_FLAGS } from '../expert-review-flags';

const STATUSES: EditorialStatus[] = ['draft', 'in_review', 'published', 'archived'];

export interface StatusCounts {
  draft: number;
  in_review: number;
  published: number;
  archived: number;
}

export async function getCompoundStatusCounts(client: SupabaseClient): Promise<StatusCounts> {
  const results = await Promise.all(
    STATUSES.map((status) =>
      client.from('compounds').select('id', { count: 'exact', head: true }).eq('status', status),
    ),
  );
  const counts = {} as StatusCounts;
  STATUSES.forEach((status, i) => {
    counts[status] = results[i].count ?? 0;
  });
  return counts;
}

export interface EvidenceGaps {
  compoundsWithNoClaims: number;
  claimsNotAssessed: number;
}

export async function getEvidenceGaps(client: SupabaseClient): Promise<EvidenceGaps> {
  const [compoundsResult, notAssessedResult] = await Promise.all([
    client.from('compounds').select('id, claims!claims_compound_id_fkey(id)'),
    client
      .from('claims')
      .select('id', { count: 'exact', head: true })
      .or('evidence_quality.is.null,evidence_quality.eq.not_assessed'),
  ]);
  const rows = (compoundsResult.data ?? []) as { id: string; claims: { id: string }[] }[];
  const compoundsWithNoClaims = rows.filter((r) => (r.claims?.length ?? 0) === 0).length;
  return {
    compoundsWithNoClaims,
    claimsNotAssessed: notAssessedResult.count ?? 0,
  };
}

/** Counts claims whose legacy-reconciliation disposition (parsed from
 * quality_rationale — see src/lib/reconciliation.ts) is 'unsupported' or
 * 'contradicted': the same rule that keeps them out of a published
 * compound's normal claim sections on the public site, surfaced here so
 * editors know how many exist without reading every compound by hand. */
export async function getUnsupportedClaimsCount(client: SupabaseClient): Promise<number> {
  const { data } = await client
    .from('claims')
    .select('id, quality_rationale')
    .ilike('quality_rationale', '[Reconciliation%');
  const rows = (data ?? []) as { id: string; quality_rationale: string | null }[];
  return rows.filter((r) => isHiddenFromNormalFlow(r)).length;
}

export interface ExpertReviewRow {
  id: string | null;
  slug: string;
  name: string;
  status: string;
  reason: string;
}

export async function getExpertReviewFlaggedCompounds(
  client: SupabaseClient,
): Promise<ExpertReviewRow[]> {
  const slugs = EXPERT_REVIEW_FLAGS.map((f) => f.slug);
  const { data } = await client
    .from('compounds')
    .select('id, slug, name, status')
    .in('slug', slugs);
  const bySlug = new Map((data ?? []).map((c) => [c.slug as string, c]));
  return EXPERT_REVIEW_FLAGS.map((flag) => {
    const compound = bySlug.get(flag.slug) as
      { id: string; name: string; status: string } | undefined;
    return {
      id: compound?.id ?? null,
      slug: flag.slug,
      name: compound?.name ?? flag.slug,
      status: compound?.status ?? 'not found',
      reason: flag.reason,
    };
  });
}

export interface RecentRevision {
  id: string;
  compound_id: string;
  compound_name: string;
  editor_id: string | null;
  created_at: string;
}

export async function getRecentRevisions(
  client: SupabaseClient,
  limit = 8,
): Promise<RecentRevision[]> {
  const { data } = await client
    .from('content_revisions')
    .select('id, compound_id, editor_id, created_at, compounds ( name )')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (
    (data ?? []) as unknown as Array<{
      id: string;
      compound_id: string;
      editor_id: string | null;
      created_at: string;
      compounds: { name: string } | null;
    }>
  ).map((r) => ({
    id: r.id,
    compound_id: r.compound_id,
    compound_name: r.compounds?.name ?? '(deleted compound)',
    editor_id: r.editor_id,
    created_at: r.created_at,
  }));
}

// ---------------------------------------------------------------------
// Compounds list / detail
// ---------------------------------------------------------------------

export interface CompoundAdminListFilters {
  q?: string;
  status?: EditorialStatus;
  entityKind?: string;
  page: number;
  pageSize: number;
}

export interface CompoundAdminListRow {
  id: string;
  slug: string;
  name: string;
  entity_kind: string;
  status: EditorialStatus;
  identity_confidence: string;
  claimCount: number;
  updated_at: string;
}

export async function listCompoundsForAdmin(
  client: SupabaseClient,
  filters: CompoundAdminListFilters,
): Promise<{ rows: CompoundAdminListRow[]; total: number }> {
  let query = client
    .from('compounds')
    .select(
      'id, slug, name, entity_kind, status, identity_confidence, updated_at, claims!claims_compound_id_fkey(id)',
      { count: 'exact' },
    );

  if (filters.q) {
    const escaped = filters.q.replace(/[%_]/g, '\\$&');
    query = query.or(`name.ilike.%${escaped}%,slug.ilike.%${escaped}%`);
  }
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.entityKind) query = query.eq('entity_kind', filters.entityKind);

  const start = (filters.page - 1) * filters.pageSize;
  const end = start + filters.pageSize - 1;
  const { data, count, error } = await query
    .order('updated_at', { ascending: false })
    .range(start, end);
  if (error) throw error;

  const rows = (
    (data ?? []) as unknown as Array<{
      id: string;
      slug: string;
      name: string;
      entity_kind: string;
      status: EditorialStatus;
      identity_confidence: string;
      updated_at: string;
      claims: { id: string }[];
    }>
  ).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    entity_kind: r.entity_kind,
    status: r.status,
    identity_confidence: r.identity_confidence,
    claimCount: r.claims?.length ?? 0,
    updated_at: r.updated_at,
  }));

  return { rows, total: count ?? 0 };
}

const COMPOUND_EDIT_SELECT = `*,
  compound_aliases ( * ),
  claims!claims_compound_id_fkey ( *, claim_sources ( *, sources ( id, title, source_type ) ) ),
  regulatory_records ( *, sources ( id, title ) ),
  stack_components!stack_components_stack_id_fkey ( *, compounds!stack_components_component_compound_id_fkey ( id, slug, name, status ) )`;

export async function getCompoundForEdit(
  client: SupabaseClient,
  id: string,
): Promise<CompoundWithRelations | null> {
  const { data, error } = await client
    .from('compounds')
    .select(COMPOUND_EDIT_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as CompoundWithRelations) ?? null;
}

/** For "attach to stack" / "select component compound" pickers — a
 * lightweight id/name/slug list, every status (contributor+ needs to
 * see drafts too when assembling a not-yet-published stack). */
export async function listCompoundOptions(
  client: SupabaseClient,
): Promise<{ id: string; name: string; slug: string; entity_kind: string }[]> {
  const { data, error } = await client
    .from('compounds')
    .select('id, name, slug, entity_kind')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------
// Sources / studies
// ---------------------------------------------------------------------

export interface PagedFilters {
  q?: string;
  page: number;
  pageSize: number;
}

export async function listSourcesForAdmin(client: SupabaseClient, filters: PagedFilters) {
  let query = client
    .from('sources')
    .select('id, title, source_type, url, retraction_status, publication_date, study_id', {
      count: 'exact',
    });
  if (filters.q) {
    const escaped = filters.q.replace(/[%_]/g, '\\$&');
    query = query.or(`title.ilike.%${escaped}%,url.ilike.%${escaped}%`);
  }
  const start = (filters.page - 1) * filters.pageSize;
  const end = start + filters.pageSize - 1;
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(start, end);
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function getSourceForEdit(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from('sources')
    .select('*, source_identifiers ( * )')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Lightweight list for the "attach an existing source to this claim"
 * picker — bounded to a reasonable page since sources can grow large;
 * callers narrow with a search term via listSourcesForAdmin instead
 * when the library is large. */
export async function listSourceOptions(
  client: SupabaseClient,
): Promise<{ id: string; title: string; source_type: string }[]> {
  const { data, error } = await client
    .from('sources')
    .select('id, title, source_type')
    .order('title')
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

export async function listStudiesForAdmin(client: SupabaseClient, filters: PagedFilters) {
  let query = client
    .from('studies')
    .select('id, study_design, population, sample_size, peer_review_status', { count: 'exact' });
  if (filters.q) {
    const escaped = filters.q.replace(/[%_]/g, '\\$&');
    query = query.ilike('population', `%${escaped}%`);
  }
  const start = (filters.page - 1) * filters.pageSize;
  const end = start + filters.pageSize - 1;
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(start, end);
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function getStudyForEdit(client: SupabaseClient, id: string) {
  const { data, error } = await client.from('studies').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listStudyOptions(
  client: SupabaseClient,
): Promise<{ id: string; study_design: string; population: string | null }[]> {
  const { data, error } = await client
    .from('studies')
    .select('id, study_design, population')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------
// Revision history / audit log
// ---------------------------------------------------------------------

export interface ContentRevisionRow {
  id: string;
  snapshot: Record<string, unknown>;
  editor_id: string | null;
  created_at: string;
}

export async function listRevisionsForCompound(
  client: SupabaseClient,
  compoundId: string,
): Promise<ContentRevisionRow[]> {
  const { data, error } = await client
    .from('content_revisions')
    .select('id, snapshot, editor_id, created_at')
    .eq('compound_id', compoundId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface AuditLogRow {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}

export async function listAuditLog(
  client: SupabaseClient,
  filters: { page: number; pageSize: number },
): Promise<{ rows: AuditLogRow[]; total: number }> {
  const start = (filters.page - 1) * filters.pageSize;
  const end = start + filters.pageSize - 1;
  const { data, count, error } = await client
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(start, end);
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}
