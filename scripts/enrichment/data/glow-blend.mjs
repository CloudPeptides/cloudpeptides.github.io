/**
 * Glow Blend (GHK-Cu + TB-500) — research enrichment.
 *
 * Honest coverage note: no published study of GHK-Cu co-administered
 * with TB-500/thymosin beta-4 (the combination itself) was identified.
 * Each component's own evidence is documented separately: GHK-Cu in
 * ghk-cu.mjs (pilot); thymosin beta-4/TB-500 basics in
 * bpc-157-tb-500.mjs (batch 1). Only enough of each is referenced here
 * to support this stack's reconciliation.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'glow-blend',
  sources: [
    {
      key: 'pmid-11045606-glow',
      sourceType: 'pubmed_article',
      title: 'The tripeptide-copper complex glycyl-L-histidyl-L-lysine-Cu2+ stimulates matrix metalloproteinase-2 expression by fibroblast cultures.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/11045606/',
      identifiers: { pmid: '11045606' },
      study: {
        studyDesign: 'in_vitro_study',
        intervention: 'GHK-Cu applied to fibroblast cultures',
        resultsSummary: 'See ghk-cu.mjs for the fuller GHK-Cu evidence base (fibroblast/collagen/MMP effects).',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-10469335-glow',
      sourceType: 'pubmed_article',
      title: 'Thymosin beta4 accelerates wound healing.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/10469335/',
      identifiers: { pmid: '10469335' },
      study: {
        studyDesign: 'animal_study',
        population: 'Rat, full-thickness skin wound model',
        intervention: 'Thymosin beta-4 (the active peptide TB-500 is derived from/marketed as)',
        resultsSummary: 'See bpc-157-tb-500.mjs for the fuller thymosin beta-4/TB-500 evidence base (wound reepithelialization, collagen, angiogenesis).',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'No published study of GHK-Cu co-administered with TB-500/thymosin beta-4 (the "Glow Blend" combination itself) was identified during this review. Each peptide has its own separately-verified evidence: GHK-Cu\'s fibroblast/collagen/MMP-2 effects (in-vitro/animal) and thymosin beta-4\'s wound-healing/angiogenesis effects (animal) — but no source evaluates them combined, and the claimed "connective tissue biology" and "skin-related research" synergy from combining copper-peptide signaling with actin-related cellular movement is not itself evidence-based.',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-11045606-glow', relationship: 'provides_context' },
        { sourceKey: 'pmid-10469335-glow', relationship: 'provides_context' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '80476cdb-52f1-40ea-9668-4f3c296035a6',
      legacyStatementExcerpt: 'Glow Blend combines GHK-Cu and TB-500, two compounds frequently discussed in research settings involving tissue remodeling, collagen biology',
      disposition: 'revised',
      rationale: 'Each compound individually has real literature in these areas (confirmed separately). The claim that they are "frequently discussed" together in research settings is not itself evidence the combination has been studied — no combination study was located.',
      evidenceQuality: 'low',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-11045606-glow', relationship: 'provides_context' },
        { sourceKey: 'pmid-10469335-glow', relationship: 'provides_context' },
      ],
    },
    {
      legacyClaimId: 'fd2cdc29-cb2d-41cc-a624-a07dbac666d9',
      legacyStatementExcerpt: 'Researchers study this combination to better understand how copper peptide signaling and actin-related cellular movement may contribute to connective tissue biology',
      disposition: 'unsupported',
      rationale: 'No study of the combination\'s interaction was located — each mechanism (copper-peptide signaling; actin-related cellular movement) has been studied only for its respective individual compound.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '57c0c6ad-104c-4569-89df-5deadd1f0f6c',
      legacyStatementExcerpt: 'Q: Why are GHK-Cu and TB-500 researched together? A: Researchers investigate this pairing because the compounds are associated with different but complementary areas',
      disposition: 'revised',
      rationale: 'A plausible product-design rationale, not evidence the pairing itself has been researched together.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '5469c8cd-23f2-40c2-9723-72b1c5bd191f',
      legacyStatementExcerpt: 'Q: Is Glow Blend the same as GHK-Cu alone? A: No. Glow Blend refers to a combination product',
      disposition: 'supported',
      rationale: 'Accurate factual/product-composition statement.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    policyReconciliation('40d0bfc6-c07a-4510-9e0c-de512d5eeebd', 'Q: Does Cloud Peptides provide dosage information? A: No.'),
    policyReconciliation('731e4e33-4525-4586-a2b1-08eec68fd267', 'This page summarizes publicly available scientific literature for educational purposes only.'),
    policyReconciliation('4f0b5bf7-8b78-41dd-93c2-0a101644f3c8', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    policyReconciliation('73541c50-4343-48a7-9cce-46204c27895a', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
