/**
 * Server-side field validation for every editorial table, mirroring the
 * CHECK constraints in supabase/migrations/20260806144903_research_schema.sql
 * exactly (kept in sync by hand — see database.types.ts's own header
 * comment for why no generated-types pipeline exists here). The
 * database is still the final backstop (RLS + CHECK constraints can't
 * be bypassed by a validation bug here), but a client should get a
 * clear 400 with a field-level message, not a raw Postgres constraint
 * violation.
 *
 * Also implements Blueprint v2 §17's pre-publish checks — "every claim
 * has ≥1 row in claim_sources," surfaced as a hard blocker before an
 * editor/admin can move a compound to 'published' (never silently
 * skipped, never just a client-side hint).
 */
import type { CompoundWithRelations } from '../database.types';

export interface FieldValidationResult {
  valid: boolean;
  error?: string;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

export const ENTITY_KINDS = [
  'peptide',
  'peptide_blend',
  'stack',
  'small_molecule_drug',
  'biologic',
  'supplement',
  'non_peptide_research_compound',
] as const;

export const IDENTITY_CONFIDENCES = [
  'verified',
  'disputed',
  'unverified',
  'likely_naming_variant',
] as const;

/** Whether this compound's research CONTENT (claims, citations) has
 * completed the enrichment + legacy-claim-reconciliation pipeline and
 * had that record reviewed — independent of IDENTITY_CONFIDENCES
 * (name/identity confidence, Blueprint v2 §12) and
 * expert_review_flag_reason (content-quality/safety warning). Never
 * conflate the three; see the 20260810150000 migration's own comment
 * for the full rationale. */
export const RESEARCH_REVIEW_STATUSES = ['not_reviewed', 'research_reviewed'] as const;

export const EDITORIAL_STATUSES = ['draft', 'in_review', 'published', 'archived'] as const;

export const ALIAS_TYPES = [
  'scientific_name',
  'generic_name',
  'abbreviation',
  'development_code',
  'spelling_variant',
  'brand_name',
] as const;

export const CONTENT_SECTIONS = [
  'summary',
  'mechanism',
  'pharmacokinetics',
  'origin',
  'regulatory',
  'adverse_effects',
  'interactions',
  'storage',
  'faq',
  'safety',
] as const;

export const EVIDENCE_QUALITIES = ['high', 'moderate', 'low', 'very_low', 'not_assessed'] as const;

export const INTERPRETATION_STATUSES = [
  'established',
  'supported',
  'preliminary',
  'conflicting',
  'insufficient',
  'unknown',
] as const;

export const SOURCE_TYPES = [
  'pubmed_article',
  'doi_article',
  'clinicaltrials_gov',
  'fda_document',
  'ema_document',
  'wada_list',
  'pubchem_record',
  'uniprot_record',
  'patent',
  'regulatory_announcement',
  'systematic_review',
  'official_database_record',
  'anecdotal_report',
  'other',
] as const;

export const RETRACTION_STATUSES = [
  'none',
  'corrected',
  'retracted',
  'expression_of_concern',
] as const;

export const IDENTIFIER_TYPES = [
  'doi',
  'pmid',
  'nct_number',
  'patent_number',
  'cas_number',
  'pubchem_cid',
  'other',
] as const;

export const CLAIM_SOURCE_RELATIONSHIPS = [
  'directly_supports',
  'indirectly_supports',
  'contradicts',
  'provides_context',
] as const;

export const STUDY_DESIGNS = [
  'rct_human',
  'non_randomized_human_trial',
  'human_observational',
  'case_report_or_series',
  'systematic_review',
  'meta_analysis',
  'narrative_review',
  'animal_study',
  'in_vitro_study',
  'mechanistic',
] as const;

export const PEER_REVIEW_STATUSES = [
  'peer_reviewed',
  'preprint',
  'not_peer_reviewed',
  'unknown',
] as const;

export const REGULATORY_STATUSES = [
  'approved',
  'not_approved',
  'withdrawn',
  'discontinued',
  'investigational',
  'banned_in_sport',
  'scheduled_controlled_substance',
  'unscheduled',
  'no_determination',
  'other',
] as const;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateCompoundFields(input: Record<string, unknown>): FieldValidationResult {
  const slug = input.slug;
  const name = input.name;
  if (typeof slug !== 'string' || !SLUG_RE.test(slug) || slug.length > 200) {
    return { valid: false, error: 'Slug must be lowercase letters, numbers, and hyphens only.' };
  }
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 300) {
    return { valid: false, error: 'Name is required.' };
  }
  if (input.display_name !== undefined && input.display_name !== null) {
    if (typeof input.display_name !== 'string' || input.display_name.length > 300) {
      return { valid: false, error: 'Invalid display name.' };
    }
  }
  if (
    input.expert_review_flag_reason !== undefined &&
    input.expert_review_flag_reason !== null &&
    input.expert_review_flag_reason !== ''
  ) {
    // An empty string is treated the same as null — "not flagged" —
    // rather than rejected, since a plain HTML form field naturally
    // submits '' (not null) when left blank; both mean the same thing
    // here (the column's own semantics: presence of real text = flagged).
    if (
      typeof input.expert_review_flag_reason !== 'string' ||
      input.expert_review_flag_reason.length > 2000
    ) {
      return { valid: false, error: 'Invalid expert-review flag reason.' };
    }
  }
  if (!oneOf(input.entity_kind, ENTITY_KINDS)) {
    return { valid: false, error: 'Invalid entity kind.' };
  }
  if (
    input.identity_confidence !== undefined &&
    !oneOf(input.identity_confidence, IDENTITY_CONFIDENCES)
  ) {
    return { valid: false, error: 'Invalid identity confidence.' };
  }
  if (
    input.research_review_status !== undefined &&
    !oneOf(input.research_review_status, RESEARCH_REVIEW_STATUSES)
  ) {
    return { valid: false, error: 'Invalid research review status.' };
  }
  if (input.status !== undefined && !oneOf(input.status, EDITORIAL_STATUSES)) {
    return { valid: false, error: 'Invalid status.' };
  }
  if (input.category !== undefined && input.category !== null) {
    if (typeof input.category !== 'string' || input.category.length > 200) {
      return { valid: false, error: 'Invalid category.' };
    }
  }
  return { valid: true };
}

