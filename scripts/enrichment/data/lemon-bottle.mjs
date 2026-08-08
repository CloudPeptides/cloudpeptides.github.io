/**
 * Lemon Bottle — research enrichment.
 *
 * IMPORTANT finding: Lemon Bottle is NOT a peptide or a defined
 * research compound — it is a commercial cosmetic injectable ("fat-
 * dissolving"/lipolysis) product manufactured in Korea, whose disclosed
 * ingredients are bromelain, riboflavin (vitamin B2), and lecithin (not
 * the industry-standard deoxycholic acid used in FDA-approved
 * lipolysis products like Kybella). It was named in an FDA Warning
 * Letter (March 2025) as an unapproved new drug in U.S. interstate
 * commerce, and independent Swissmedic laboratory analysis found
 * multiple tested samples did NOT match their declared ingredients —
 * a real product-quality/counterfeiting concern distinct from ordinary
 * "insufficient evidence." This is flagged for expert/editorial review
 * given the regulatory and safety severity involved.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'lemon-bottle',
  sources: [
    {
      key: 'fda-lemon-bottle-warning',
      sourceType: 'regulatory_announcement',
      title: 'FDA warns against unapproved "fat-dissolving" spa treatments (including Lemon Bottle)',
      url: 'https://www.fda.gov/consumers/consumer-updates/fda-warns-against-unapproved-fat-dissolving-injections-spas-and-medspas',
      publisherOrAgency: 'U.S. Food and Drug Administration',
      publicationDate: '2025-03',
      identifiers: {},
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'Lemon Bottle is a commercial cosmetic injectable product manufactured in Korea, disclosed as containing bromelain, riboflavin (vitamin B2), and lecithin — it does NOT contain deoxycholic acid, the active ingredient in FDA-approved injectable lipolysis products (e.g. Kybella). No peer-reviewed clinical trial establishing its safety or efficacy was identified in this review. The FDA named Lemon Bottle in a March 2025 warning as an unapproved new drug in U.S. interstate commerce, and independent Swissmedic laboratory testing found that multiple tested product samples did NOT match their declared ingredient list — indicating a real risk of product falsification/inconsistency, not merely unproven efficacy.',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'fda-lemon-bottle-warning', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      indication: 'Not approved for any indication — marketed as a cosmetic/spa "fat-dissolving" injectable',
      regulatoryStatus: 'not_approved',
      statusChangeDate: '2025-03-01',
      sourceKey: 'fda-lemon-bottle-warning',
      notes:
        'FDA has warned consumers against unapproved "fat-dissolving" injections sold under names including Lemon Bottle, characterizing them as unapproved new drugs. Separately, independent laboratory testing (Swissmedic) found tested Lemon Bottle samples did not consistently match their declared ingredients — a product-integrity/counterfeiting concern layered on top of the lack of regulatory approval. This is a materially more serious regulatory finding than most other compounds in this database and warrants direct editorial/expert review before this page is published in any form.',
    },
  ],
  legacyReconciliations: [
    {
      legacyClaimId: '20ceee64-2dbd-4063-aaf3-8d7a32a4a3fc',
      legacyStatementExcerpt: 'Lemon Bottle is a proprietary research formulation composed of multiple ingredients. Published literature remains limited',
      disposition: 'revised',
      rationale:
        'Materially understates the actual situation: this is not merely a formulation with "limited" published literature — it is a commercial cosmetic product the FDA has explicitly named as an unapproved drug, with independent lab testing finding ingredient-label mismatches in tested samples. "Limited literature" framing risks normalizing what is actually a flagged regulatory/safety concern.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'fda-lemon-bottle-warning', relationship: 'contradicts' }],
    },
    {
      legacyClaimId: '0aff215f-e6b5-4856-ab3e-96dd96ae91c7',
      legacyStatementExcerpt: 'Research interest has primarily focused on adipose tissue biology, lipid metabolism, and body composition in experimental settings',
      disposition: 'unsupported',
      rationale: 'No peer-reviewed experimental research on this specific product was located during this review — the claim of a research focus is not substantiated by any source found.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '3749bed7-50b8-493c-bcac-5ef845118496',
      legacyStatementExcerpt: 'Because Lemon Bottle is a combination formulation, the exact contribution of each ingredient continues to be investigated',
      disposition: 'unsupported',
      rationale: 'No source investigating individual ingredient contributions for this specific product was located.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '766be2e6-b0e4-44ec-b0fb-5a6b893df1ff',
      legacyStatementExcerpt: 'Q: Is Lemon Bottle a peptide? A: No. It is a proprietary multi-ingredient research formulation rather than a single peptide',
      disposition: 'supported',
      rationale: 'Accurate that it is not a peptide; the disclosed ingredients (bromelain, riboflavin, lecithin) are consistent with this.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-lemon-bottle-warning', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: '084e61b0-81a8-4865-a585-9459e91311d3',
      legacyStatementExcerpt: 'Q: Is there extensive published research? A: The available literature is more limited than for many well-established metabolic research compounds',
      disposition: 'revised',
      rationale: 'Technically true but understates the severity — "more limited" implies a research gap, when the actual, more consequential finding is active FDA enforcement action and an independent lab finding of ingredient-label mismatches.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'fda-lemon-bottle-warning', relationship: 'contradicts' }],
    },
    policyReconciliation('fa47a5bf-2e3d-435d-8d6a-41073f269e26', 'Q: Does Cloud Peptides provide treatment or dosage guidance? A: No.'),
    policyReconciliation('c2806f33-7b62-4fa4-a38a-8ae216c24b2e', 'This page summarizes publicly available scientific literature for educational purposes only.'),
    policyReconciliation('03e1bd04-6c3c-4be4-94b3-53d36cd41087', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    policyReconciliation('941a88f6-e916-4c24-955f-29b60aadd359', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
