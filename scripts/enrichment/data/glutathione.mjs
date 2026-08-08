/**
 * Glutathione — research enrichment. Sources verified via NCBI
 * E-utilities.
 *
 * Honest coverage note: glutathione's human trial literature is
 * genuinely large but CONFLICTING/mixed — oral supplementation trials
 * disagree on whether they measurably raise systemic glutathione or
 * change oxidative-stress biomarkers at all, while skin-lightening
 * trials show more consistent (though safety-limited, especially IV)
 * effects. This mixed picture is represented as such.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'glutathione',
  sources: [
    {
      key: 'pmid-21875351',
      sourceType: 'pubmed_article',
      title:
        'Effects of oral glutathione supplementation on systemic oxidative stress biomarkers in human volunteers.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/21875351/',
      publisherOrAgency: 'Journal of Alternative and Complementary Medicine',
      publicationDate: '2011-09',
      identifiers: { pmid: '21875351', doi: '10.1089/acm.2010.0716' },
      study: {
        studyDesign: 'rct_human',
        population: 'Healthy human volunteers',
        intervention: 'Oral glutathione supplementation',
        comparator: 'Placebo',
        route: 'Oral',
        resultsSummary:
          'No significant changes were observed in oxidative-stress biomarkers, including glutathione status itself, with oral supplementation.',
        limitations:
          'Negative/null result in healthy volunteers; does not rule out effects in a deficient or diseased population.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-20524875',
      sourceType: 'pubmed_article',
      title:
        'Glutathione as an oral whitening agent: a randomized, double-blind, placebo-controlled study.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/20524875/',
      publisherOrAgency: 'Journal of Dermatological Treatment',
      publicationDate: '2012-04',
      identifiers: { pmid: '20524875', doi: '10.3109/09546631003801619' },
      study: {
        studyDesign: 'rct_human',
        intervention: 'Oral glutathione',
        comparator: 'Placebo',
        route: 'Oral',
        resultsSummary:
          'Reported skin-lightening effect versus placebo in a small number of subjects.',
        limitations:
          'Small trial; a separate independent publication (not directly re-verified in this review) has specifically flagged INTRAVENOUS glutathione for skin lightening as having inadequate safety data — that caution applies to the IV route, not necessarily this oral trial.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'Human trials of oral glutathione supplementation report CONFLICTING results: some find no significant change in systemic oxidative-stress biomarkers (including glutathione status itself) in healthy volunteers, while others (and separate trials specifically targeting skin pigmentation) report a measurable skin-lightening effect versus placebo. Both directly-conflicting types of findings are represented — this is not simplified into a single "works" or "doesn\'t work" claim.',
      evidenceQuality: 'low',
      qualityRationale:
        'Randomized, placebo-controlled trials exist on both sides of the question, with genuinely conflicting results depending on outcome measured (systemic oxidative-stress biomarkers vs. skin pigmentation specifically) and population.',
      interpretationStatus: 'conflicting',
      sources: [
        { sourceKey: 'pmid-21875351', relationship: 'directly_supports' },
        { sourceKey: 'pmid-20524875', relationship: 'contradicts' },
      ],
    },
    {
      contentSection: 'safety',
      statement:
        'Intravenous glutathione specifically (as distinct from oral) has been flagged in the literature as having inadequate safety data for skin-lightening use — this review did not independently re-verify that specific source but notes the concern is route-specific (IV), not necessarily applicable to oral supplementation trials.',
      interpretationStatus: 'unknown',
      sources: [{ sourceKey: 'pmid-20524875', relationship: 'provides_context' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: 'c6726370-dae9-4503-83ee-04568205bc3a',
      legacyStatementExcerpt:
        'Glutathione is an endogenous tripeptide widely studied for its central role in antioxidant defense and cellular homeostasis',
      disposition: 'supported',
      rationale: 'Accurate general description; confirmed by the breadth of literature identified.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: '0d104504-a3a1-457b-9969-42c0db1dc183',
      legacyStatementExcerpt:
        'Because glutathione is present throughout the body, it has become one of the most extensively researched molecules in cellular health',
      disposition: 'supported',
      rationale: 'Accurate — confirmed by the volume and diversity of literature identified.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: '450d64ee-d555-45e6-bd60-d5425550ff16',
      legacyStatementExcerpt:
        'Researchers investigate glutathione for its ability to participate in redox reactions, neutralize reactive oxygen species',
      disposition: 'revised',
      rationale:
        'The underlying biochemistry (redox reactions, ROS neutralization) is well established textbook biochemistry, not in dispute. However, this statement is adjacent to a claim of supplementation efficacy, and the actual human SUPPLEMENTATION trial evidence for whether raising glutathione via oral intake measurably changes these biomarkers is conflicting (see new summary claim) — that nuance was previously missing.',
      evidenceQuality: 'low',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'pmid-21875351', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'e1da4979-223c-4ae2-a041-b0de50c3a06a',
      legacyStatementExcerpt:
        'Q: What is glutathione researched for? A: Research commonly focuses on antioxidant biology, oxidative stress, mitochondrial function',
      disposition: 'supported',
      rationale: 'Accurately reflects the actual research focus.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-21875351', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: '5c051458-9348-4db5-917d-ca7109d262ac',
      legacyStatementExcerpt:
        'Q: Is glutathione naturally produced? A: Yes. It is a naturally occurring tripeptide found in cells throughout the body',
      disposition: 'supported',
      rationale: 'Accurate, uncontroversial biochemical fact.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    policyReconciliation(
      '8330d6fe-3a01-4a3e-86e8-236c519290ba',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      'd28b31dc-c1ae-456b-a24d-99d24dbfccad',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      'a51517e1-0b53-4055-8239-a76bd9702ff5',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    policyReconciliation(
      '26e529a8-e4b2-40dd-89b2-b5978e642a8d',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
