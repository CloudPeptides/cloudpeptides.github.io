/**
 * NAD+ — research enrichment. Sources verified via NCBI E-utilities.
 *
 * Honest coverage note: NAD+ itself (the coenzyme, injected/infused
 * directly) has a genuine, explicitly documented "paucity of human
 * data" for its popular IV-infusion use, despite that use being widely
 * commercially available. The stronger human RCT evidence that exists
 * is for ORAL PRECURSOR compounds (e.g. nicotinamide riboside, NMN),
 * which are chemically and legally distinct products from direct NAD+
 * administration — this distinction is preserved, not blurred.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'nad-plus',
  sources: [
    {
      key: 'pmid-29184669',
      sourceType: 'pubmed_article',
      title:
        'Repeat dose NRPT (nicotinamide riboside and pterostilbene) increases NAD+ levels in humans safely and sustainably: a randomized, double-blind, placebo-controlled study.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/29184669/',
      publisherOrAgency: 'npj Aging and Mechanisms of Disease',
      publicationDate: '2017-11-24',
      identifiers: { pmid: '29184669', doi: '10.1038/s41514-017-0016-9' },
      study: {
        studyDesign: 'rct_human',
        population: 'Healthy adults',
        intervention:
          'Oral nicotinamide riboside + pterostilbene (NAD+ precursor compounds), repeat dosing',
        comparator: 'Placebo',
        route: 'Oral',
        resultsSummary:
          'Repeat oral dosing of NAD+ precursor compounds safely and sustainably increased NAD+ levels in humans.',
        limitations:
          'Studies oral NAD+ PRECURSORS, not direct NAD+ administration (e.g. IV infusion) — a materially different intervention and product category.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'Despite NAD+ IV infusion being widely commercially available (thousands of boutique clinics), a specific search of the peer-reviewed literature during this review found an explicitly documented "paucity of human data" evaluating direct NAD+ IV administration itself as a treatment or health-modifying intervention. The stronger human randomized-controlled-trial evidence that does exist concerns ORAL NAD+ PRECURSOR compounds (e.g. nicotinamide riboside, nicotinamide mononucleotide) — which safely and measurably raise cellular NAD+ levels — not direct IV NAD+ administration. These are legally and chemically distinct products, and evidence for one should not be presented as evidence for the other.',
      evidenceQuality: 'low',
      qualityRationale:
        'The precursor-compound evidence is a genuine randomized, placebo-controlled human trial (real strength). However, it does not directly evidence the NAD+ IV/injectable use case commonly marketed, which this review found to have a documented human-data gap.',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-29184669', relationship: 'indirectly_supports' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: 'd1eccdb0-51f8-4805-97f8-d5b5724939f9',
      legacyStatementExcerpt:
        'NAD+ is a naturally occurring coenzyme found in every living cell and is essential for energy metabolism',
      disposition: 'supported',
      rationale: 'Uncontroversial, well-established biochemistry.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: '574eab23-cce3-43c8-8d80-bfc338f8f0c7',
      legacyStatementExcerpt:
        'Laboratory investigations explore NAD+ in models involving healthy aging, DNA repair, oxidative stress, neurobiology, and cellular resilience',
      disposition: 'revised',
      rationale:
        'Accurate for the underlying biochemistry/laboratory research field broadly, but this framing does not distinguish between the well-evidenced oral-precursor human trials and the much less-evidenced direct-NAD+-administration products actually marketed to consumers — a distinction this review found to matter significantly (see new summary claim).',
      evidenceQuality: 'low',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-29184669', relationship: 'indirectly_supports' }],
    },
    {
      legacyClaimId: '497046a3-c820-4bb6-8360-7e94ac0b6fe6',
      legacyStatementExcerpt:
        'Researchers investigate NAD+ as a critical cofactor in oxidation-reduction reactions that support ATP production, mitochondrial function',
      disposition: 'supported',
      rationale: 'Uncontroversial, well-established biochemistry, not in dispute.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: 'd14b0ace-df97-463d-a2e5-a862223afa1e',
      legacyStatementExcerpt:
        'Q: What is NAD+ researched for? A: Research commonly focuses on cellular energy metabolism, mitochondrial biology, DNA repair pathways',
      disposition: 'supported',
      rationale: 'Accurate description of the research focus.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: 'e396a342-298c-4387-a88c-430cf9d41f6b',
      legacyStatementExcerpt:
        'Q: Is NAD+ naturally present in the body? A: Yes. NAD+ is a naturally occurring coenzyme found in virtually every cell',
      disposition: 'supported',
      rationale: 'Accurate, uncontroversial biochemical fact.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    policyReconciliation(
      '0603646f-aef3-4e88-9934-ed09b328f11b',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      'd244319c-d21c-4c98-b6ee-b2acfb443559',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      '23912ff5-d147-4ec7-8cea-64ab1184c113',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    policyReconciliation(
      '8f03b9c3-2e38-4c42-8cef-37c37d77b2af',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
