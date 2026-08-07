/**
 * Shared evidence-classification helpers — single source of truth for
 * "what display type does this source_type/study_design combination
 * count as," reused by EvidenceBadge.astro, the compound profile page's
 * evidence-by-type grid, and the directory's evidence-type/evidence-
 * strength filters. Previously this mapping was duplicated (and had to
 * be "kept in sync manually") between EvidenceBadge and the profile
 * page — centralizing it here removes that drift risk.
 */
import type { EvidenceQuality, SourceType, StudyDesign } from './database.types';

export type EvidenceDisplayType =
  | 'human'
  | 'animal'
  | 'in-vitro'
  | 'mechanistic'
  | 'regulatory'
  | 'anecdotal'
  | 'database'
  | 'review'
  | 'other';

export const HUMAN_STUDY_DESIGNS: StudyDesign[] = [
  'rct_human',
  'non_randomized_human_trial',
  'human_observational',
  'case_report_or_series',
];

const REVIEW_STUDY_DESIGNS: StudyDesign[] = [
  'systematic_review',
  'meta_analysis',
  'narrative_review',
];

const REGULATORY_SOURCE_TYPES: SourceType[] = [
  'fda_document',
  'ema_document',
  'wada_list',
  'regulatory_announcement',
];

const DATABASE_SOURCE_TYPES: SourceType[] = [
  'official_database_record',
  'pubchem_record',
  'uniprot_record',
];

export function resolveEvidenceDisplayType(
  sourceType: SourceType | undefined,
  studyDesign: StudyDesign | null | undefined,
): EvidenceDisplayType {
  if (studyDesign) {
    if (HUMAN_STUDY_DESIGNS.includes(studyDesign)) return 'human';
    if (studyDesign === 'animal_study') return 'animal';
    if (studyDesign === 'in_vitro_study') return 'in-vitro';
    if (studyDesign === 'mechanistic') return 'mechanistic';
    if (REVIEW_STUDY_DESIGNS.includes(studyDesign)) return 'review';
  }
  if (sourceType === 'anecdotal_report') return 'anecdotal';
  if (sourceType === 'clinicaltrials_gov') return 'human';
  if (sourceType && REGULATORY_SOURCE_TYPES.includes(sourceType)) return 'regulatory';
  if (sourceType && DATABASE_SOURCE_TYPES.includes(sourceType)) return 'database';
  return 'other';
}

export const EVIDENCE_DISPLAY_LABELS: Record<EvidenceDisplayType, string> = {
  human: 'Human',
  animal: 'Animal',
  'in-vitro': 'In-vitro',
  mechanistic: 'Mechanistic',
  regulatory: 'Regulatory',
  anecdotal: 'Anecdotal (not a study)',
  database: 'Database record',
  review: 'Review',
  other: 'Other source',
};

/** Higher = stronger. Used to compute a compound's "best evidence" for
 * the directory's evidence-strength filter/sort, and to rank a set of
 * claims down to a single representative value. Never used to *change*
 * an individual claim's own recorded evidence_quality — only to
 * aggregate/sort across many. */
export const EVIDENCE_QUALITY_RANK: Record<EvidenceQuality, number> = {
  high: 4,
  moderate: 3,
  low: 2,
  very_low: 1,
  not_assessed: 0,
};

export const EVIDENCE_QUALITY_LABELS: Record<EvidenceQuality, string> = {
  high: 'High',
  moderate: 'Moderate',
  low: 'Low',
  very_low: 'Very low',
  not_assessed: 'Not assessed',
};

/** Returns the strongest evidence_quality among a set of values, or null if none present. */
export function maxEvidenceQuality(
  values: (EvidenceQuality | null | undefined)[],
): EvidenceQuality | null {
  let best: EvidenceQuality | null = null;
  for (const v of values) {
    if (!v) continue;
    if (!best || EVIDENCE_QUALITY_RANK[v] > EVIDENCE_QUALITY_RANK[best]) best = v;
  }
  return best;
}
