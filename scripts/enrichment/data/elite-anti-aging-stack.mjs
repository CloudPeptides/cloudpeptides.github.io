/**
 * Elite Anti-Aging Stack (Epithalon + GHK-Cu) — research enrichment.
 *
 * Honest coverage note: no published study of Epithalon co-administered
 * with GHK-Cu (the combination itself) was identified. Both components
 * individually have real evidence (GHK-Cu: see ghk-cu.mjs, pilot;
 * Epithalon: see epithalon-compound.mjs, forthcoming in this pipeline's
 * next batch) — only enough Epithalon sourcing to support this stack's
 * reconciliation is included here.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'elite-anti-aging-stack',
  sources: [
    {
      key: 'pmid-22451889-stack',
      sourceType: 'pubmed_article',
      title: 'Peptide geroprotector from the pituitary gland inhibits rapid aging of elderly people: results of 15-year follow-up.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/22451889/',
      publisherOrAgency: 'Bulletin of Experimental Biology and Medicine',
      publicationDate: '2011-07',
      identifiers: { pmid: '22451889', doi: '10.1007/s10517-011-1332-x' },
      study: {
        studyDesign: 'human_observational',
        population: 'Elderly people, 15-year follow-up',
        intervention: 'Peptide geroprotector (pituitary-gland-derived, from the Khavinson research program that also produced Epithalon)',
        resultsSummary: 'Reported reduced markers of "rapid aging" over long-term follow-up; see epithalon-compound.mjs for the fuller, independently-researched Epithalon evidence base.',
        limitations: 'This specific study concerns a related pituitary-derived peptide preparation, not Epithalon\'s own pineal-derived AEDG tetrapeptide specifically — cited here only as research-program context, not as direct Epithalon evidence.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'No published study of Epithalon co-administered with GHK-Cu (the "Elite Anti-Aging Stack" combination itself) was identified during this review. Each compound has its own separately-verified evidence base (GHK-Cu: see ghk-cu.mjs; Epithalon: see epithalon-compound.mjs) — combining them is a product-design choice, not itself a studied intervention.',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-22451889-stack', relationship: 'provides_context' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '62f852e7-eba8-4dba-968b-86ca1da5854c',
      legacyStatementExcerpt: 'The Elite Anti-Aging Stack combines Epithalon and GHK-Cu, two compounds that have become subjects of longevity and regenerative research',
      disposition: 'revised',
      rationale: 'Each compound individually has real research (confirmed separately for GHK-Cu in the pilot; confirmed for the Khavinson pituitary/pineal peptide research program here). The claim that this SPECIFIC PAIRING is studied for "healthy aging, cellular maintenance" overstates what is verifiable — no combination study exists.',
      evidenceQuality: 'low',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-22451889-stack', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: '989b875a-6688-49d8-8fef-6d50355aa860',
      legacyStatementExcerpt: 'Although they influence different biological systems, researchers are interested in how these complementary mechanisms may interact in laboratory models',
      disposition: 'unsupported',
      rationale: 'No laboratory model study of the two compounds\' interaction was located.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '6fa55e0b-36fb-4ea0-ba16-8a1f8845cd27',
      legacyStatementExcerpt: 'Research remains ongoing, and findings should always be interpreted within the context of peer-reviewed scientific literature',
      disposition: 'supported',
      rationale: 'Generic, appropriately cautious statement, consistent with this review\'s findings.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: '9c3b353c-aeed-404a-862a-9e22a0e32310',
      legacyStatementExcerpt: 'Researchers investigate Epithalon and GHK-Cu together because each has been associated with different aspects of longevity biology',
      disposition: 'unsupported',
      rationale: 'No source investigating the two "together" was located; each has been investigated independently.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: 'fe87672a-af1c-435c-93f3-813898506780',
      legacyStatementExcerpt: 'Q: Why are Epithalon and GHK-Cu researched together? A: Researchers investigate this pairing because each compound is associated with different areas',
      disposition: 'revised',
      rationale: 'A plausible product-design rationale, not evidence the pairing itself has been researched.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    policyReconciliation('989f311b-e41e-4f77-9ee1-87b5bbfc6722', 'Q: Does Cloud Peptides recommend this stack? A: No.'),
    policyReconciliation('00ad3850-eff3-4e37-8da5-fa96d249ab8b', 'Q: Does this page contain dosage recommendations? A: No.'),
    policyReconciliation('5472e265-aebb-4b4d-b546-1648d379130d', 'Q: Are these products intended for human consumption? A: No.'),
    policyReconciliation('cdd4641b-c473-43af-841e-0d335eeb1d73', 'This page summarizes published scientific literature for educational purposes only.'),
    policyReconciliation('295234e6-c84d-46a4-bc88-dadf0cdacaff', 'Cloud Peptides does not provide medical advice, dosage recommendations, treatment guidance'),
    policyReconciliation('1caa372b-b71e-4abf-bf4b-a210b6305ad8', 'All products offered by Cloud Peptides are intended strictly for laboratory research purposes only'),
  ],
};
