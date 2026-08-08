/**
 * Hand-maintained to match supabase/migrations/*.sql exactly (kept in
 * sync manually — `supabase gen types typescript --linked` needs a
 * Management API access token, which is intentionally not kept around
 * outside the one-time Phase 2 migration work). Only the fields Phase 3
 * actually reads are typed; extend as later phases need more.
 */

export type EntityKind =
  | 'peptide'
  | 'peptide_blend'
  | 'stack'
  | 'small_molecule_drug'
  | 'biologic'
  | 'supplement'
  | 'non_peptide_research_compound';

export type IdentityConfidence = 'verified' | 'disputed' | 'unverified' | 'likely_naming_variant';

export type EditorialStatus = 'draft' | 'in_review' | 'published' | 'archived';

export type ContentSection =
  | 'summary'
  | 'mechanism'
  | 'pharmacokinetics'
  | 'origin'
  | 'regulatory'
  | 'adverse_effects'
  | 'interactions'
  | 'storage'
  | 'faq'
  | 'safety';

export type EvidenceQuality = 'high' | 'moderate' | 'low' | 'very_low' | 'not_assessed';

export type InterpretationStatus =
  'established' | 'supported' | 'preliminary' | 'conflicting' | 'insufficient' | 'unknown';

export type SourceType =
  | 'pubmed_article'
  | 'doi_article'
  | 'clinicaltrials_gov'
  | 'fda_document'
  | 'ema_document'
  | 'wada_list'
  | 'pubchem_record'
  | 'uniprot_record'
  | 'patent'
  | 'regulatory_announcement'
  | 'systematic_review'
  | 'official_database_record'
  | 'anecdotal_report'
  | 'other';

export type StudyDesign =
  | 'rct_human'
  | 'non_randomized_human_trial'
  | 'human_observational'
  | 'case_report_or_series'
  | 'systematic_review'
  | 'meta_analysis'
  | 'narrative_review'
  | 'animal_study'
  | 'in_vitro_study'
  | 'mechanistic';

export type PeerReviewStatus = 'peer_reviewed' | 'preprint' | 'not_peer_reviewed' | 'unknown';

export type RegulatoryStatus =
  | 'approved'
  | 'not_approved'
  | 'withdrawn'
  | 'discontinued'
  | 'investigational'
  | 'banned_in_sport'
  | 'scheduled_controlled_substance'
  | 'unscheduled'
  | 'no_determination'
  | 'other';

export interface Compound {
  id: string;
  slug: string;
  name: string;
  entity_kind: EntityKind;
  identity_confidence: IdentityConfidence;
  category: string | null;
  status: EditorialStatus;
  legacy_source_path: string | null;
  raw_import_metadata: Record<string, unknown> | null;
  last_reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export type AliasType =
  | 'scientific_name'
  | 'generic_name'
  | 'abbreviation'
  | 'development_code'
  | 'spelling_variant'
  | 'brand_name';

export interface CompoundAlias {
  id: string;
  compound_id: string;
  alias: string;
  alias_type?: AliasType | null;
  note?: string | null;
}

export interface Claim {
  id: string;
  compound_id: string;
  content_section: ContentSection;
  statement: string;
  evidence_quality: EvidenceQuality | null;
  quality_rationale: string | null;
  interpretation_status: InterpretationStatus | null;
  display_order: number | null;
  status: EditorialStatus;
}

export type IdentifierType =
  'doi' | 'pmid' | 'nct_number' | 'patent_number' | 'cas_number' | 'pubchem_cid' | 'other';

export interface SourceIdentifier {
  source_id: string;
  identifier_type: IdentifierType;
  identifier_value: string;
}

export interface Source {
  id: string;
  source_type: SourceType;
  study_id: string | null;
  title: string;
  url: string;
  publisher_or_agency: string | null;
  publication_date: string | null;
  retrieved_date: string;
  retraction_status: 'none' | 'corrected' | 'retracted' | 'expression_of_concern';
  retraction_note?: string | null;
  /** Joined via study_id — null whenever the source has none attached
   * (true for every currently-migrated draft; real editorial work adds
   * this later). */
  studies?: Study | null;
  /** DOI/PMID/NCT/etc. — joined via source_identifiers (Phase 3). */
  source_identifiers?: SourceIdentifier[];
}

export interface ClaimSource {
  claim_id: string;
  source_id: string;
  relationship: 'directly_supports' | 'indirectly_supports' | 'contradicts' | 'provides_context';
  locator: string | null;
  date_accessed: string;
}

export interface Study {
  id: string;
  study_design: StudyDesign;
  population: string | null;
  sample_size: number | null;
  comparator: string | null;
  intervention: string | null;
  route: string | null;
  duration: string | null;
  primary_outcomes: string | null;
  secondary_outcomes: string | null;
  results_summary: string | null;
  limitations: string | null;
  registration_number: string | null;
  peer_review_status: PeerReviewStatus | null;
}

export interface RegulatoryRecord {
  id: string;
  compound_id: string;
  agency: string;
  jurisdiction: string;
  formulation: string | null;
  indication: string | null;
  regulatory_status: RegulatoryStatus;
  effective_date: string | null;
  status_change_date: string | null;
  source_id: string;
  last_verified_date: string;
  notes: string | null;
}

export interface StackComponent {
  stack_id: string;
  component_compound_id: string;
  dose_or_ratio_note: string | null;
}

/** Joined shape used by the compound-profile page (one query, nested selects). */
export interface CompoundWithRelations extends Compound {
  compound_aliases: CompoundAlias[];
  claims: (Claim & { claim_sources: (ClaimSource & { sources: Source })[] })[];
  regulatory_records: (RegulatoryRecord & { sources: Source })[];
  stack_components: (StackComponent & { compounds: Pick<Compound, 'id' | 'slug' | 'name'> })[];
}