export function validateAliasFields(input: Record<string, unknown>): FieldValidationResult {
  if (
    typeof input.alias !== 'string' ||
    input.alias.trim().length === 0 ||
    input.alias.length > 300
  ) {
    return { valid: false, error: 'Alias text is required.' };
  }
  if (
    input.alias_type !== undefined &&
    input.alias_type !== null &&
    !oneOf(input.alias_type, ALIAS_TYPES)
  ) {
    return { valid: false, error: 'Invalid alias type.' };
  }
  return { valid: true };
}

export function validateClaimFields(input: Record<string, unknown>): FieldValidationResult {
  if (!oneOf(input.content_section, CONTENT_SECTIONS)) {
    return { valid: false, error: 'Invalid content section.' };
  }
  if (typeof input.statement !== 'string' || input.statement.trim().length === 0) {
    return { valid: false, error: 'Claim statement is required.' };
  }
  if (
    input.evidence_quality !== undefined &&
    input.evidence_quality !== null &&
    !oneOf(input.evidence_quality, EVIDENCE_QUALITIES)
  ) {
    return { valid: false, error: 'Invalid evidence quality.' };
  }
  if (
    input.interpretation_status !== undefined &&
    input.interpretation_status !== null &&
    !oneOf(input.interpretation_status, INTERPRETATION_STATUSES)
  ) {
    return { valid: false, error: 'Invalid interpretation status.' };
  }
  if (input.status !== undefined && !oneOf(input.status, EDITORIAL_STATUSES)) {
    return { valid: false, error: 'Invalid status.' };
  }
  // Mirrors the DB's quality_rationale_required CHECK constraint —
  // caught here first for a clear field-level message instead of a raw
  // Postgres constraint-violation error.
  const evidenceQuality = input.evidence_quality;
  const hasRationale =
    typeof input.quality_rationale === 'string' && input.quality_rationale.trim().length > 0;
  if (typeof evidenceQuality === 'string' && evidenceQuality !== 'not_assessed' && !hasRationale) {
    return {
      valid: false,
      error:
        'Quality rationale is required whenever evidence quality is set (other than "not assessed").',
    };
  }
  return { valid: true };
}

export function validateSourceFields(input: Record<string, unknown>): FieldValidationResult {
  if (!oneOf(input.source_type, SOURCE_TYPES)) {
    return { valid: false, error: 'Invalid source type.' };
  }
  if (typeof input.title !== 'string' || input.title.trim().length === 0) {
    return { valid: false, error: 'Source title is required.' };
  }
  if (typeof input.url !== 'string' || input.url.trim().length === 0) {
    return { valid: false, error: 'Source URL is required.' };
  }
  try {
    new URL(input.url as string);
  } catch {
    return { valid: false, error: 'Source URL must be a valid absolute URL.' };
  }
  if (
    input.retraction_status !== undefined &&
    !oneOf(input.retraction_status, RETRACTION_STATUSES)
  ) {
    return { valid: false, error: 'Invalid retraction status.' };
  }
  return { valid: true };
}

