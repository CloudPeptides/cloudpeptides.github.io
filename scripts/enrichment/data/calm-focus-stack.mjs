/**
 * Calm Focus Stack (Selank + Semax) — research enrichment.
 *
 * Honest coverage note: no published study of Selank co-administered
 * with Semax (the combination itself) was identified. All evidence is
 * about each peptide studied separately. Semax's own literature is
 * documented in scripts/enrichment/data/semax.mjs (pilot); Selank's own
 * dedicated file will be researched independently in a later batch —
 * only enough Selank sourcing to support this stack's reconciliation is
 * included here, cited by the same PMIDs that will anchor Selank's own
 * page.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'calm-focus-stack',
  sources: [
    {
      key: 'pmid-30255741',
      sourceType: 'pubmed_article',
      title: 'Peptide-based Anxiolytics: The Molecular Aspects of Heptapeptide Selank Biological Activity.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/30255741/',
      publisherOrAgency: 'Protein and Peptide Letters',
      publicationDate: '2018',
      identifiers: { pmid: '30255741', doi: '10.2174/0929866525666180925144642' },
      study: {
        studyDesign: 'narrative_review',
        resultsSummary: 'Reviews Selank\'s proposed anxiolytic mechanism (GABAergic modulation) and preclinical/some clinical findings.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
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
        resultsSummary: 'Reported immunomodulatory effects alongside anxiolytic effects in this patient population.',
        limitations: 'Published in a Russian-language journal; this review relied on the English abstract, not the full primary text; study design details (randomization/blinding) not confirmed from the abstract alone.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'No published study of Selank co-administered with Semax (the "Calm Focus Stack" combination itself) was identified during this review. Selank has its own human evidence for anxiolytic and immunomodulatory effects (see sources here and its own forthcoming compound page); Semax\'s own evidence base is documented separately (see semax.mjs). Combining the two is not itself an evidence-based claim.',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-30255741', relationship: 'provides_context' },
        { sourceKey: 'pmid-18577961', relationship: 'provides_context' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '57edc4c3-0e87-4a1b-8dc2-3afc47f0005c',
      legacyStatementExcerpt: 'The Calm Focus Stack combines Selank and Semax, two synthetic peptides that have become common subjects of neuroscience research',
      disposition: 'revised',
      rationale:
        'Both individual peptides do have real neuroscience literature (confirmed for Semax in this pipeline\'s pilot; confirmed for Selank here). However, the statement that this SPECIFIC COMBINATION "is studied to better understand stress response, attention, emotional regulation" overstates what exists — no study of the combination itself was located. Each peptide\'s own research is real; the pairing\'s research is not.',
      evidenceQuality: 'low',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-30255741', relationship: 'provides_context' },
      ],
    },
    {
      legacyClaimId: 'c8880925-50bd-47dd-a46d-b6fc2ec58d94',
      legacyStatementExcerpt: 'Although the compounds are frequently paired, they are believed to influence different biological systems',
      disposition: 'supported',
      rationale: 'Accurately hedged ("believed to", not claiming direct combination evidence) and consistent with each peptide\'s distinct, separately-verified mechanism.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-30255741', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: '532dc210-8223-4c1c-b3c8-67c9c9f17352',
      legacyStatementExcerpt: 'Research in this area continues to evolve, and findings should always be interpreted within the context of published scientific literature',
      disposition: 'supported',
      rationale: 'Generic, appropriately cautious statement; consistent with this review\'s own findings.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: 'b7182fa1-99b4-4ed6-9d47-d8e3d6713e71',
      legacyStatementExcerpt: 'Researchers commonly investigate Selank and Semax together because each has been associated with different aspects of neuroscience',
      disposition: 'unsupported',
      rationale: 'No source located actually investigating Selank and Semax "together" as a combination — each has been investigated independently. The premise of joint investigation is not verified.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: 'ff4204cf-c10c-462a-846f-8a255beebdf5',
      legacyStatementExcerpt: 'Q: Why are Selank and Semax researched together? A: Researchers study this pairing because the compounds are associated with complementary areas',
      disposition: 'revised',
      rationale: 'As with the mechanism claim above — this is a plausible commercial rationale for pairing them, not evidence that the pairing itself has been "researched." Best understood as a marketing/product-design rationale, not a scientific claim.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    policyReconciliation('cae25943-a441-4785-b753-603b4c2a54f1', 'Q: Does Cloud Peptides recommend this stack? A: No.'),
    policyReconciliation('729ccdcd-5607-4eb8-9f15-4dcb3263f1c1', 'Q: Does this article contain dosage recommendations? A: No.'),
    policyReconciliation('acf9c8db-124f-45e4-a02a-ec8071e5c898', 'Q: Are these products intended for human consumption? A: No.'),
    policyReconciliation('f5a2a2b3-1965-4d4a-a688-f26d4e65885f', 'This page summarizes published scientific literature for educational purposes only.'),
    policyReconciliation('4dacd895-a78e-4fd2-8bee-87fff6a60693', 'Cloud Peptides does not provide medical advice, dosage recommendations, treatment guidance'),
    policyReconciliation('e0efb71f-8562-4e91-a84f-291dbf9d9053', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
