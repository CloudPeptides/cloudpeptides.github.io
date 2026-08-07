/**
 * IGF-1 LR3 (Long R3 IGF-1) — research enrichment. Sources verified via
 * NCBI E-utilities.
 *
 * Honest coverage note: Long R3 IGF-1 (LR3) was originally developed and
 * is primarily used as a cell-culture/biomanufacturing reagent (a more
 * potent, IGFBP-resistant alternative to insulin/native IGF-1 in
 * serum-free culture systems) — not as a studied human therapeutic. No
 * human clinical trial of IGF-1 LR3 was identified in this review.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'igf-1-lr3',
  sources: [
    {
      key: 'pmid-17172665',
      sourceType: 'pubmed_article',
      title: 'LONG R3IGF-I as a more potent alternative to insulin in serum-free culture of HEK293 cells.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/17172665/',
      publisherOrAgency: 'Molecular Biotechnology',
      publicationDate: '2006-10',
      identifiers: { pmid: '17172665', doi: '10.1385/mb:34:2:201' },
      study: {
        studyDesign: 'in_vitro_study',
        population: 'HEK293 cell culture',
        intervention: 'LONG R3IGF-I (IGF-1 LR3)',
        comparator: 'Insulin; native IGF-1',
        resultsSummary: 'LONG R3IGF-I acted as a more potent growth/survival factor than either insulin or native IGF-1 in serum-free HEK293 cell culture, at lower concentrations — its intended biomanufacturing use case.',
        limitations: 'Cell-culture reagent-development study, not a physiological or clinical outcome study.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-7561636',
      sourceType: 'pubmed_article',
      title: 'Long R3 insulin-like growth factor-I (IGF-I) infusion stimulates organ growth but reduces plasma IGF-I, IGF-II and IGF binding protein concentrations in the guinea pig.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/7561636/',
      publisherOrAgency: 'Journal of Endocrinology',
      publicationDate: '1995-08',
      identifiers: { pmid: '7561636' },
      study: {
        studyDesign: 'animal_study',
        population: 'Guinea pigs',
        intervention: 'Long R3 IGF-I, infusion',
        resultsSummary: 'Stimulated organ growth in vivo but simultaneously REDUCED endogenous plasma IGF-I, IGF-II, and IGF-binding protein concentrations — a notable, potentially counterintuitive systemic finding.',
        limitations: 'Animal (guinea pig) study; a single-species finding not independently replicated in this review.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'Long R3 IGF-1 (IGF-1 LR3) was engineered primarily as a cell-culture/biomanufacturing reagent — a more potent, IGF-binding-protein-resistant alternative to insulin or native IGF-1 in serum-free mammalian cell culture systems. No published human clinical trial of IGF-1 LR3 was identified during this review; in vivo animal data (guinea pig) show it stimulates organ growth but also reduces the animal\'s own circulating IGF-I/IGF-II/IGFBP levels — a notable systemic effect distinct from simply "more IGF-1 activity."',
      evidenceQuality: 'low',
      qualityRationale: 'Real peer-reviewed in-vitro and animal evidence exists, but no human trial was located, and the animal finding on endogenous IGF suppression is a single-species result.',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-17172665', relationship: 'directly_supports' },
        { sourceKey: 'pmid-7561636', relationship: 'directly_supports' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '2b5650d3-9619-4822-bd63-c723fdb4c635',
      legacyStatementExcerpt: 'IGF-1 LR3 is a modified analog of insulin-like growth factor-1 that has become an important research tool in studies involving muscle physiology',
      disposition: 'revised',
      rationale:
        'Accurate that it is "a research tool" — but its PRIMARY, best-documented use case is as a cell-culture/biomanufacturing reagent, not muscle-physiology research specifically. No human muscle-physiology study was located; the muscle-related evidence identified (see igf-1-lr3.mjs summary claim) is animal/cell-culture only.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-17172665', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '7dc32db5-296d-476c-8e68-e6e9c3764d1d',
      legacyStatementExcerpt: 'Researchers investigate how prolonged IGF-1 receptor activation influences muscle adaptation, protein synthesis, body composition, and recovery',
      disposition: 'unsupported',
      rationale: 'No source specific to IGF-1 LR3 (as opposed to native IGF-1 generally) evaluating muscle adaptation, protein synthesis, body composition, or recovery in vivo (animal or human) was located in this review.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: 'ce587975-59f3-436a-98c3-a1b4780a61f4',
      legacyStatementExcerpt: 'IGF-1 LR3 binds to the IGF-1 receptor, initiating signaling pathways involved in cellular growth, survival, and protein synthesis',
      disposition: 'supported',
      rationale: 'Confirmed by the verified in-vitro cell-culture literature.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-17172665', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '076abad3-188f-4ece-9aef-93e4880c6f6b',
      legacyStatementExcerpt: 'Q: What receptor does IGF-1 LR3 target? A: Researchers primarily investigate its interaction with the IGF-1 receptor',
      disposition: 'supported',
      rationale: 'Confirmed.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-17172665', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'f99e9f8a-b75d-4a60-90b2-7e510b2496f1',
      legacyStatementExcerpt: 'Q: Is IGF-1 LR3 the same as growth hormone? A: No. IGF-1 LR3 is a modified insulin-like growth factor researched separately from growth hormone',
      disposition: 'supported',
      rationale: 'Accurate — IGF-1 LR3 and growth hormone are distinct molecules with distinct receptors, consistent with the verified biology.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    policyReconciliation('babc1f98-d698-48d9-ae31-cc851face545', 'Q: Does this page provide dosage information? A: No.'),
    policyReconciliation('58afe99f-5d9c-4134-8b9d-e3ae479c7686', 'This page summarizes publicly available scientific literature for educational purposes only.'),
    policyReconciliation('5f64b223-8a49-4b94-9c66-75620b5c6268', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    policyReconciliation('4665f878-9868-42b1-adc9-83cda207bc8f', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
