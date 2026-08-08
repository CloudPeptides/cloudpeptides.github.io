/**
 * The Wolverine Stack (BPC-157 + TB-500) — research enrichment.
 *
 * Honest coverage note: this is the same underlying pairing as the
 * BPC-157 + TB-500 blend already enriched in batch 1
 * (bpc-157-tb-500.mjs), sold/marketed under a different, pop-culture
 * nickname. No published study of the combination itself was
 * identified — same finding as bpc-157-tb-500.mjs. This file reuses
 * (via global source deduplication) the same underlying sources rather
 * than re-researching an identical pairing from scratch.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'wolverine-stack',
  sources: [
    {
      key: 'pmid-21030672-wolverine',
      sourceType: 'pubmed_article',
      title: 'The promoting effect of pentadecapeptide BPC 157 on tendon healing involves tendon outgrowth, cell survival, and cell migration.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/21030672/',
      identifiers: { pmid: '21030672' },
      study: {
        studyDesign: 'in_vitro_study',
        intervention: 'BPC-157',
        resultsSummary: 'See bpc-157.mjs for the fuller BPC-157 evidence base.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-10469335-wolverine',
      sourceType: 'pubmed_article',
      title: 'Thymosin beta4 accelerates wound healing.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/10469335/',
      identifiers: { pmid: '10469335' },
      study: {
        studyDesign: 'animal_study',
        intervention: 'Thymosin beta-4 (TB-500)',
        resultsSummary: 'See tb-500.mjs for the fuller thymosin beta-4/TB-500 evidence base.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'The Wolverine Stack is a marketing nickname for the same BPC-157 + TB-500 combination already reviewed as bpc-157-tb-500.mjs (batch 1) — the underlying compounds and the finding are identical: no published study of the combination itself was identified, only each peptide\'s separately-studied evidence (BPC-157: predominantly animal/in-vitro, with essentially no human efficacy data; TB-500/thymosin beta-4: animal wound-healing evidence).',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-21030672-wolverine', relationship: 'provides_context' },
        { sourceKey: 'pmid-10469335-wolverine', relationship: 'provides_context' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '724ac578-9775-4a3b-ac87-fb7d19870e91',
      legacyStatementExcerpt: 'The Wolverine Stack is the nickname commonly used for the research combination of BPC-157 and TB-500. Researchers study these compounds because they are believed to influence different biological processes',
      disposition: 'revised',
      rationale:
        'Correctly identifies this as a nickname for the BPC-157+TB-500 pairing (already reviewed as bpc-157-tb-500.mjs in batch 1). "Researchers study these compounds" is accurate for each individually, but no study of the actual combination was located — identical finding to the differently-branded blend page.',
      evidenceQuality: 'low',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-21030672-wolverine', relationship: 'directly_supports' },
        { sourceKey: 'pmid-10469335-wolverine', relationship: 'directly_supports' },
      ],
    },
    {
      legacyClaimId: 'a7e16b14-548b-4f9a-b0b9-0c2ed8c10f4c',
      legacyStatementExcerpt: 'Rather than targeting a single pathway, the combination is explored to better understand how multiple regenerative mechanisms may complement one another',
      disposition: 'unsupported',
      rationale: 'No source exploring "the combination" (as opposed to each compound independently) was located — same finding as bpc-157-tb-500.mjs.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '1a1c4cf0-7186-4105-a333-d2756ecee14c',
      legacyStatementExcerpt: 'Research is ongoing, and conclusions should be interpreted within the context of individual study design and the current scientific literature',
      disposition: 'supported',
      rationale: 'Generic, appropriately cautious statement.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: '6e5b7fd6-22ea-45e4-8d0a-eeeb5ae6760d',
      legacyStatementExcerpt: 'BPC-157 and TB-500 are frequently investigated together because they are associated with different aspects of tissue repair biology',
      disposition: 'unsupported',
      rationale: 'No source investigating them "together" was located — each has been studied independently. Same finding as bpc-157-tb-500.mjs.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '8d3394ff-b5c3-4fb3-a4c1-0ba210437b3a',
      legacyStatementExcerpt: 'Q: Why is it called the Wolverine Stack? A: The nickname comes from the fictional character Wolverine, known for rapid healing. It is simply a nickname used within the research community',
      disposition: 'supported',
      rationale: 'Accurate, non-scientific naming-convention fact — appropriately transparent that this is a colloquial nickname, not a scientific designation.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    policyReconciliation('7f0a1c5c-af3d-4290-8676-83f80a7f6db2', 'Q: Does Cloud Peptides recommend this stack? A: No.'),
    policyReconciliation('00255484-eaff-41f4-adbc-7642b418e372', 'Q: Does this article provide dosage information? A: No.'),
    policyReconciliation('4cf04cbc-e341-4f79-b6e9-a09b32cfe8f1', 'Q: Are these products intended for human consumption? A: No.'),
    policyReconciliation('733afb90-6fe9-42f1-bf93-13e9893c4d3c', 'The information on this page is provided for educational purposes only and summarizes published scientific literature.'),
    policyReconciliation('ba75be10-418b-40ef-9358-3b5080fff374', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage guidance.'),
    policyReconciliation('bd4f10f8-6cb4-40b8-aa7c-c06b5f1422fe', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