export function validateSourceIdentifierFields(
  input: Record<string, unknown>,
): FieldValidationResult {
  if (!oneOf(input.identifier_type, IDENTIFIER_TYPES)) {
    return { valid: false, error: 'Invalid identifier type.' };
  }
  if (typeof input.identifier_value !== 'string' || input.identifier_value.trim().length === 0) {
    return { valid: false, error: 'Identifier value is required.' };
  }
  return { valid: true };
}

export function validateClaimSourceFields(input: Record<string, unknown>): FieldValidationResult {
  if (!oneOf(input.relationship, CLAIM_SOURCE_RELATIONSHIPS)) {
    return { valid: false, error: 'Invalid relationship type.' };
  }
  return { valid: true };
}

export function validateStudyFields(input: Record<string, unknown>): FieldValidationResult {
  if (!oneOf(input.study_design, STUDY_DESIGNS)) {
    return { valid: false, error: 'Invalid study design.' };
  }
  if (
    input.peer_review_status !== undefined &&
    input.peer_review_status !== null &&
    !oneOf(input.peer_review_status, PEER_REVIEW_STATUSES)
  ) {
    return { valid: false, error: 'Invalid peer review status.' };
  }
  if (input.sample_size !== undefined && input.sample_size !== null) {
    const n = Number(input.sample_size);
    if (!Number.isInteger(n) || n < 0) {
      return { valid: false, error: 'Sample size must be a non-negative whole number.' };
    }
  }
  return { valid: true };
}

export function validateRegulatoryRecordFields(
  input: Record<string, unknown>,
): FieldValidationResult {
  if (typeof input.agency !== 'string' || input.agency.trim().length === 0) {
    return { valid: false, error: 'Agency is required.' };
  }
  if (typeof input.jurisdiction !== 'string' || input.jurisdiction.trim().length === 0) {
    return { valid: false, error: 'Jurisdiction is required.' };
  }
  if (!oneOf(input.regulatory_status, REGULATORY_STATUSES)) {
    return { valid: false, error: 'Invalid regulatory status.' };
  }
  if (typeof input.source_id !== 'string' || input.source_id.trim().length === 0) {
    return { valid: false, error: 'A source is required for every regulatory record.' };
  }
  return { valid: true };
}

export function validateStackComponentFields(
  input: Record<string, unknown>,
): FieldValidationResult {
  if (
    typeof input.component_compound_id !== 'string' ||
    input.component_compound_id.trim().length === 0
  ) {
    return { valid: false, error: 'A component compound is required.' };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------
// Blueprint v2 §17 — pre-publish / pre-review checks
// ---------------------------------------------------------------------

export interface PublishReadiness {
  /** Hard blockers — publishing is refused while any exist. */
  blockers: string[];
  /** Surfaced to the reviewer but never auto-blocks (§17: "source
   * reachability is checked but never auto-blocks submission"). */
  warnings: string[];
}

type ClaimForCheck = CompoundWithRelations['claims'][number];

/**
 * Checks a compound is safe to move to 'published'. Mirrors §17's
 * automated pre-review checks: every claim must have at least one
 * citation; a claim with a set evidence_quality must have a rationale
 * (already DB-enforced, re-checked here for a clear message before the
 * write is even attempted).
 */
export function checkPublishReadiness(compound: CompoundWithRelations): PublishReadiness {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const claims = compound.claims ?? [];
  const uncited = claims.filter((c: ClaimForCheck) => (c.claim_sources?.length ?? 0) === 0);
  if (uncited.length > 0) {
    blockers.push(
      `${uncited.length} claim(s) have no cited source. Every claim needs at least one citation before publishing.`,
    );
  }

  const missingRationale = claims.filter(
    (c: ClaimForCheck) =>
      c.evidence_quality &&
      c.evidence_quality !== 'not_assessed' &&
      !(c.quality_rationale && c.quality_rationale.trim().length > 0),
  );
  if (missingRationale.length > 0) {
    blockers.push(
      `${missingRationale.length} claim(s) have an evidence quality set but no quality rationale.`,
    );
  }

  if (claims.length === 0) {
    warnings.push('This compound has no claims at all yet.');
  }

  const regRecords = compound.regulatory_records ?? [];
  const missingRegSource = regRecords.filter((r) => !r.source_id);
  if (missingRegSource.length > 0) {
    blockers.push(`${missingRegSource.length} regulatory record(s) are missing a source.`);
  }

  return { blockers, warnings };
}
