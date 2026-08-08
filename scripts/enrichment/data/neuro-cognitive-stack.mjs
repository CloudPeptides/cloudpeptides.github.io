/**
 * Neuro-Cognitive Stack (Semax + Selank) — research enrichment.
 *
 * Honest coverage note: same combination as the Calm Focus Stack
 * (batch 2) — no published study of Semax co-administered with Selank
 * (the combination itself) was identified. Each has its own
 * separately-verified evidence base (Semax: semax.mjs, pilot; Selank:
 * sourced lightly here and in calm-focus-stack.mjs, with its own full
 * page reserved for a later batch).
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'neuro-cognitive-stack',
  sources: [
    {
      key: 'pmid-30255741-neurostack',
      sourceType: 'pubmed_article',
      title:
        'Peptide-based Anxiolytics: The Molecular Aspects of Heptapeptide Selank Biological Activity.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/30255741/',
      identifiers: { pmid: '30255741' },
      study: {
        studyDesign: 'narrative_review',
        intervention: 'Selank',
        resultsSummary:
          "See calm-focus-stack.mjs and Selank's own forthcoming compound page for the fuller evidence base.",
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'No published study of Semax co-administered with Selank (the "Neuro-Cognitive Stack" combination itself) was identified during this review — the same finding as this pipeline\'s Calm Focus Stack (batch 2), which is the identical pairing marketed under a different product name. Both peptides have real, separately-verified neuroscience literature; the combination itself does not.',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-30255741-neurostack', relationship: 'provides_context' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '5e88b07d-4e49-4b4e-ac37-be539d3ae55d',
      legacyStatementExcerpt:
        'The Neuro-Cognitive Stack combines Semax and Selank, two synthetic peptides that are frequently investigated in neuroscience research',
      disposition: 'revised',
      rationale:
        'Each peptide individually has real neuroscience literature (confirmed). This SPECIFIC PAIRING is not itself studied — no combination research exists. Same finding as the identically-composed Calm Focus Stack.',
      evidenceQuality: 'low',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-30255741-neurostack', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: '037a85c5-0d05-4a83-bc04-86c19b0d66c5',
      legacyStatementExcerpt:
        'Although both compounds are associated with cognitive research, they are believed to influence different biological systems',
      disposition: 'supported',
      rationale:
        'Accurately hedged ("believed to"), consistent with each peptide\'s distinct, separately-verified mechanism.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-30255741-neurostack', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: '4f288ba5-1156-43c3-8ef8-ab935947fbeb',
      legacyStatementExcerpt:
        'Research in this field is ongoing, and conclusions should always be based on peer-reviewed scientific literature',
      disposition: 'supported',
      rationale: 'Generic, appropriately cautious statement.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: '13b928fa-344c-4c99-b5cf-b2e9407fc64f',
      legacyStatementExcerpt:
        'Researchers investigate Semax and Selank together because they are associated with complementary areas of neuroscience',
      disposition: 'unsupported',
      rationale:
        'No source investigating the two "together" was located — this is identical in substance to the Calm Focus Stack claim already reconciled in batch 2.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '9b0d63c3-fe15-4139-bcbc-9a166dbda792',
      legacyStatementExcerpt:
        'Q: Why are Semax and Selank researched together? A: Researchers investigate this combination because each compound has been associated with different areas',
      disposition: 'revised',
      rationale:
        "A plausible product-design rationale (identical to the Calm Focus Stack's equivalent FAQ), not evidence the pairing itself has been researched.",
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    policyReconciliation(
      '8d674e9c-d7d2-47b9-843f-b3d30983638f',
      'Q: Does Cloud Peptides recommend this stack? A: No.',
    ),
    policyReconciliation(
      '0c3112a8-36d7-41d2-b3b6-63c841d36d28',
      'Q: Does this article include dosage information? A: No.',
    ),
    policyReconciliation(
      'c9fc829f-3920-452a-9e8a-b01759bfdfee',
      'Q: Are these products intended for human consumption? A: No.',
    ),
    policyReconciliation(
      'c69cd799-8619-4745-9241-f32a64fdc77f',
      'This page summarizes published scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      'a23bfe98-d5cf-4d5a-ab3c-bacd8157026b',
      'Cloud Peptides does not provide medical advice, dosage recommendations, treatment advice',
    ),
    policyReconciliation(
      '923cdcc7-df18-4a13-82b7-c063200af40a',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
