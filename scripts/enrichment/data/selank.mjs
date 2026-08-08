/**
 * Selank — research enrichment. Sources verified via NCBI E-utilities.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'selank',
  sources: [
    {
      key: 'pmid-18577961',
      sourceType: 'pubmed_article',
      title: 'Immunomodulatory effects of selank in patients with anxiety-asthenic disorders.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/18577961/',
      publisherOrAgency: 'Zhurnal Nevrologii i Psikhiatrii Imeni S.S. Korsakova',
      publicationDate: '2008',
      identifiers: { pmid: '18577961' },
      study: {
        studyDesign: 'human_observational',
        population: 'Patients with anxiety-asthenic disorders',
        intervention: 'Selank',
        resultsSummary:
          'Reported immunomodulatory effects alongside anxiolytic effects in this patient population.',
        limitations:
          'Published in a Russian-language journal; this review relied on the English abstract, not the full primary text; randomization/blinding not confirmed from the abstract alone.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-30255741-selank',
      sourceType: 'pubmed_article',
      title:
        'Peptide-based Anxiolytics: The Molecular Aspects of Heptapeptide Selank Biological Activity.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/30255741/',
      publisherOrAgency: 'Protein and Peptide Letters',
      publicationDate: '2018',
      identifiers: { pmid: '30255741', doi: '10.2174/0929866525666180925144642' },
      study: {
        studyDesign: 'narrative_review',
        resultsSummary:
          "Reviews Selank's proposed anxiolytic mechanism (GABAergic modulation, allosteric GABA-A receptor interaction) and preclinical/clinical findings.",
        limitations: 'Narrative (non-systematic) review.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-24913576',
      sourceType: 'pubmed_article',
      title:
        'Efficacy of peptide anxiolytic selank during modeling of withdrawal syndrome in rats with stable alcoholic motivation.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/24913576/',
      identifiers: { pmid: '24913576' },
      study: {
        studyDesign: 'animal_study',
        population: 'Alcohol-preferring rats, ethanol-withdrawal model',
        intervention: 'Selank, single intraperitoneal injection (0.3 mg/kg)',
        resultsSummary:
          'Eliminated withdrawal-induced anxiety (elevated plus maze, social interaction tests) and prevented mechanical allodynia, without affecting ethanol consumption itself.',
        limitations: 'Animal model only.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        "Selank has both animal (anxiolytic effect in an alcohol-withdrawal rat model) and human observational evidence (immunomodulatory and anxiolytic effects reported in patients with anxiety-asthenic disorders) — but the human evidence relies on a Russian-language publication reviewed here only via its English abstract, with randomization/blinding not confirmed. Selank's proposed mechanism (GABAergic modulation) is described in an independent 2018 narrative review.",
      evidenceQuality: 'low',
      qualityRationale:
        'Real human observational data exists (a strength relative to many compounds in this database), but design rigor (randomization/blinding) could not be confirmed from the abstract, and no rigorous placebo-controlled human RCT was independently verified in this review.',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-18577961', relationship: 'directly_supports' },
        { sourceKey: 'pmid-24913576', relationship: 'directly_supports' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: 'b48c04e5-7138-47e1-babb-b9ab45551996',
      legacyStatementExcerpt:
        'Selank is a synthetic peptide investigated in neuroscience and behavioral research',
      disposition: 'supported',
      rationale: 'Confirmed by real human observational and animal literature.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-18577961', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '599027fa-f7b4-478a-954f-5a8645b2305b',
      legacyStatementExcerpt:
        'Researchers continue to examine Selank in laboratory models involving central nervous system function, behavioral adaptation, and peptide-mediated regulation',
      disposition: 'supported',
      rationale: 'Confirmed by the verified animal (alcohol-withdrawal) and human evidence.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-24913576', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '54118e9f-0f23-4627-87e8-105993f062fc',
      legacyStatementExcerpt:
        'Selank is studied for its potential influence on neuropeptide signaling, neurotransmitter systems, and immune-related pathways',
      disposition: 'supported',
      rationale:
        'Directly confirmed — the human study specifically reports immunomodulatory effects, and the review source describes GABAergic/neurotransmitter mechanisms.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-18577961', relationship: 'directly_supports' },
        { sourceKey: 'pmid-30255741-selank', relationship: 'directly_supports' },
      ],
    },
    {
      legacyClaimId: '63f1ebe2-9f97-47fe-a0ad-a263de5674d1',
      legacyStatementExcerpt:
        'Q: What is Selank researched for? A: Research commonly focuses on neurobiology, stress-response pathways, cognitive models, neurotransmitter systems, and immune-neural signaling',
      disposition: 'supported',
      rationale: 'Accurately reflects the verified research focus.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-18577961', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'd4556fb9-fae4-4fd6-a358-1cfcb545368e',
      legacyStatementExcerpt:
        'Q: Is Selank related to Semax? A: They are distinct regulatory peptides, but both are commonly discussed within cognitive and neurological research categories',
      disposition: 'supported',
      rationale:
        'Accurate — both are real, independently verified Russian regulatory peptides with distinct sequences/mechanisms (see semax.mjs).',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-30255741-selank', relationship: 'provides_context' }],
    },
    policyReconciliation(
      'eecbe24e-8e46-4291-ac4e-6ad12d660838',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      'f718dcfc-4202-4be0-8052-c6233bce93a2',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      'e190f283-cef7-4ee7-b6c1-ac92faa4336a',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    policyReconciliation(
      'd15b62a2-f728-4178-bd2e-84e4e9bbe956',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
