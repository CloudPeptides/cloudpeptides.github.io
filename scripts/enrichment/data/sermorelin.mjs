/**
 * Sermorelin — research enrichment. Source verified via the FDA's own
 * Federal Register notice and NDA history.
 *
 * Notable regulatory history: Sermorelin (as Geref) WAS FDA-approved
 * (NDA 20-443, 1997, for idiopathic growth hormone deficiency in
 * children, and NDA 19-863, 1990, for diagnostic GH-secretion testing).
 * Its manufacturer voluntarily discontinued production in 2008 for
 * commercial reasons (recombinant hGH displaced it in the market), and
 * the FDA formally withdrew the NDA in 2009 — but a 2013 Federal
 * Register notice explicitly confirmed the withdrawal was NOT for
 * safety or effectiveness reasons. This is a genuinely distinct
 * regulatory category ('withdrawn', not 'not_approved') from most
 * other compounds in this database, and is represented precisely.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'sermorelin',
  sources: [
    {
      key: 'fedreg-geref-2013',
      sourceType: 'regulatory_announcement',
      title:
        'Determination That GEREF (Sermorelin Acetate) Injection... Were Not Withdrawn From Sale for Reasons of Safety or Effectiveness',
      url: 'https://www.federalregister.gov/documents/2013/03/04/2013-04827/determination-that-geref-sermorelin-acetate-injection-05-milligrams-basevial-and-10-milligrams',
      publisherOrAgency: 'U.S. Food and Drug Administration (Federal Register)',
      publicationDate: '2013-03-04',
      identifiers: {},
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        'Sermorelin is a synthetic analog of the first 29 amino acids of growth hormone-releasing hormone (GHRH), sufficient to fully activate the GHRH receptor and stimulate physiologic (pulsatile) growth hormone release.',
      evidenceQuality: 'not_assessed',
      qualityRationale:
        'Established, uncontested pharmacology, confirmed by its historical FDA approval and labeling for this exact mechanism/use.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fedreg-geref-2013', relationship: 'provides_context' }],
    },
    {
      contentSection: 'regulatory',
      statement:
        'Sermorelin (brand name Geref) WAS FDA-approved: first under NDA 19-863 (December 1990, for diagnostic evaluation of pituitary growth-hormone secretion) and later under NDA 20-443 (September 1997, for treatment of idiopathic growth hormone deficiency in children). Its sole manufacturer voluntarily discontinued production in 2008 for commercial reasons (recombinant human growth hormone had displaced it in the pediatric GHD market), and the FDA formally withdrew NDA approval in 2009 — but a 2013 Federal Register notice explicitly confirmed this withdrawal was NOT for reasons of safety or effectiveness. Sermorelin is now available only via compounding pharmacies, not as an FDA-approved product.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fedreg-geref-2013', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      formulation: 'Sermorelin acetate injection (Geref)',
      indication:
        'Idiopathic growth hormone deficiency in children (treatment, NDA 20-443); diagnostic evaluation of pituitary GH secretion (NDA 19-863)',
      regulatoryStatus: 'withdrawn',
      statusChangeDate: '2009-06-01',
      sourceKey: 'fedreg-geref-2013',
      notes:
        "Originally FDA-approved (1990 and 1997). Withdrawn from the market in 2008-2009 for commercial reasons (manufacturer ceased production as recombinant hGH became dominant), NOT for safety or effectiveness — explicitly confirmed by FDA's own 2013 Federal Register notice. Distinct from a compound that failed a trial or was never approved. Sermorelin today is available only through compounding pharmacies, not as an FDA-approved branded product, and is not a controlled substance.",
    },
  ],
  legacyReconciliations: [
    {
      legacyClaimId: 'fa6ac527-a07c-4c7a-b482-3b6868152c16',
      legacyStatementExcerpt:
        'Sermorelin is a synthetic analog of growth hormone-releasing hormone (GHRH)',
      disposition: 'revised',
      rationale:
        'Chemically accurate, but the pure-"research" framing omits a significant and unusual regulatory fact: Sermorelin WAS FDA-approved for years (Geref, 1990/1997) and was withdrawn in 2009 for commercial, not safety, reasons. This is a materially different situation from compounds that were never approved, and is added as a new regulatory claim/record above.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fedreg-geref-2013', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'b3c63175-6a1a-4842-9e57-b2b45c789b34',
      legacyStatementExcerpt:
        'Published research explores its role in endocrine physiology, IGF-1 biology, body composition, recovery, and healthy aging',
      disposition: 'revised',
      rationale:
        'Endocrine physiology/GH-IGF-1 biology is directly confirmed by its historical approved use (pediatric GHD diagnosis/treatment). "Body composition, recovery, and healthy aging" specifically were not verified as approved indications or as directly-studied outcomes in the source identified in this review.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'fedreg-geref-2013', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: 'e346f3fa-4a81-434d-a48d-7fcb4c92615e',
      legacyStatementExcerpt:
        'Sermorelin activates GHRH receptors within the pituitary gland, promoting physiologic growth hormone release',
      disposition: 'supported',
      rationale:
        'Confirmed mechanism, consistent with its historical approved use for exactly this purpose.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fedreg-geref-2013', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: '1433ec16-dc5f-4efa-9d94-1309c6a90657',
      legacyStatementExcerpt:
        "Q: Is Sermorelin growth hormone? A: No. Sermorelin is a GHRH analog researched for stimulating the body's own growth hormone release",
      disposition: 'supported',
      rationale: 'Accurate and confirmed.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fedreg-geref-2013', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: '70d25513-e74a-4b74-abd8-ead5c0a7dfa8',
      legacyStatementExcerpt:
        'Q: What is its primary research target? A: Its primary research target is the growth hormone-releasing hormone receptor (GHRH receptor)',
      disposition: 'supported',
      rationale: 'Confirmed.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fedreg-geref-2013', relationship: 'provides_context' }],
    },
    policyReconciliation(
      'c772ea59-0b85-4801-99b4-5ae8089fefeb',
      'Q: Does this page include dosage information? A: No.',
    ),
    policyReconciliation(
      'fb538f65-ef83-4a39-bb65-7db259dd1911',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      '79bf0e05-5684-42f4-8423-3392e0f516d8',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    {
      legacyClaimId: '07307ae5-aba5-446f-b66a-4412ba97a50f',
      legacyStatementExcerpt:
        'All products are intended strictly for laboratory research purposes only and are not for human consumption',
      disposition: 'revised',
      rationale:
        'Unlike Botulinum Toxin/HCG/PT-141 (currently approved and administered to humans), Sermorelin is NOT currently an FDA-approved product — this disclaimer is technically accurate as applied to what Cloud Peptides sells today, though the compound itself has a real history of FDA-approved human medical use (1990-2009). Marked "revised" (not "contradicted") to reflect this nuance rather than the flatter contradiction found for currently-approved compounds.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'fedreg-geref-2013', relationship: 'provides_context' }],
    },
  ],
};
