/**
 * Oxytocin Acetate — research enrichment. Sources verified via the FDA
 * label and NCBI E-utilities.
 *
 * IMPORTANT distinction preserved: oxytocin is FDA-approved (as
 * Pitocin) ONLY for specific obstetric uses (labor induction/
 * augmentation, incomplete/inevitable abortion management, postpartum
 * hemorrhage control) — it is NOT approved for any behavioral,
 * psychiatric, or "bonding"/social-cognition use, and the largest
 * randomized trial of intranasal oxytocin for autism core social
 * symptoms found no significant benefit.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'oxytocin-acetate',
  sources: [
    {
      key: 'fda-pitocin-label',
      sourceType: 'fda_document',
      title: 'PITOCIN (oxytocin injection, USP) — approved labeling',
      url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2014/018261s031lbl.pdf',
      publisherOrAgency: 'U.S. Food and Drug Administration',
      publicationDate: '2014',
      identifiers: {},
    },
    {
      key: 'pmid-29955161',
      sourceType: 'pubmed_article',
      title: 'Effect of intranasal oxytocin on the core social symptoms of autism spectrum disorder: a randomized clinical trial.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/29955161/',
      publisherOrAgency: 'Molecular Psychiatry',
      publicationDate: '2020-08',
      identifiers: { pmid: '29955161', doi: '10.1038/s41380-018-0097-2' },
      study: {
        studyDesign: 'rct_human',
        population: 'Adults with autism spectrum disorder',
        intervention: 'Intranasal oxytocin',
        comparator: 'Placebo',
        route: 'Intranasal',
        primaryOutcomes: 'Core social symptoms of autism spectrum disorder',
        resultsSummary: 'Continuous intranasal oxytocin treatment at the doses/duration studied could NOT be recommended for treating core social symptoms in adults with autism — a null result for the primary target, though some signal was suggested for repetitive behavior specifically.',
        limitations: 'Single trial; other trials in this space show similarly inconsistent results across populations (children vs adults) and dosing.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'regulatory',
      statement:
        'Oxytocin is FDA-approved (brand name Pitocin, and generics) ONLY for specific obstetric indications: induction/augmentation of labor, management of incomplete or inevitable abortion, and control of postpartum hemorrhage. The FDA label itself states available data are inadequate to evaluate benefit versus risk for elective labor induction. Oxytocin — whether injected or intranasal — is NOT FDA-approved for any behavioral, psychiatric, "bonding," or social-cognition use.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-pitocin-label', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'summary',
      statement:
        'Despite extensive research and popular framing as a "bonding hormone," a randomized controlled trial of intranasal oxytocin in adults with autism spectrum disorder — the largest and most rigorous test of its behavioral/social-cognition potential identified in this review — found it could NOT be recommended for treating core social symptoms at the dose and duration studied. This null result for a headline behavioral-use case is represented directly, not omitted.',
      evidenceQuality: 'moderate',
      qualityRationale: 'Randomized, controlled, peer-reviewed human trial with a clear negative primary result for the specific outcome tested.',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'pmid-29955161', relationship: 'contradicts' }],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      formulation: 'Oxytocin injection, USP (Pitocin and generics)',
      indication: 'Induction/augmentation of labor; management of incomplete or inevitable abortion; control of postpartum hemorrhage',
      regulatoryStatus: 'approved',
      sourceKey: 'fda-pitocin-label',
      notes: 'Approved for these specific obstetric indications only. Intranasal oxytocin (as used in behavioral/social-cognition research) is a different formulation with NO FDA approval for any indication.',
    },
  ],
  legacyReconciliations: [
    {
      legacyClaimId: '30d14da7-5d3b-4c38-9f89-d335fed5732f',
      legacyStatementExcerpt: 'Oxytocin Acetate is a synthetic form of oxytocin, a naturally occurring peptide hormone studied for its role in neuroendocrine signaling and hormone regulation',
      disposition: 'revised',
      rationale:
        'Accurate biochemically, but frames oxytocin purely as a "studied" research subject — it is in fact an FDA-approved drug for specific obstetric uses (a significant regulatory fact, added above), while its much more heavily marketed behavioral/"bonding" uses have NO approval and a real negative pivotal trial result (also added above). Both facts were missing from the legacy framing.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-pitocin-label', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '79e6e9f7-01c8-4c76-9950-d71a2dac4688',
      legacyStatementExcerpt: 'Laboratory studies investigate oxytocin receptor activation, endocrine communication, and neurobiological pathways associated with behavioral and reproductive physiology',
      disposition: 'revised',
      rationale: 'Accurate that this research exists, but omits that the flagship behavioral-application trial identified in this review (autism core symptoms) produced a null result — "investigate" alone risks implying an open or promising question rather than an area with a real negative finding.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'pmid-29955161', relationship: 'contradicts' }],
    },
    {
      legacyClaimId: 'ed059be5-32a0-4e56-a314-6e1219af1db7',
      legacyStatementExcerpt: 'Researchers investigate Oxytocin Acetate for its interaction with oxytocin receptors, which participate in endocrine signaling',
      disposition: 'supported',
      rationale: 'Accurate mechanistic description.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-pitocin-label', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '32c052cb-821b-4a39-88a1-6acb67b4efa8',
      legacyStatementExcerpt: 'Q: What is Oxytocin Acetate researched for? A: Research commonly focuses on neuroendocrine signaling, hormone regulation, reproductive biology, stress-response pathways, and social behavior models',
      disposition: 'revised',
      rationale: 'Reproductive biology and hormone regulation are directly confirmed (and FDA-approved for specific obstetric uses). "Social behavior models" specifically has a real negative pivotal trial result that should not be omitted when this research area is mentioned.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'conflicting',
      sources: [
        { sourceKey: 'fda-pitocin-label', relationship: 'directly_supports' },
        { sourceKey: 'pmid-29955161', relationship: 'contradicts' },
      ],
    },
    {
      legacyClaimId: 'b1f8d648-7dec-41ee-acf3-e5fc0b3391b9',
      legacyStatementExcerpt: 'Q: Is Oxytocin Acetate a peptide hormone? A: Yes. Oxytocin is a naturally occurring peptide hormone',
      disposition: 'supported',
      rationale: 'Accurate.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    policyReconciliation('4e318b9c-b444-4fa6-aa7f-914891f7c177', 'Q: Does Cloud Peptides provide dosage information? A: No.'),
    policyReconciliation('078d7a02-18b8-47f2-b6b2-99bd867558de', 'This page summarizes publicly available scientific literature for educational purposes only.'),
    policyReconciliation('26279a4b-054e-4083-8387-73f817ef64d7', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    {
      legacyClaimId: '111c43d6-842a-42e7-b7c1-93c2805d8e3f',
      legacyStatementExcerpt: 'All products are intended strictly for laboratory research purposes only and are not for human consumption',
      disposition: 'contradicted',
      rationale: 'Same pattern as Botulinum Toxin, HCG, and Melanotan I: oxytocin (as Pitocin) is FDA-approved and administered to humans clinically, for its approved obstetric indications. Flagged for editorial attention.',
      evidenceQuality: 'high',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'fda-pitocin-label', relationship: 'contradicts' }],
    },
  ],
};
