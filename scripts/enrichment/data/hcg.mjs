/**
 * Human Chorionic Gonadotropin (HCG) — research enrichment. Source
 * verified via the FDA's own approved label document.
 *
 * Note: like Botulinum Toxin, HCG is an FDA-APPROVED drug (multiple
 * brands, decades of approval), not merely a research subject. This is
 * documented explicitly.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'hcg',
  sources: [
    {
      key: 'fda-novarel-label',
      sourceType: 'fda_document',
      title: 'NOVAREL (Chorionic Gonadotropin for Injection, USP) — approved labeling',
      url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2011/017016s156lbl.pdf',
      publisherOrAgency: 'U.S. Food and Drug Administration',
      publicationDate: '2011',
      identifiers: {},
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        'Human chorionic gonadotropin (hCG) binds and activates luteinizing hormone (LH) receptors — its action is virtually identical to pituitary LH, with a small degree of FSH activity — initiating steroidogenesis and reproductive endocrine signaling.',
      evidenceQuality: 'high',
      qualityRationale: 'Well-established mechanism documented directly in the FDA-approved product label.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-novarel-label', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'regulatory',
      statement:
        'HCG (e.g. Novarel, and other brands) is FDA-approved for multiple indications, including: induction of ovulation/pregnancy in anovulatory, infertile women following appropriate follicular development with gonadotropins; selected cases of hypogonadotropic hypogonadism in males; and prepubertal cryptorchidism not due to anatomical obstruction.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-novarel-label', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      formulation: 'Chorionic Gonadotropin for Injection, USP (e.g. Novarel and other brands)',
      indication: 'Induction of ovulation and pregnancy in select infertile women; selected male hypogonadotropic hypogonadism; prepubertal cryptorchidism not due to anatomical obstruction',
      regulatoryStatus: 'approved',
      sourceKey: 'fda-novarel-label',
      notes: 'This record covers the Novarel brand/NDA specifically, verified via its FDA label. Other hCG brands (e.g. Pregnyl) hold separate approvals not independently re-verified in this review.',
    },
  ],
  legacyReconciliations: [
    {
      legacyClaimId: 'fda3dd2d-1d7c-4536-b35a-97607dea2673',
      legacyStatementExcerpt: 'Human Chorionic Gonadotropin (HCG) is a naturally occurring glycoprotein hormone widely investigated in reproductive endocrinology and hormone signaling research',
      disposition: 'revised',
      rationale:
        'Accurate as a description of the underlying biology, but materially incomplete in the same way as the Botulinum Toxin legacy page: HCG is not merely a "research" subject — it is an FDA-approved prescription drug with decades of approved indications. The pure-research framing undersells its actual regulatory status, added as a new regulatory claim below.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-novarel-label', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'd765eb43-a8d4-43b1-86bd-f1fd2dbd22dd',
      legacyStatementExcerpt: 'Scientific literature explores HCG in experimental models involving reproductive biology, endocrine regulation, fertility research',
      disposition: 'supported',
      rationale: 'Accurate, consistent with verified sources — though again, "experimental models" undersells its status as an approved therapeutic (addressed above).',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-novarel-label', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '893b8b85-6cd4-46d9-9b7d-23c8fdacb3a6',
      legacyStatementExcerpt: 'Researchers investigate HCG for its ability to bind and activate luteinizing hormone receptors',
      disposition: 'supported',
      rationale: 'Directly confirmed by the FDA label\'s own mechanism-of-action description.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-novarel-label', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '07be7924-17a3-4080-9632-4c3add5ecc73',
      legacyStatementExcerpt: 'Q: What is HCG researched for? A: Research commonly focuses on reproductive endocrinology, hormone signaling, fertility biology',
      disposition: 'supported',
      rationale: 'Accurate, though see the regulatory-status note above.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-novarel-label', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '1336761c-bfb4-4c25-9379-831c15484177',
      legacyStatementExcerpt: 'Q: Is HCG a peptide? A: HCG is a glycoprotein hormone rather than a simple peptide',
      disposition: 'supported',
      rationale: 'Chemically accurate — hCG is a much larger glycoprotein hormone (heterodimer of alpha/beta subunits), not a short peptide.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    policyReconciliation('b46ab43d-31e4-4fd1-9b9a-b1ca5d57e267', 'Q: Does Cloud Peptides provide dosage information? A: No.'),
    policyReconciliation('33a2bdd1-f0d7-43ff-b4a4-3ad24e9d8435', 'This page summarizes publicly available scientific literature for educational purposes only.'),
    policyReconciliation('d21b75ba-1700-4ae9-915a-bf3d00d480f2', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    {
      legacyClaimId: 'ae14a31a-d5b2-41d6-b82c-42b85496b7a4',
      legacyStatementExcerpt: 'All products are intended strictly for laboratory research purposes only and are not for human consumption',
      disposition: 'contradicted',
      rationale:
        'Same finding as Botulinum Toxin (batch 1): this boilerplate disclaimer is factually at odds with reality for HCG, an FDA-approved prescription drug administered to humans for decades. Flagged for editorial attention rather than silently reused.',
      evidenceQuality: 'high',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'fda-novarel-label', relationship: 'contradicts' }],
    },
  ],
};
