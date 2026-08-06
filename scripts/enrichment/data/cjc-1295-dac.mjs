/**
 * CJC-1295 DAC — research enrichment. Source verified via NCBI
 * E-utilities.
 *
 * Honest coverage note: the real Teichman et al. 2006 human trial is
 * specifically of the long-acting, Drug Affinity Complex (DAC)-conjugated
 * form (half-life 5.8-8.1 days) — this is "CJC-1295" as originally
 * developed/published by ConjuChem/Ipsen. It applies directly to
 * CJC-1295 DAC, not to the separately-sold "CJC-1295 No DAC" product
 * (see cjc-1295-no-dac.mjs for that distinction).
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'cjc-1295-dac',
  sources: [
    {
      key: 'pmid-16352683',
      sourceType: 'pubmed_article',
      title: 'Prolonged stimulation of growth hormone (GH) and insulin-like growth factor I secretion by CJC-1295, a long-acting analog of GH-releasing hormone, in healthy adults.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/16352683/',
      publisherOrAgency: 'The Journal of Clinical Endocrinology & Metabolism',
      publicationDate: '2006-03',
      identifiers: { pmid: '16352683', doi: '10.1210/jc.2005-1536' },
      study: {
        studyDesign: 'rct_human',
        population: 'Healthy adults, ages 21-61',
        intervention: 'CJC-1295 (DAC-conjugated long-acting GHRH analog), single and multiple ascending-dose injections',
        comparator: 'Placebo',
        route: 'Subcutaneous injection',
        duration: 'Two trials, 28 and 49 days, at two investigational sites',
        primaryOutcomes: 'Plasma GH and IGF-1 concentrations; pharmacokinetics; safety',
        resultsSummary:
          'A single CJC-1295 injection produced dose-dependent 2- to 10-fold increases in mean plasma GH for 6+ days and 1.5- to 3-fold increases in IGF-1 for 9-11 days; estimated CJC-1295 half-life was 5.8-8.1 days. With multiple doses, mean IGF-1 remained above baseline for up to 28 days. No serious adverse reactions were reported.',
        limitations: 'Sponsor-affiliated authors (drug developer, ConjuChem); healthy-adult population, not a specific patient population; longer-term (beyond ~28-49 days) safety not assessed in this trial.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'In a randomized, placebo-controlled human trial (healthy adults, ages 21-61), CJC-1295 (DAC-conjugated) produced dose-dependent, prolonged increases in growth hormone and IGF-1 — GH elevated 2- to 10-fold for 6+ days after a single injection, and IGF-1 remained above baseline for up to 28 days with repeated dosing, with an estimated compound half-life of 5.8-8.1 days.',
      evidenceQuality: 'moderate',
      qualityRationale: 'Randomized, placebo-controlled human trial published in a peer-reviewed endocrinology journal — but sponsor-affiliated, small/short-duration, and in healthy volunteers rather than a target patient population.',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-16352683', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: 'a881eb58-4080-46cd-886b-70873ea28b39',
      legacyStatementExcerpt: 'CJC-1295 DAC is a synthetic GHRH analog studied for its ability to stimulate growth hormone release through the GHRH receptor',
      disposition: 'supported',
      rationale: 'Directly confirmed by the pivotal human trial for this specific (DAC-conjugated) form.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-16352683', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '6d5434d1-5b08-4de5-a026-447510102663',
      legacyStatementExcerpt: 'Researchers investigate CJC-1295 DAC in relation to growth hormone physiology, IGF-1 signaling, endocrine regulation, body composition, recovery biology, and healthy aging',
      disposition: 'revised',
      rationale:
        'GH/IGF-1 physiology and endocrine regulation are directly confirmed by the verified trial. "Body composition, recovery biology, and healthy aging" are not measured outcomes in the verified trial (which measured hormone levels and safety, not body-composition or recovery endpoints) — these broader claims are not independently supported by the source identified in this review.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-16352683', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '181f5827-413b-409e-a5c3-b9d822b3b8d9',
      legacyStatementExcerpt: 'CJC-1295 DAC binds to GHRH receptors and is studied for stimulating growth hormone release',
      disposition: 'supported',
      rationale: 'Confirmed mechanism and pharmacodynamic effect (GH/IGF-1 elevation).',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-16352683', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '255e8091-be7d-4047-b3bd-b4bb65b8af9e',
      legacyStatementExcerpt: 'Q: What does DAC mean? A: DAC stands for Drug Affinity Complex. It is researched for its effect on circulation time',
      disposition: 'supported',
      rationale: 'Confirmed — the verified trial directly measured the prolonged half-life (5.8-8.1 days) attributable to the DAC conjugation.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-16352683', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '5c8142e0-b93c-408a-8cfd-b34af7d792d0',
      legacyStatementExcerpt: 'Q: How is CJC-1295 DAC different from CJC-1295 No DAC? A: The DAC version is studied for longer duration',
      disposition: 'supported',
      rationale: 'Confirmed for the DAC version by the verified trial; see cjc-1295-no-dac.mjs for the corresponding No-DAC-side reconciliation.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-16352683', relationship: 'directly_supports' }],
    },
    policyReconciliation('0e191d00-881e-4bc4-88e9-135f88083f4e', 'Q: Does this page include dosage information? A: No.'),
    policyReconciliation('7dad50d1-add1-4428-a55b-2c5d58a20c27', 'This page summarizes publicly available scientific literature for educational purposes only.'),
    policyReconciliation('3413f3fb-27a6-4329-a01d-0d576633ed67', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    policyReconciliation('bc4132c1-a795-496b-a860-fa28815e6fa9', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
