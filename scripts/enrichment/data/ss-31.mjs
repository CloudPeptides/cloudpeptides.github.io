/**
 * SS-31 (Elamipretide) — research enrichment. Sources verified via NCBI
 * E-utilities.
 *
 * IMPORTANT, recent finding: Elamipretide received FDA ACCELERATED
 * APPROVAL in September 2025 for Barth syndrome (improving muscle
 * strength in patients >=30 kg) — the first disease-specific treatment
 * approved for this rare genetic mitochondrial disorder. This is
 * current, significant, and represented directly.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'ss-31',
  sources: [
    {
      key: 'pmid-41335372',
      sourceType: 'pubmed_article',
      title: 'Elamipretide: First Approval.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/41335372/',
      publisherOrAgency: 'Drugs',
      publicationDate: '2026-03',
      identifiers: { pmid: '41335372', doi: '10.1007/s40265-025-02269-8' },
      study: {
        studyDesign: 'narrative_review',
        resultsSummary:
          "Reviews elamipretide's September 2025 FDA accelerated approval (as the first disease-specific treatment for Barth syndrome, a genetic mitochondrial cardiolipin-metabolism disorder), improving muscle strength in patients weighing >=30 kg.",
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        'SS-31 (elamipretide) is an aromatic cationic tetrapeptide that penetrates the mitochondrial membrane and associates with cardiolipin (a phospholipid of the inner mitochondrial membrane), proposed to improve mitochondrial membrane stability and normalize energy production.',
      evidenceQuality: 'moderate',
      qualityRationale:
        'Consistent, well-described mechanism across the reviewed regulatory/clinical literature; this specific mechanistic claim was not independently re-verified against a dedicated basic-science source in this review.',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-41335372', relationship: 'provides_context' }],
    },
    {
      contentSection: 'regulatory',
      statement:
        "Elamipretide (developed and manufactured by Stealth BioTherapeutics) received FDA accelerated approval in September 2025 for improving muscle strength in adult and pediatric patients (weighing >=30 kg) with Barth syndrome, a rare genetic disorder of mitochondrial cardiolipin metabolism — the first disease-specific treatment approved for Barth syndrome. This approval applies specifically to Stealth BioTherapeutics' approved elamipretide drug product — it does not extend to compounded, research-grade, differently formulated, or independently sold SS-31/elamipretide products, which remain unapproved regardless of the parent molecule's regulatory history.",
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-41335372', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      formulation: 'Elamipretide, subcutaneous, manufactured by Stealth BioTherapeutics',
      indication: 'Improving muscle strength in Barth syndrome patients weighing >=30 kg',
      regulatoryStatus: 'approved',
      effectiveDate: '2025-09-01',
      sourceKey: 'pmid-41335372',
      notes:
        "Accelerated approval — the first disease-specific treatment for Barth syndrome, developer/manufacturer Stealth BioTherapeutics. Accelerated approvals are typically contingent on confirmatory post-marketing trials. This is a very recent approval (within this review's knowledge window); the exact approval date and NDA/BLA number should be independently re-confirmed against the FDA's own record before being asserted with day-level precision in published content. Regulatory-identity note: this approval covers Stealth BioTherapeutics' specific elamipretide drug product only — its manufacturer, formulation, and approved Barth-syndrome labeling. It does not extend to compounded, research-grade, or independently sold SS-31/elamipretide preparations, which remain unapproved regardless of this approval.",
    },
  ],
  legacyReconciliations: [
    {
      legacyClaimId: 'd798a64f-fa68-473b-b064-46f51e8ae43e',
      legacyStatementExcerpt:
        'SS-31 is a mitochondria-targeted peptide studied for its relationship to mitochondrial membrane biology, oxidative stress, and cellular energy production',
      disposition: 'revised',
      rationale:
        'Accurate mechanistically, but materially incomplete: as of September 2025, elamipretide/SS-31 is an FDA-APPROVED drug for Barth syndrome — not merely a "studied" research compound. This is a highly significant, recent regulatory fact that should be surfaced prominently.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-41335372', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '2371b3c6-28b0-4985-ab0b-6a0775a4f881',
      legacyStatementExcerpt:
        'Researchers investigate SS-31 in laboratory models involving mitochondrial dysfunction, cardiometabolic biology, neurobiology, skeletal muscle physiology, and healthy aging',
      disposition: 'revised',
      rationale:
        'The Barth syndrome (skeletal muscle strength) indication is directly confirmed by the actual approval. Other listed research areas (cardiometabolic, neurobiology, healthy aging) were not independently re-verified as approved indications in this review — those remain research-stage uses distinct from the approved indication.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-41335372', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '25cbdf2e-8013-4f2c-aef6-571167d1a82b',
      legacyStatementExcerpt:
        'SS-31 is studied for its interaction with cardiolipin, a phospholipid found in the inner mitochondrial membrane',
      disposition: 'supported',
      rationale:
        "Directly confirmed mechanism, consistent with the approved indication's underlying disease mechanism (Barth syndrome is itself a cardiolipin-metabolism disorder).",
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-41335372', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '3e8303c1-0abe-4e30-8380-d941d76a8fac',
      legacyStatementExcerpt:
        'Q: What is SS-31 researched for? A: Research commonly focuses on mitochondrial function, oxidative stress, cardiolipin biology, cellular energy, and healthy aging models',
      disposition: 'revised',
      rationale:
        "Accurate as far as the research base goes, but again omits the September 2025 FDA approval — the single most important update to this compound's status.",
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-41335372', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '6cf4d392-3741-4408-b8f8-bf7a73eaff8d',
      legacyStatementExcerpt:
        'Q: Is SS-31 the same as Elamipretide? A: SS-31 is commonly discussed in the scientific literature under the name Elamipretide',
      disposition: 'supported',
      rationale:
        'Accurate and confirmed — elamipretide is the formal pharmaceutical name used in the approval.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-41335372', relationship: 'directly_supports' }],
    },
    policyReconciliation(
      '8598ad44-ed16-4755-80b0-d0cde7282203',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      '25e1da35-8abd-45ad-91aa-9dd0ada853a0',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      '2befd2cf-42fe-426d-a76e-7e0ab069e897',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    {
      legacyClaimId: 'fd4c5e8b-0955-4751-9c46-660d79ad373a',
      legacyStatementExcerpt:
        'All products are intended strictly for laboratory research purposes only and are not for human consumption',
      disposition: 'supported',
      rationale:
        'CORRECTED on closeout review (2026-08-07): previously misclassified as "contradicted." Stealth BioTherapeutics\' FDA approval applies to its specific elamipretide drug product for Barth syndrome — not to every SS-31-containing research product. An unapproved, research-grade SS-31 product is correctly labeled "not for human consumption" regardless of that approval. Reclassified from "contradicted" to "supported."',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-41335372', relationship: 'directly_supports' }],
    },
  ],
};
