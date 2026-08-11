/**
 * Allow-listed table registry consumed by
 * src/pages/api/admin/content/[table].ts — the single generic,
 * RLS-enforced editorial CRUD route. This is what keeps that route
 * "narrow" despite covering nine tables: every table explicitly
 * declares which columns a client may ever set (never id/created_at/
 * updated_at, never a status escape hatch where a dedicated workflow
 * route exists instead), its primary-key shape (several of these
 * tables have composite keys, not a single `id`), and the minimum role
 * each operation requires — mirrored from the RLS policies in
 * supabase/migrations/20260806144904_rls_policies.sql so a rejected
 * request gets a clear message instead of only an opaque Postgres RLS
 * error (RLS remains the actual enforcement either way; this is
 * defense-in-depth for a better error, never a substitute for it).
 *
 * `compounds.status` and `claims.status` are deliberately EXCLUDED from
 * both tables' updatable-column lists — every status transition goes
 * through src/pages/api/admin/compounds/[id]/status.ts instead, the one
 * place Blueprint v2 §17's pre-publish checks actually run. Deleting a
 * whole compound is deliberately not exposed here at all (not
 * requested, and far less reversible than any other editorial action;
 * archiving via the status route is the supported way to remove a
 * compound from public view).
 */
import type { Role } from '../auth';
import {
  validateAliasFields,
  validateClaimFields,
  validateClaimSourceFields,
  validateCompoundFields,
  validateRegulatoryRecordFields,
  validateSourceFields,
  validateSourceIdentifierFields,
  validateStackComponentFields,
  validateStudyFields,
  type FieldValidationResult,
} from './validation';

export interface TableConfig {
  table: string;
  /** Composite-safe — ['id'] for the common case, multiple columns for
   * the three pure-join tables (claim_sources, stack_components,
   * source_identifiers). */
  keyColumns: string[];
  insertableColumns: string[];
  updatableColumns: string[];
  validate: (input: Record<string, unknown>) => FieldValidationResult;
  minRoleWrite: Role;
  /** Undefined means delete is not exposed for this table at all. */
  minRoleDelete?: Role;
}

