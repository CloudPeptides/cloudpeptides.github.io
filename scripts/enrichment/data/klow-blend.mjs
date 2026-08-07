/**
 * KLOW Blend — research enrichment.
 *
 * Honest coverage note: the legacy page never names the actual
 * components — it only describes "a proprietary research blend." Cross-
 * checking multiple independent commercial vendor listings (used ONLY
 * to identify the product's stated composition, not as scientific
 * evidence) consistently identifies KLOW as GHK-Cu + BPC-157 + TB-500 +
 * KPV. No published study of this four-peptide combination itself was
 * identified. Each component has its own separately-verified evidence:
 * GHK-Cu (ghk-cu.mjs, pilot), BPC-157 (bpc-157.mjs, pilot), TB-500/
 * thymosin beta-4 (bpc-157-tb-500.mjs, batch 1), KPV (kpv.mjs, this
 * batch).
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'klow-blend',
  sources: [
    {
      key: 'pmid-18061177-klow',
      sourceType: 'pubmed_article',
      title: 'PepT1-mediated tripeptide KPV uptake reduces intestinal inflammation.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/18061177/',
      identifiers: { pmid: '18061177' },
      study: {
        studyDesign: 'animal_study',
        intervention: 'KPV (one of KLOW\'s four named components, per commercial vendor listings)',
        resultsSummary: 'See kpv.mjs for the fuller KPV evidence base.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'The legacy page does not name KLOW Blend\'s actual components. Cross-checking multiple independent commercial vendor listings (used only to identify stated composition, not as scientific evidence) consistently identifies it as GHK-Cu + BPC-157 + TB-500 + KPV. No published study of this specific four-peptide combination was identified during this review — each component has separately-verified evidence (documented in their own compound pages), but combining them has not itself been studied for safety or efficacy.',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-18061177-klow', relationship: 'provides_context' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '73838226-ecdd-4d24-97d0-3899ca240045',
      legacyStatementExcerpt: 'KLOW Blend is a proprietary research blend designed to combine multiple pathways of scientific interest into a single formulation',
      disposition: 'revised',
      rationale:
        'Accurate that it is a multi-compound blend, but the legacy page does not disclose WHICH compounds — a material omission for a page claiming to summarize "scientific literature." This review identified the likely composition (GHK-Cu, BPC-157, TB-500, KPV) via commercial vendor cross-referencing (not scientific literature) and flags that no study of the actual combination exists.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-18061177-klow', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: 'c5d1f80d-144d-4493-b69e-7326e75f3f6e',
      legacyStatementExcerpt: 'Because formulations may vary, research findings should always be interpreted within the context of the specific blend being studied',
      disposition: 'supported',
      rationale: 'Appropriately cautious, and directly relevant given this review found no study of "the specific blend" at all.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    policyReconciliation('ae07420a-7fa4-43d9-9f3a-2a5095959570', 'This page summarizes publicly available scientific literature for educational purposes only.'),
    policyReconciliation('b66e3a5a-e330-4ae4-a47d-9a3c403dde19', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    policyReconciliation('7de2fe05-a19f-4f5f-bd38-3588efe82074', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
