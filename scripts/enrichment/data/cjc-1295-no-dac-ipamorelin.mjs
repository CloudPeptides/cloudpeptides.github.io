/**
 * CJC-1295 No DAC + Ipamorelin (peptide blend) — research enrichment.
 *
 * Honest coverage note: no published study of this specific combination
 * was identified. Ipamorelin itself (a ghrelin-receptor/GHS-R agonist)
 * has real human evidence that will be independently researched for its
 * own compound page in a later batch; CJC-1295 No DAC's own evidence gap
 * is documented in cjc-1295-no-dac.mjs. This file does not duplicate
 * Ipamorelin's full literature review — only enough to support this
 * stack's reconciliation.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'cjc-1295-no-dac-ipamorelin',
  sources: [
    {
      key: 'pmid-2880720-blend',
      sourceType: 'pubmed_article',
      title:
        'Testing with growth hormone-releasing factor (GRF(1-29)NH2) and somatomedin C measurements for the evaluation of growth hormone deficiency.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/2880720/',
      identifiers: { pmid: '2880720' },
      study: {
        studyDesign: 'human_observational',
        intervention:
          'Unmodified GRF(1-29)NH2, the parent sequence CJC-1295 No DAC is derived from',
        resultsSummary:
          'Foundational class evidence that GRF(1-29)-family peptides stimulate GH release in humans (see cjc-1295-no-dac.mjs for the fuller gap analysis on the specific commercial "No DAC" product).',
        peerReviewStatus: 'unknown',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'No published study of CJC-1295 No DAC co-administered with Ipamorelin (this specific named combination) was identified during this review. Both are GH-secretagogue-pathway peptides (a GHRH-receptor agonist and a ghrelin-receptor/GHS-R agonist respectively) that are mechanistically complementary in concept, but that rationale is not itself evidence that the combination has been studied or produces a specific measured effect.',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-2880720-blend', relationship: 'provides_context' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '96a034a8-d6f2-491a-b8f4-7980edd43247',
      legacyStatementExcerpt:
        'CJC-1295 No DAC and Ipamorelin are frequently investigated together because they influence separate pathways involved in endogenous growth hormone release',
      disposition: 'unsupported',
      rationale:
        'The premise that they are "frequently investigated together" is not supported — no study of the combination was located. Separately, CJC-1295 No DAC\'s own evidence base for the specific commercial product is itself unverified (see cjc-1295-no-dac.mjs) — compounding the issue for this blend claim.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-2880720-blend', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: 'b66045c3-af9d-423f-ab77-bdd2b80371a0',
      legacyStatementExcerpt:
        'Current research explores applications involving body composition, recovery biology, endocrine regulation, and exercise adaptation',
      disposition: 'unsupported',
      rationale: 'No research on the combination itself evaluating these outcomes was located.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: 'dd4a86f9-72bd-4ba2-a07e-e0c589b6791c',
      legacyStatementExcerpt:
        'Q: Why are these compounds researched together? A: Researchers investigate this pairing because each compound stimulates endogenous growth hormone release through different biological pathways',
      disposition: 'revised',
      rationale:
        'A plausible commercial/mechanistic rationale for pairing GHRH-receptor and ghrelin-receptor agonists, but not evidence the pairing itself has been researched — best understood as a product-design rationale, not a scientific claim of studied efficacy.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    policyReconciliation(
      '295681f7-cb61-40a6-8644-c687c83e207d',
      'Q: Does this page provide dosage recommendations? A: No.',
    ),
    policyReconciliation(
      '89a8f53d-aa49-4938-b2b7-738384a87c1e',
      'Q: What is the purpose of this page? A: This article summarizes publicly available scientific literature',
    ),
    policyReconciliation(
      '9a4df771-5a4f-422c-a266-09f20ffd3559',
      'This page summarizes published scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      '840967a2-b5d3-4e8c-8a9d-81fa97434941',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    policyReconciliation(
      '64ea620e-b310-47a1-9c5f-572350bb8445',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