export const TABLE_REGISTRY: Record<string, TableConfig> = {
  compounds: {
    table: 'compounds',
    keyColumns: ['id'],
    insertableColumns: [
      'slug',
      'name',
      'display_name',
      'entity_kind',
      'identity_confidence',
      'category',
      'expert_review_flag_reason',
      'research_review_status',
      'overview_what_it_is',
      'overview_why_people_use_it',
      'overview_research_summary',
      'overview_bottom_line',
      'overview_evidence_reviewed_date',
      'administration_context',
      'administration_context_reviewed_date',
    ],
    updatableColumns: [
      'slug',
      'name',
      'display_name',
      'entity_kind',
      'identity_confidence',
      'category',
      'expert_review_flag_reason',
      'research_review_status',
      'overview_what_it_is',
      'overview_why_people_use_it',
      'overview_research_summary',
      'overview_bottom_line',
      'overview_evidence_reviewed_date',
      'administration_context',
      'administration_context_reviewed_date',
    ],
    validate: validateCompoundFields,
    minRoleWrite: 'contributor',
    // No minRoleDelete — deleting a compound entirely is not exposed;
    // use the status route to archive instead.
  },
  compound_aliases: {
    table: 'compound_aliases',
    keyColumns: ['id'],
    insertableColumns: ['compound_id', 'alias', 'alias_type', 'note'],
    updatableColumns: ['alias', 'alias_type', 'note'],
    validate: validateAliasFields,
    minRoleWrite: 'contributor',
    minRoleDelete: 'contributor',
  },
  stack_components: {
    table: 'stack_components',
    keyColumns: ['stack_id', 'component_compound_id'],
    insertableColumns: ['stack_id', 'component_compound_id', 'dose_or_ratio_note'],
    updatableColumns: ['dose_or_ratio_note'],
    validate: validateStackComponentFields,
    minRoleWrite: 'contributor',
    minRoleDelete: 'contributor',
  },
  claims: {
    table: 'claims',
    keyColumns: ['id'],
    insertableColumns: [
      'compound_id',
      'content_section',
      'statement',
      'evidence_quality',
      'quality_rationale',
      'interpretation_status',
      'display_order',
    ],
    updatableColumns: [
      'content_section',
      'statement',
      'evidence_quality',
      'quality_rationale',
      'interpretation_status',
      'display_order',
      'status',
    ],
    validate: validateClaimFields,
    minRoleWrite: 'contributor',
    minRoleDelete: 'editor',
  },
  claim_sources: {
    table: 'claim_sources',
    keyColumns: ['claim_id', 'source_id'],
    insertableColumns: ['claim_id', 'source_id', 'relationship', 'locator', 'date_accessed'],
    updatableColumns: ['relationship', 'locator', 'date_accessed'],
    validate: validateClaimSourceFields,
    minRoleWrite: 'contributor',
    minRoleDelete: 'contributor',
  },
  sources: {
    table: 'sources',
    keyColumns: ['id'],
    insertableColumns: [
      'source_type',
      'study_id',
      'title',
      'url',
      'publisher_or_agency',
      'publication_date',
      'retraction_status',
      'retraction_note',
      'retraction_checked_at',
    ],
    updatableColumns: [
      'source_type',
      'study_id',
      'title',
      'url',
      'publisher_or_agency',
      'publication_date',
      'retraction_status',
      'retraction_note',
      'retraction_checked_at',
    ],
    validate: validateSourceFields,
    minRoleWrite: 'contributor',
    minRoleDelete: 'contributor',
  },
  source_identifiers: {
    table: 'source_identifiers',
    keyColumns: ['source_id', 'identifier_type', 'identifier_value'],
    insertableColumns: ['source_id', 'identifier_type', 'identifier_value'],
    updatableColumns: [],
    validate: validateSourceIdentifierFields,
    minRoleWrite: 'contributor',
    minRoleDelete: 'contributor',
  },
  studies: {
    table: 'studies',
    keyColumns: ['id'],
    insertableColumns: [
      'study_design',
      'population',
      'sample_size',
      'comparator',
      'intervention',
      'route',
      'published_research_dose',
      'duration',
      'primary_outcomes',
      'secondary_outcomes',
      'results_summary',
      'limitations',
      'funding_source',
      'conflicts_of_interest',
      'registration_number',
      'peer_review_status',
    ],
    updatableColumns: [
      'study_design',
      'population',
      'sample_size',
      'comparator',
      'intervention',
      'route',
      'published_research_dose',
      'duration',
      'primary_outcomes',
      'secondary_outcomes',
      'results_summary',
      'limitations',
      'funding_source',
      'conflicts_of_interest',
      'registration_number',
      'peer_review_status',
    ],
    validate: validateStudyFields,
    minRoleWrite: 'contributor',
    minRoleDelete: 'contributor',
  },
  regulatory_records: {
    table: 'regulatory_records',
    keyColumns: ['id'],
    insertableColumns: [
      'compound_id',
      'agency',
      'jurisdiction',
      'formulation',
      'indication',
      'regulatory_status',
      'effective_date',
      'status_change_date',
      'source_id',
      'last_verified_date',
      'notes',
    ],
    updatableColumns: [
      'agency',
      'jurisdiction',
      'formulation',
      'indication',
      'regulatory_status',
      'effective_date',
      'status_change_date',
      'source_id',
      'last_verified_date',
      'notes',
    ],
    validate: validateRegulatoryRecordFields,
    minRoleWrite: 'contributor',
    minRoleDelete: 'contributor',
  },
};

/** Strips any key not on the allow-list — the actual defense against
 * mass-assignment (a client sending `{status: 'published'}` to a table
 * whose registry entry never lists `status` as updatable, for example,
 * has that field silently dropped, not honored). */
export function pickAllowed(
  input: Record<string, unknown>,
  allowedColumns: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of allowedColumns) {
    if (key in input) out[key] = input[key];
  }
  return out;
}
