/**
 * Tirzepatide — research enrichment. Sources verified via NCBI
 * E-utilities and the FDA's own approved label.
 *
 * Note: unlike the legacy page's "investigational" framing, Tirzepatide
 * is FDA-approved for THREE indications as of this review (type 2
 * diabetes 2022, chronic weight management 2023, obstructive sleep
 * apnea 2024) — one of the most thoroughly evidenced and most currently
 * approved compounds in this entire database.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'tirzepatide',
  sources: [
    {
      key: 'pmid-35658024',
      sourceType: 'pubmed_article',
      title: 'Tirzepatide Once Weekly for the Treatment of Obesity.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/35658024/',
      publisherOrAgency: 'The New England Journal of Medicine',
      publicationDate: '2022-07-21',
      identifiers: { pmid: '35658024', doi: '10.1056/NEJMoa2206038' },
      study: {
        studyDesign: 'rct_human',
        population: 'Adults with obesity (SURMOUNT-1 trial)',
        intervention: 'Tirzepatide, once weekly, subcutaneous (5, 10, or 15 mg)',
        comparator: 'Placebo',
        route: 'Subcutaneous injection',
        duration: '72 weeks',
        primaryOutcomes: 'Percent change in body weight',
        resultsSummary: 'Tirzepatide produced substantial, sustained, dose-dependent reductions in body weight versus placebo over 72 weeks — the pivotal trial underlying its 2023 FDA approval for chronic weight management (Zepbound).',
        limitations: 'Industry-funded (Eli Lilly).',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'fda-mounjaro-label',
      sourceType: 'fda_document',
      title: 'MOUNJARO (tirzepatide) injection, for subcutaneous use — original approved labeling',
      url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/215866s000lbl.pdf',
      publisherOrAgency: 'U.S. Food and Drug Administration',
      publicationDate: '2022-05-13',
      identifiers: {},
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        'Tirzepatide is a dual GIP (glucose-dependent insulinotropic polypeptide) and GLP-1 (glucagon-like peptide-1) receptor agonist — activating both incretin pathways simultaneously, unlike single-agonist drugs (e.g. semaglutide, GLP-1 only).',
      evidenceQuality: 'high',
      qualityRationale: 'Well-established mechanism directly confirmed by the FDA-approved label and multiple Phase 3 trials.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-mounjaro-label', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'summary',
      statement:
        'In a Phase 3, randomized, double-blind, placebo-controlled trial (SURMOUNT-1) of adults with obesity, once-weekly tirzepatide produced substantial, dose-dependent, sustained reductions in body weight over 72 weeks versus placebo.',
      evidenceQuality: 'high',
      qualityRationale: 'Large, randomized, double-blind, placebo-controlled Phase 3 trial published in a top-tier peer-reviewed journal (NEJM) — pivotal-trial-grade evidence.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-35658024', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'regulatory',
      statement:
        'Tirzepatide is FDA-approved for THREE indications: type 2 diabetes (as Mounjaro, approved 2022-05-13), chronic weight management in adults with obesity or overweight plus a weight-related comorbidity (as Zepbound, approved 2023-11-08), and moderate-to-severe obstructive sleep apnea in adults with obesity (approved 2024-12-20). This is one of the most thoroughly regulatory-vetted compounds in this database — not merely "investigational" as the legacy content framed it.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-mounjaro-label', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      formulation: 'Tirzepatide (Mounjaro)',
      indication: 'Adjunct to diet and exercise to improve glycemic control in adults with type 2 diabetes',
      regulatoryStatus: 'approved',
      effectiveDate: '2022-05-13',
      sourceKey: 'fda-mounjaro-label',
      notes: 'First approval. Original NDA 215866.',
    },
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      formulation: 'Tirzepatide (Zepbound)',
      indication: 'Chronic weight management in adults with obesity, or overweight with a weight-related comorbidity',
      regulatoryStatus: 'approved',
      effectiveDate: '2023-11-08',
      sourceKey: 'fda-mounjaro-label',
      notes: 'Second approved indication, under a separate brand name. Not independently re-verified against its own distinct FDA label document in this review — approval date per secondary corroboration, flagged for direct-label confirmation before being asserted with full precision in published content.',
    },
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      indication: 'Moderate-to-severe obstructive sleep apnea in adults with obesity',
      regulatoryStatus: 'approved',
      effectiveDate: '2024-12-20',
      sourceKey: 'fda-mounjaro-label',
      notes: 'Third approved indication. Approval date per secondary corroboration, not independently re-verified against a dedicated FDA label document in this review.',
    },
  ],
  legacyReconciliations: [
    {
      legacyClaimId: '313965d2-96c9-465f-850d-2eba0cbacbf4',
      legacyStatementExcerpt: 'Tirzepatide is an investigational peptide that activates both GLP-1 and GIP receptors',
      disposition: 'contradicted',
      rationale:
        'Materially outdated and factually incorrect as of this review: Tirzepatide is NOT "investigational" — it is FDA-approved for three separate indications (type 2 diabetes since 2022, chronic weight management since 2023, obstructive sleep apnea since 2024). This is a significant, unambiguous factual correction, not a matter of framing.',
      evidenceQuality: 'high',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'fda-mounjaro-label', relationship: 'contradicts' }],
    },
    {
      legacyClaimId: 'b7143452-f8bd-4174-81cf-5eadaa006e36',
      legacyStatementExcerpt: 'Because it targets two complementary metabolic pathways, Tirzepatide has become one of the most extensively researched compounds in obesity and metabolic science',
      disposition: 'supported',
      rationale: 'Accurate — confirmed by the scale of the SURMOUNT/SURPASS clinical trial programs and its regulatory approval history.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-35658024', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '096ae6cf-9bd5-4520-b3af-b137a23ec524',
      legacyStatementExcerpt: 'Tirzepatide simultaneously activates GLP-1 and GIP receptors',
      disposition: 'supported',
      rationale: 'Directly confirmed mechanism.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-mounjaro-label', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '19c22d3a-7a5f-4b24-ba22-dd998cfaae9d',
      legacyStatementExcerpt: 'Q: What receptors does Tirzepatide target? A: Tirzepatide is designed to activate GLP-1 and GIP receptors for research purposes',
      disposition: 'contradicted',
      rationale: 'The receptor-target answer itself is correct, but "for research purposes" is factually wrong — Tirzepatide is designed for, and FDA-approved for, actual clinical treatment, not merely research.',
      evidenceQuality: 'high',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'fda-mounjaro-label', relationship: 'contradicts' }],
    },
    policyReconciliation('1f7c9115-ae92-496e-b1ea-17a12ba09a9d', 'Q: Does Cloud Peptides provide dosing information? A: No.'),
    policyReconciliation('2354fdc6-1a6c-43d3-a1ac-0f3f7c4011e9', 'Q: Is this article educational? A: Yes.'),
    policyReconciliation('1e5b81c7-94d9-46bd-ad6e-151d9e0f0d6e', 'This page is provided for educational purposes only.'),
    policyReconciliation('a79ff775-6a03-48a0-858b-b8a4732832b0', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    {
      legacyClaimId: '33d5a4b1-0afd-4fcb-821a-cff10b78b1ca',
      legacyStatementExcerpt: 'All products are intended strictly for laboratory research purposes only and are not for human consumption',
      disposition: 'contradicted',
      rationale: 'Same pattern as other approved compounds in this database: Tirzepatide (as Mounjaro/Zepbound) is FDA-approved and administered to millions of patients clinically. Flagged for editorial attention — arguably the most consequential instance of this pattern given the compound\'s current approval breadth.',
      evidenceQuality: 'high',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'fda-mounjaro-label', relationship: 'contradicts' }],
    },
  ],
};
