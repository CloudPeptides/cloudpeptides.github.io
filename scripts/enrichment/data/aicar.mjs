/**
 * AICAR — research enrichment. Sources verified via NCBI E-utilities and
 * USADA's own athlete-guidance page.
 *
 * Honest coverage note: AICAR's "exercise pill" evidence base is
 * exclusively animal (mouse). No human efficacy trial for
 * exercise/endurance enhancement was identified; it is not approved for
 * any human therapeutic use.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'aicar',
  sources: [
    {
      key: 'pmid-18674809',
      sourceType: 'pubmed_article',
      title: 'AMPK and PPARdelta agonists are exercise mimetics.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/18674809/',
      publisherOrAgency: 'Cell',
      publicationDate: '2008-08-08',
      identifiers: { pmid: '18674809', doi: '10.1016/j.cell.2008.06.051' },
      study: {
        studyDesign: 'animal_study',
        population: 'Sedentary mice',
        intervention: 'AICAR (AMPK activator), 4 weeks',
        comparator: 'Untreated sedentary mice; exercise-trained mice',
        resultsSummary:
          'AICAR treatment alone (without exercise) enhanced treadmill running endurance by approximately 44% in sedentary mice, and reproduced some transcriptional/metabolic adaptations otherwise induced by exercise training — the origin of AICAR\'s "exercise pill" characterization.',
        limitations: 'Mouse study only; the exercise-mimetic effect has not been demonstrated in a published human trial.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-18703760',
      sourceType: 'pubmed_article',
      title: 'Differential attenuation of AMPK activation during acute exercise following exercise training or AICAR treatment.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/18703760/',
      publisherOrAgency: 'Journal of Applied Physiology',
      publicationDate: '2008-11',
      identifiers: { pmid: '18703760', doi: '10.1152/japplphysiol.01371.2007' },
      study: {
        studyDesign: 'animal_study',
        population: 'Rats',
        intervention: 'AICAR administration, 10 days',
        comparator: 'Exercise-trained rats',
        resultsSummary:
          '10 days of AICAR administration substantially mimicked the effect of 10 days of exercise training on attenuating skeletal-muscle AMPK activation in response to subsequent exercise.',
        limitations: 'Animal study only.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'usada-aicar',
      sourceType: 'other',
      title: 'What Athletes Should Know About AICAR and Others',
      url: 'https://www.usada.org/spirit-of-sport/aicar-and-other-prohibited-amp-activated-protein-kinase-activators/',
      publisherOrAgency: 'U.S. Anti-Doping Agency (USADA)',
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        'AICAR is an AMP-activated protein kinase (AMPK) activator. In sedentary mice, 4 weeks of AICAR treatment increased treadmill running endurance by approximately 44%, and 10 days of AICAR administration in rats reproduced training-like attenuation of exercise-induced AMPK activation — the basis of AICAR\'s "exercise mimetic" characterization.',
      evidenceQuality: 'moderate',
      qualityRationale: 'Peer-reviewed, in a top-tier journal (Cell) for the primary finding; consistent, independently replicated direction of effect across two studies — but animal-only.',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-18674809', relationship: 'directly_supports' },
        { sourceKey: 'pmid-18703760', relationship: 'directly_supports' },
      ],
    },
    {
      contentSection: 'regulatory',
      statement:
        'AICAR is prohibited at all times in competitive sport under the World Anti-Doping Agency (WADA) Prohibited List (Hormone and Metabolic Modulators category), and is not approved for any human therapeutic use in the United States.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'usada-aicar', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'safety',
      statement:
        'As of this review, no published human clinical trial evaluating AICAR for exercise performance/endurance enhancement was identified — the "exercise pill" evidence is exclusively from mouse and rat studies.',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-18674809', relationship: 'provides_context' },
        { sourceKey: 'pmid-18703760', relationship: 'provides_context' },
      ],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'World Anti-Doping Agency (WADA)',
      jurisdiction: 'International (competitive sport)',
      regulatoryStatus: 'banned_in_sport',
      sourceKey: 'usada-aicar',
      notes: 'Classified under the Hormone and Metabolic Modulators category on the WADA Prohibited List, prohibited at all times, per USADA athlete guidance. Not approved for human therapeutic use by any governmental regulatory authority.',
    },
  ],
  legacyReconciliations: [
    {
      legacyClaimId: '70f9c2fc-c49a-477c-ac4a-ebdb4e9a58a6',
      legacyStatementExcerpt: 'AICAR is widely studied as an activator of AMP-activated protein kinase (AMPK)',
      disposition: 'supported',
      rationale: 'Confirmed AMPK-activator mechanism, correctly framed as research (not a human-efficacy claim).',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-18674809', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '36783725-22cf-4f5b-9911-134a13b6eca2',
      legacyStatementExcerpt: 'Because AMPK acts as an intracellular energy sensor, AICAR continues to be explored in laboratory studies',
      disposition: 'supported',
      rationale: 'Correctly hedged as laboratory (not human) research; consistent with the verified animal evidence base.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-18703760', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '9eb7d2ff-efcb-4dd1-a074-3dc3b473435a',
      legacyStatementExcerpt: 'AICAR is converted inside cells into a molecule capable of activating AMPK',
      disposition: 'supported',
      rationale: 'Consistent with the well-established AICAR-to-ZMP-to-AMPK-activation mechanism described in the verified sources.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-18674809', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '5ba2b607-9842-42e4-936f-f48279e740cb',
      legacyStatementExcerpt: 'Q: What is AICAR primarily researched for? A: Most research focuses on AMPK activation',
      disposition: 'supported',
      rationale: 'Confirmed by the verified literature.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-18674809', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '8cc75cbf-b001-470a-9793-d053cae4b28e',
      legacyStatementExcerpt: 'Q: Is AICAR a peptide? A: No. AICAR is a small-molecule research compound',
      disposition: 'supported',
      rationale: 'Chemical classification fact (a nucleotide/ribonucleoside analog, not an amino-acid chain) verifiable by structure.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    policyReconciliation('7a63e133-b236-429d-acf3-267c457a097a', 'Q: Does Cloud Peptides provide dosage information? A: No.'),
    policyReconciliation('5117c83e-c946-4d33-8ed5-467627e625cb', 'This page summarizes published scientific literature for educational purposes only.'),
    policyReconciliation('118d2c0e-848b-4f32-974f-3a5c4d0b6255', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    policyReconciliation('44993f1b-f4ca-4c2d-b69e-4c9bd0a4508a', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
