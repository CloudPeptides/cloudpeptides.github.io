/**
 * Melanotan I (Afamelanotide) — research enrichment. Source verified via
 * FDA record.
 *
 * IMPORTANT finding: Melanotan I is the research name for afamelanotide,
 * which the FDA approved (as Scenesse, October 2019) for increasing
 * pain-free light exposure in adults with erythropoietic protoporphyria
 * (EPP) — a genuine approved drug, not merely a research compound. There
 * is NO FDA-approved cosmetic tanning indication for this or any
 * melanotan compound.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'melanotan-i',
  sources: [
    {
      key: 'fda-scenesse-approval',
      sourceType: 'fda_document',
      title: 'FDA Approves SCENESSE (afamelanotide) Implant for Erythropoietic Protoporphyria',
      url: 'https://www.accessdata.fda.gov/drugsatfda_docs/nda/2019/210797Orig1s000MultidisciplineR.pdf',
      publisherOrAgency: 'U.S. Food and Drug Administration',
      publicationDate: '2019-10-08',
      identifiers: {},
    },
  ],
  claims: [
    {
      contentSection: 'regulatory',
      statement:
        "Melanotan I is the research name for afamelanotide, an alpha-MSH analog selective for the melanocortin-1 receptor (MC1R). The FDA approved afamelanotide (brand name Scenesse, manufactured by Clinuvel Pharmaceuticals under NDA 210797, a 16 mg subcutaneous bioresorbable implant) on 2019-10-08 to increase pain-free light exposure in adults with a history of phototoxic reactions from erythropoietic protoporphyria (EPP) — a genuine approved drug, previously also approved by the EMA (2014). There is NO FDA-approved cosmetic tanning indication for afamelanotide or any melanotan compound. This approval applies specifically to the Scenesse implant product manufactured by Clinuvel — it does not extend to compounded, research-grade, differently formulated (e.g. injectable rather than implant), or independently sold melanotan/afamelanotide products, which remain unapproved regardless of the parent molecule's regulatory history.",
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-scenesse-approval', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      formulation:
        'Afamelanotide (Scenesse), manufactured by Clinuvel Pharmaceuticals — 16 mg subcutaneous bioresorbable implant',
      indication:
        'Increase pain-free light exposure in adults with a history of phototoxic reactions from erythropoietic protoporphyria (EPP)',
      regulatoryStatus: 'approved',
      effectiveDate: '2019-10-08',
      sourceKey: 'fda-scenesse-approval',
      notes:
        "Approved under NDA 210797, manufacturer Clinuvel Pharmaceuticals, specifically for EPP phototoxicity prevention, administered by a trained clinician. NOT approved for cosmetic tanning — that use, if pursued via unregulated products, is off-label/unapproved regardless of this approval. Regulatory-identity note: this approval covers the specific Scenesse implant product only — its manufacturer, bioresorbable-implant formulation, and approved labeling. It does not extend to compounded, injectable, research-grade, or independently sold melanotan-I/afamelanotide preparations, which remain unapproved regardless of Scenesse's own approval.",
    },
  ],
  legacyReconciliations: [
    {
      legacyClaimId: 'd1d7f538-3195-4ae7-9904-507df83c0a47',
      legacyStatementExcerpt:
        'Melanotan I, also known as Afamelanotide, is a synthetic analog of alpha-melanocyte stimulating hormone (α-MSH)',
      disposition: 'revised',
      rationale:
        'Chemically and nomenclaturally accurate, but materially incomplete: this legacy page frames Melanotan I purely as a research subject, when in fact its FDA-approved form (Scenesse/afamelanotide) is a genuine approved drug for a specific rare-disease indication (EPP) — a significant regulatory fact added as a new claim/record above, matching the pattern found for Botulinum Toxin and HCG.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-scenesse-approval', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '62bfb6a3-4e77-48d0-86aa-59454a2c4b51',
      legacyStatementExcerpt:
        'Scientific literature explores its role in melanogenesis, UV-response pathways, and dermatologic research models',
      disposition: 'supported',
      rationale:
        "Accurate and consistent with the compound's actual approved indication (EPP photoprotection), which is precisely a UV-response/dermatologic application.",
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-scenesse-approval', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'dcd84b7f-52b1-4716-8f93-253dc9bf5494',
      legacyStatementExcerpt:
        'Melanotan I is primarily studied for activation of the melanocortin-1 receptor (MC1R)',
      disposition: 'supported',
      rationale: 'Directly confirmed mechanism.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-scenesse-approval', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '586b8ac6-2a40-461e-bf55-452da40a9d45',
      legacyStatementExcerpt:
        'Q: What is Melanotan I researched for? A: Research commonly focuses on pigmentation biology, melanocortin receptor signaling, UV-response pathways',
      disposition: 'revised',
      rationale:
        'Accurate as far as it goes, but omits that this is not solely "research" — it has a real FDA-approved therapeutic use.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-scenesse-approval', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '65b6b2e0-575b-4398-81ff-a879ebe57b56',
      legacyStatementExcerpt:
        'Q: Is Melanotan I the same as Melanotan II? A: No. Although both belong to the melanocortin peptide family, they are distinct compounds',
      disposition: 'supported',
      rationale:
        "Accurate and important — see melanotan-ii.mjs for that compound's very different (unapproved, safety-flagged) profile.",
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-scenesse-approval', relationship: 'provides_context' }],
    },
    policyReconciliation(
      '14496b1b-4490-4dba-9d2a-d8d21b01780b',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      '35c12db3-dbd3-4cd2-9b31-e2a040b0bad5',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      '690d2b83-c2da-4900-ad9d-03a52203d6cc',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    {
      legacyClaimId: '704ce644-b4ed-4d29-943b-bf326540eb68',
      legacyStatementExcerpt:
        'All products are intended strictly for laboratory research purposes only and are not for human consumption',
      disposition: 'supported',
      rationale:
        'CORRECTED on closeout review (2026-08-07): previously misclassified as "contradicted." Scenesse\'s FDA approval (Clinuvel Pharmaceuticals, NDA 210797, bioresorbable implant) applies to that specific product — not to every product containing the afamelanotide/melanotan-I molecule. This is especially clear here since the approved product is a specific implant formulation, while research-grade "Melanotan I" is typically sold as an injectable powder — a materially different, unapproved product. Reclassified from "contradicted" to "supported."',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-scenesse-approval', relationship: 'directly_supports' }],
    },
  ],
};
