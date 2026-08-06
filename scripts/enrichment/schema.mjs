/**
 * Type documentation (JSDoc, not TS — this runs as a plain Node script,
 * matching the other scripts/migration/*.mjs files) for the enrichment
 * pipeline's per-compound data files (scripts/enrichment/data/*.mjs).
 *
 * Every field here maps directly to a real column in the Blueprint v2
 * schema (supabase/migrations/20260806144903_research_schema.sql) — the
 * pipeline never invents a field the schema doesn't have, and never
 * writes anything not represented here.
 *
 * @typedef {Object} EnrichmentSource
 * @property {string} key - Local identifier used to link claims to this
 *   source within the same file (never written to the DB).
 * @property {'pubmed_article'|'doi_article'|'clinicaltrials_gov'|'fda_document'|'ema_document'|'wada_list'|'systematic_review'|'other'} sourceType
 * @property {string} title - Real, verified article/record title.
 * @property {string} url - Real, verified, directly-accessible URL.
 * @property {string} [publisherOrAgency]
 * @property {string} [publicationDate] - ISO date (YYYY-MM-DD or YYYY-MM).
 * @property {{doi?: string, pmid?: string, nctNumber?: string}} [identifiers]
 * @property {EnrichmentStudy} [study] - Present when this source is a
 *   real study (not every source is — e.g. a WADA list page isn't).
 *
 * @typedef {Object} EnrichmentStudy
 * @property {'rct_human'|'non_randomized_human_trial'|'human_observational'|'case_report_or_series'|'systematic_review'|'meta_analysis'|'narrative_review'|'animal_study'|'in_vitro_study'|'mechanistic'} studyDesign
 * @property {string} [population] - Species/population description, verbatim from the source.
 * @property {number} [sampleSize]
 * @property {string} [intervention]
 * @property {string} [comparator]
 * @property {string} [route]
 * @property {string} [duration]
 * @property {string} [primaryOutcomes]
 * @property {string} [resultsSummary]
 * @property {string} [limitations]
 * @property {'peer_reviewed'|'preprint'|'not_peer_reviewed'|'unknown'} [peerReviewStatus]
 * @property {string} [registrationNumber] - For clinicaltrials_gov sources.
 *
 * @typedef {Object} EnrichmentClaim
 * @property {'summary'|'mechanism'|'pharmacokinetics'|'origin'|'regulatory'|'adverse_effects'|'interactions'|'storage'|'faq'|'safety'} contentSection
 * @property {string} statement - Must be directly traceable to the linked source(s); never a
 *   broader claim than the source actually supports.
 * @property {'high'|'moderate'|'low'|'very_low'|'not_assessed'} [evidenceQuality]
 * @property {string} [qualityRationale] - Required if evidenceQuality is set and isn't 'not_assessed'.
 * @property {'established'|'supported'|'preliminary'|'conflicting'|'insufficient'|'unknown'} interpretationStatus
 * @property {{sourceKey: string, relationship: 'directly_supports'|'indirectly_supports'|'contradicts'|'provides_context', locator?: string}[]} sources
 *
 * @typedef {Object} EnrichmentRegulatoryRecord
 * @property {string} agency
 * @property {string} jurisdiction
 * @property {string} [formulation]
 * @property {string} [indication]
 * @property {'approved'|'not_approved'|'withdrawn'|'discontinued'|'investigational'|'banned_in_sport'|'scheduled_controlled_substance'|'unscheduled'|'no_determination'|'other'} regulatoryStatus
 * @property {string} [effectiveDate]
 * @property {string} [statusChangeDate]
 * @property {string} sourceKey
 * @property {string} [notes]
 *
 * @typedef {Object} LegacyClaimReconciliation
 * @property {string} legacyClaimId - The real, pre-existing `claims.id` UUID
 *   for this legacy claim, queried from the staging DB before writing this
 *   file (never invented). The pipeline never touches `statement`,
 *   `content_section`, `compound_id`, or `status` on this row — only
 *   `evidence_quality`, `quality_rationale`, and `interpretation_status`
 *   are set, plus new claim_sources links. The original legacy text is
 *   never overwritten.
 * @property {string} legacyStatementExcerpt - First ~80 characters of the
 *   original statement, recorded here only so a human reviewer can
 *   cross-check this reconciliation against the right row — never written
 *   to the DB.
 * @property {'supported'|'revised'|'unsupported'|'contradicted'|'superseded'} disposition
 *   Recorded in the pipeline's run log/report (there is no DB column for
 *   this — it is not part of the Blueprint v2 schema) and folded into the
 *   written `quality_rationale` as a dated, labeled note.
 * @property {string} rationale - Human-readable explanation of the
 *   disposition; becomes part of the written `quality_rationale`.
 * @property {'high'|'moderate'|'low'|'very_low'|'not_assessed'} [evidenceQuality]
 * @property {'established'|'supported'|'preliminary'|'conflicting'|'insufficient'|'unknown'} interpretationStatus
 * @property {{sourceKey: string, relationship: 'directly_supports'|'indirectly_supports'|'contradicts'|'provides_context', locator?: string}[]} sources
 *   New, verified sources (by local `key`, defined in this same file's
 *   `sources` array) linked to this pre-existing legacy claim.
 *
 * @typedef {Object} CompoundEnrichment
 * @property {string} slug - Must match an existing draft compound's slug exactly.
 * @property {EnrichmentSource[]} sources
 * @property {EnrichmentClaim[]} claims
 * @property {EnrichmentRegulatoryRecord[]} regulatoryRecords
 * @property {LegacyClaimReconciliation[]} [legacyReconciliations] - Omit
 *   entirely (or use []) for a compound with no pre-existing legacy claims
 *   (e.g. Semax in the pilot).
 */
export {};
