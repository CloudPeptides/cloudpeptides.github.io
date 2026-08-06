/**
 * Retatrutide — research enrichment pilot data. Sources verified via
 * NCBI E-utilities; FDA regulatory facts cross-corroborated across
 * multiple independent FDA warning-letter page listings (the FDA site
 * itself repeatedly returned HTTP errors to direct fetching in this
 * pilot — noted honestly below and in the pilot report rather than
 * silently treated as fully verified).
 *
 * Honest coverage note: retatrutide has NOT been approved by the FDA
 * for any indication as of this review — it remains investigational,
 * in Phase 3 development, while compounded/unapproved versions are
 * being sold directly to consumers and are the subject of active FDA
 * enforcement action. This is represented as-is.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
export default {
  slug: 'retatrutide',
  sources: [
    {
      key: 'pmid-37366315',
      sourceType: 'pubmed_article',
      title: 'Triple-Hormone-Receptor Agonist Retatrutide for Obesity — A Phase 2 Trial.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/37366315/',
      publisherOrAgency: 'New England Journal of Medicine',
      publicationDate: '2023-08-10',
      identifiers: { pmid: '37366315', doi: '10.1056/NEJMoa2301972' },
      study: {
        studyDesign: 'rct_human',
        population: 'Adults with BMI >=30, or BMI 27-30 with a weight-related condition',
        intervention: 'Retatrutide (LY3437943) once weekly, subcutaneous, doses of 1/4/8/12 mg',
        comparator: 'Placebo',
        route: 'Subcutaneous injection',
        duration: '48 weeks',
        primaryOutcomes: 'Percent change in body weight at 24 weeks; safety through 48 weeks',
        resultsSummary:
          'At 48 weeks, >=15% weight loss occurred in 60% (4 mg), 75% (8 mg), and 83% (12 mg) of retatrutide-treated participants, versus 2% with placebo — a dose-dependent effect substantially larger than reported for single/dual-agonist GLP-1 drugs in comparable trial populations.',
        limitations: 'Phase 2 (not yet Phase 3-confirmed at time of publication); industry-funded (Eli Lilly).',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-37385280',
      sourceType: 'pubmed_article',
      title: 'Retatrutide, a GIP, GLP-1 and glucagon receptor agonist, for people with type 2 diabetes: a randomised, double-blind, placebo and active-controlled, parallel-group, phase 2 trial conducted in the USA.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/37385280/',
      publisherOrAgency: 'The Lancet',
      publicationDate: '2023-08-12',
      identifiers: { pmid: '37385280', doi: '10.1016/S0140-6736(23)01053-X' },
      study: {
        studyDesign: 'rct_human',
        population: 'Adults with type 2 diabetes, USA',
        intervention: 'Retatrutide, once weekly, subcutaneous, multiple doses',
        comparator: 'Placebo and active comparator (dulaglutide)',
        route: 'Subcutaneous injection',
        resultsSummary: 'Retatrutide improved glycemic control and produced weight loss in adults with type 2 diabetes across the doses tested.',
        limitations: 'Phase 2; industry-funded (Eli Lilly).',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'fda-glp1-solution-warning-2025',
      sourceType: 'fda_document',
      title: 'GLP-1 Solution — Warning Letter 715883',
      url: 'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/glp-1-solution-715883-09092025',
      publisherOrAgency: 'U.S. Food and Drug Administration',
      publicationDate: '2025-09-09',
      identifiers: {},
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'In a Phase 2 randomized, placebo-controlled trial in adults with obesity/overweight, once-weekly retatrutide produced dose-dependent weight loss substantially larger than placebo, with >=15% weight loss achieved by 60-83% of participants across the 4/8/12 mg doses at 48 weeks, versus 2% on placebo.',
      evidenceQuality: 'moderate',
      qualityRationale: 'Randomized, double-blind, placebo-controlled Phase 2 trial in a top-tier journal — strong signal, but Phase 2 scale/duration, not yet Phase 3-confirmed at time of this review.',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-37366315', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'summary',
      statement:
        'In adults with type 2 diabetes, retatrutide improved glycemic control and produced weight loss versus placebo and an active GLP-1 comparator (dulaglutide) in a Phase 2 trial.',
      evidenceQuality: 'moderate',
      qualityRationale: 'Randomized, double-blind, placebo- and active-controlled Phase 2 trial.',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-37385280', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'regulatory',
      statement:
        'Retatrutide has not received FDA approval for any indication and remains investigational; the FDA has issued warning letters to companies selling compounded/unapproved retatrutide products directly to consumers, including some marketed as "for research purposes" despite being sold with human-use dosing instructions.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-glp1-solution-warning-2025', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      indication: 'Not approved for any indication — investigational',
      regulatoryStatus: 'not_approved',
      statusChangeDate: '2025-09-09',
      sourceKey: 'fda-glp1-solution-warning-2025',
      notes:
        'No FDA-approved retatrutide drug product exists as of this review; the compound remains in Phase 3 clinical development. The FDA has taken enforcement action (warning letters) against compounding pharmacies and online sellers distributing unapproved compounded retatrutide directly to consumers. This regulatory source (an individual warning letter, cross-corroborated against several similar concurrent FDA warning letters) could not be fully re-verified by direct page fetch during this review — its existence and metadata were confirmed via FDA site search results, not full page content extraction; flagged for follow-up verification before publication.',
    },
  ],
};
