/**
 * CJC-1295 No DAC (a.k.a. "Mod GRF 1-29") — research enrichment.
 *
 * Honest coverage note: this compound is commonly conflated with
 * CJC-1295 DAC (see cjc-1295-dac.mjs), but the real 2006 Teichman et al.
 * human trial studied the DAC-CONJUGATED, long-acting form specifically
 * (estimated half-life 5.8-8.1 days) — a pharmacokinetic signature that
 * belongs to the DAC/albumin-binding chemistry, not the unconjugated
 * "No DAC" product. No dedicated, independently-verifiable human or
 * animal trial of the specific commercial "CJC-1295 No DAC" product was
 * located during this review. It is structurally related to
 * tetrasubstituted GRF(1-29) super-agonist analogs studied since the
 * 1980s (e.g. Hoffmann-La Roche's [des-amino-Tyr1,D-Ala2,Ala15]-GRF(1-29)),
 * but that is class-level, not compound-specific, evidence, and this
 * review did not confirm the exact substitution pattern is identical.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'cjc-1295-no-dac',
  sources: [
    {
      key: 'pmid-2880720',
      sourceType: 'pubmed_article',
      title:
        'Testing with growth hormone-releasing factor (GRF(1-29)NH2) and somatomedin C measurements for the evaluation of growth hormone deficiency.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/2880720/',
      publisherOrAgency: '(journal not independently re-confirmed in this review)',
      identifiers: { pmid: '2880720' },
      study: {
        studyDesign: 'human_observational',
        population: 'Humans undergoing GH-deficiency evaluation',
        intervention:
          'Unmodified GRF(1-29)NH2 (the parent, non-stabilized sequence CJC-1295 No DAC is derived from)',
        resultsSummary:
          'Establishes that the parent GRF(1-29)NH2 sequence stimulates growth hormone release in humans — foundational pharmacology for the entire GRF(1-29) analog class, not a study of the "No DAC" stabilized analog itself.',
        limitations:
          'Studies the original, short-half-life GRF(1-29)NH2 peptide, not the tetrasubstituted, stabilized analog sold commercially as "CJC-1295 No DAC" — cited here only as foundational class context.',
        peerReviewStatus: 'unknown',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'No dedicated, independently-verifiable human or animal trial of the specific commercial product sold as "CJC-1295 No DAC" (a stabilized, tetrasubstituted analog of GRF(1-29) without the Drug Affinity Complex conjugation) was located during this review. The well-known 2006 human trial (Teichman et al.) frequently cited for "CJC-1295" studied the DAC-conjugated long-acting form specifically (see cjc-1295-dac.mjs) — its long half-life (5.8-8.1 days) is a signature of the DAC/albumin-binding chemistry that the "No DAC" version, by design, lacks.',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-2880720', relationship: 'provides_context' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: 'd73f34b4-a53f-4960-8f39-73c32b9764b6',
      legacyStatementExcerpt:
        'CJC-1295 No DAC is a synthetic growth hormone-releasing hormone (GHRH) analog commonly studied for its ability to stimulate endogenous growth hormone release',
      disposition: 'unsupported',
      rationale:
        'The GHRH-receptor-agonist mechanism is structurally plausible and consistent with the broader GRF(1-29) analog class (see pmid-2880720 for foundational class pharmacology), but no dedicated study of this SPECIFIC "No DAC" commercial product was located — "commonly studied" overstates what is verifiable. This is very likely conflating the well-studied DAC-conjugated CJC-1295 (see cjc-1295-dac.mjs) with the separately-sold No-DAC product.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-2880720', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: '8e9b2af6-dcd8-42b8-a332-555becad38fd',
      legacyStatementExcerpt:
        'Researchers investigate its effects on growth hormone physiology, IGF-1 signaling, body composition, recovery, and endocrine function',
      disposition: 'unsupported',
      rationale:
        'Same finding — these specific downstream effects (body composition, recovery) are not verified for the "No DAC" product; they mirror claims that ARE verified for the DAC-conjugated form (cjc-1295-dac.mjs), suggesting cross-contamination between the two product pages.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '47189cd5-05c5-457e-828b-b56a09a9a899',
      legacyStatementExcerpt:
        'CJC-1295 No DAC binds to GHRH receptors in the pituitary, promoting pulsatile growth hormone release',
      disposition: 'revised',
      rationale:
        'The GHRH-receptor mechanism itself is well established for the drug class generally (confirmed by foundational GRF(1-29) pharmacology), but no source specific to this exact commercial analog was located — supported as a class-level mechanistic statement, not as compound-specific evidence.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-2880720', relationship: 'indirectly_supports' }],
    },
    {
      legacyClaimId: 'a23c06a8-bd8b-42b1-ade5-f7f910382b73',
      legacyStatementExcerpt:
        'Q: What is the difference between CJC-1295 No DAC and CJC-1295 DAC? A: The two compounds are researched separately because the addition of Drug Affinity Complex (DAC) changes pharmacokinetic properties',
      disposition: 'supported',
      rationale:
        "Accurate framing, consistent with this review's own finding that the two products' evidence bases should not be conflated.",
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-2880720', relationship: 'provides_context' }],
    },
    policyReconciliation(
      '85cc2a9f-6d33-4bf5-b3a3-7a3b4c26b62c',
      'Q: Does this page provide dosage information? A: No.',
    ),
    policyReconciliation(
      '61b01b37-1fa9-4ea9-af2f-0de2c8d814d0',
      'Q: What is this page for? A: This page summarizes publicly available scientific literature',
    ),
    policyReconciliation(
      '2500e979-c17f-4465-84a6-02864ce45aab',
      'This page summarizes published scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      '0c97b502-8de7-4600-a69b-da1ec7cd046c',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    policyReconciliation(
      'b5cd8b4c-269e-4d8d-9376-b3485f49d8f9',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
