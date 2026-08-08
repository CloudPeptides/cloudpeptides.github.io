/**
 * MOTS-c — research enrichment. Source verified via NCBI E-utilities.
 *
 * Honest coverage note: MOTS-c's foundational evidence is a single,
 * highly-cited mouse study (Lee et al., Cell Metabolism 2015). No human
 * clinical trial was identified in this review.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'mots-c',
  sources: [
    {
      key: 'pmid-25738459',
      sourceType: 'pubmed_article',
      title: 'The mitochondrial-derived peptide MOTS-c promotes metabolic homeostasis and reduces obesity and insulin resistance.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/25738459/',
      publisherOrAgency: 'Cell Metabolism',
      publicationDate: '2015-03-03',
      identifiers: { pmid: '25738459', doi: '10.1016/j.cmet.2015.02.009' },
      study: {
        studyDesign: 'animal_study',
        population: 'Mice (aged and diet-induced obese models) and cell lines (HEK293, skeletal muscle)',
        intervention: 'MOTS-c (16-amino-acid peptide encoded within mitochondrial 12S rRNA), administered exogenously',
        resultsSummary:
          'MOTS-c prevented age-dependent and high-fat-diet-induced insulin resistance and diet-induced obesity in mice, improved insulin sensitivity in old mice via increased muscle glucose uptake, and reduced weight gain/liver fat accumulation in high-fat-diet-fed mice. Mechanistically, MOTS-c increased endogenous AICAR levels via de novo purine biosynthesis, activating AMPK signaling.',
        limitations: 'Foundational, highly-cited mouse study; no human trial identified in this review.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        'MOTS-c is a 16-amino-acid peptide encoded within mitochondrial DNA (the 12S rRNA region) — one of a small number of known biologically active, mitochondrially-encoded peptides. In mice, it activates AMPK signaling (via increased endogenous AICAR levels through de novo purine biosynthesis) and improves insulin sensitivity and metabolic homeostasis.',
      evidenceQuality: 'moderate',
      qualityRationale: 'Published in a top-tier journal (Cell Metabolism) and highly cited, but a single foundational mouse study — no independent human replication identified in this review.',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-25738459', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'safety',
      statement:
        'As of this review, no published human clinical trial of MOTS-c was identified — all efficacy and mechanistic evidence is from mouse and cell-culture studies.',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-25738459', relationship: 'provides_context' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '4a3c0596-5a2f-46e3-b3a1-b5920627b320',
      legacyStatementExcerpt: 'MOTS-c is a naturally occurring mitochondrial-derived peptide that has become an important area of research in metabolism, exercise physiology, and healthy aging',
      disposition: 'supported',
      rationale: 'Confirmed unique mitochondrial-DNA-encoded origin and metabolic research focus, though the "exercise physiology" specific claim was not directly verified as its own dedicated study in this review (the foundational study covers metabolic homeostasis/insulin sensitivity, not exercise performance specifically).',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-25738459', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '4c6b7144-c798-4ff1-b160-42d6c49f717a',
      legacyStatementExcerpt: 'Scientists continue investigating its potential role in regulating cellular energy utilization, metabolic flexibility, mitochondrial communication',
      disposition: 'supported',
      rationale: 'Consistent with the verified foundational mechanistic study.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-25738459', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'd7457031-4f88-4387-a6e7-be36ea566c6f',
      legacyStatementExcerpt: 'Current research suggests MOTS-c participates in cellular stress responses and metabolic adaptation',
      disposition: 'supported',
      rationale: 'Confirmed.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-25738459', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '9bba0576-a5d7-4cb8-b132-7089b905528d',
      legacyStatementExcerpt: 'Q: What makes MOTS-c unique? A: MOTS-c is one of the few biologically active peptides encoded by mitochondrial DNA',
      disposition: 'supported',
      rationale: 'Directly confirmed, accurate and notable fact.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-25738459', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '7f1218a0-06f7-4245-b25f-905f20a1f9d5',
      legacyStatementExcerpt: 'Q: Why is MOTS-c found in two categories? A: Researchers investigate MOTS-c for both metabolic regulation and healthy aging',
      disposition: 'supported',
      rationale: 'Consistent with the verified foundational study, which covers both metabolic (insulin sensitivity, obesity) and aging (age-dependent insulin resistance in old mice) findings.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-25738459', relationship: 'directly_supports' }],
    },
    policyReconciliation('9699e842-221c-4c94-90cc-52a04165e7dd', 'Q: Does Cloud Peptides provide dosage recommendations? A: No.'),
    policyReconciliation('568cb511-a9e0-499e-a934-d0f65764cf27', 'This page summarizes published scientific literature for educational purposes only.'),
    policyReconciliation('b5aa5503-49f4-40d3-b8c7-d2afd80d0c3e', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    policyReconciliation('13ba3db0-c1ef-45f7-b1d8-cce09e66eb23', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
