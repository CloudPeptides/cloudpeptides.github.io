/**
 * Growth Hormone Muscle Building Stack (CJC-1295 DAC + Ipamorelin) —
 * research enrichment.
 *
 * Honest coverage note: no published study of CJC-1295 DAC
 * co-administered with Ipamorelin (the combination itself) was
 * identified. Each has its own separately-verified human evidence
 * (CJC-1295 DAC: cjc-1295-dac.mjs; Ipamorelin: ipamorelin.mjs, this
 * batch) — combining a GHRH-receptor agonist with a ghrelin-receptor
 * agonist is a mechanistically complementary concept commonly used in
 * endogenous-GH-research design, but that rationale has not itself been
 * tested as a combination in the sources located here.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'growth-hormone-muscle-building-stack',
  sources: [
    {
      key: 'pmid-16352683-musclestack',
      sourceType: 'pubmed_article',
      title: 'Prolonged stimulation of growth hormone (GH) and insulin-like growth factor I secretion by CJC-1295, a long-acting analog of GH-releasing hormone, in healthy adults.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/16352683/',
      identifiers: { pmid: '16352683' },
      study: {
        studyDesign: 'rct_human',
        intervention: 'CJC-1295 DAC monotherapy',
        resultsSummary: 'See cjc-1295-dac.mjs for the fuller evidence base.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-9849822-musclestack',
      sourceType: 'pubmed_article',
      title: 'Ipamorelin, the first selective growth hormone secretagogue.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/9849822/',
      identifiers: { pmid: '9849822' },
      study: {
        studyDesign: 'animal_study',
        intervention: 'Ipamorelin monotherapy',
        resultsSummary: 'See ipamorelin.mjs for the fuller evidence base.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'No published study of CJC-1295 DAC co-administered with Ipamorelin (the "Growth Hormone Muscle Building Stack" combination itself) was identified during this review. Both individually have real human evidence for their independent effect on GH/IGF-1 physiology, and pairing a GHRH-receptor agonist with a ghrelin-receptor agonist is a recognized mechanistic concept in GH-secretagogue research — but that conceptual rationale is not itself evidence that the specific combination produces a measured additive or synergistic effect, or that it is safe. No muscle-building or body-composition outcome has been directly studied for either compound individually or in combination in the sources reviewed here.',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-16352683-musclestack', relationship: 'provides_context' },
        { sourceKey: 'pmid-9849822-musclestack', relationship: 'provides_context' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '0f288f7a-a648-433e-bf7f-60f59b414c67',
      legacyStatementExcerpt: 'This research stack combines CJC-1295 DAC and Ipamorelin, two compounds commonly investigated for their roles in growth hormone physiology',
      disposition: 'revised',
      rationale: 'Each compound individually is confirmed to have real GH-physiology evidence. The combination itself has not been "investigated" — no combination study exists.',
      evidenceQuality: 'low',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-16352683-musclestack', relationship: 'directly_supports' },
        { sourceKey: 'pmid-9849822-musclestack', relationship: 'directly_supports' },
      ],
    },
    {
      legacyClaimId: 'bb43baec-8ff6-4a27-827e-137cdb920b24',
      legacyStatementExcerpt: 'Because the compounds influence growth hormone pathways through different mechanisms, they are frequently investigated together',
      disposition: 'unsupported',
      rationale: 'No source investigating them "together" was located — this is a plausible mechanistic rationale, not verified joint research.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: 'ad5f6990-3f38-482d-986b-96d33ad77a1d',
      legacyStatementExcerpt: 'Scientific understanding continues to evolve, and findings should always be interpreted within the context of the individual study',
      disposition: 'supported',
      rationale: 'Generic, appropriately cautious statement.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: '46a257d4-9da4-4788-baec-b8297def3676',
      legacyStatementExcerpt: 'Researchers investigate this pairing because both compounds are associated with growth hormone signaling while acting through different biological mechanisms',
      disposition: 'unsupported',
      rationale: 'Same finding — no combination-specific investigation was located.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: 'ccda6ffc-29ce-4e51-a752-92501e294835',
      legacyStatementExcerpt: 'Q: Why are these compounds researched together? A: Researchers study them together because they influence growth hormone pathways through different biological mechanisms',
      disposition: 'revised',
      rationale: 'A plausible product-design rationale, not evidence the pairing has been researched.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    policyReconciliation('a4f5340e-dbc7-460d-bf13-1fcaa405bb11', 'Q: Does Cloud Peptides recommend this stack? A: No.'),
    policyReconciliation('12b17c0d-a50a-4861-af7c-54dfb986eeb9', 'Q: Does this page provide dosage information? A: No.'),
    policyReconciliation('80a12c34-c5c8-44ee-a0ec-aa4cfb9a1302', 'Q: Are these products intended for human consumption? A: No.'),
    policyReconciliation('4adef925-f00f-458c-bda5-a7c49a87ebde', 'This page summarizes published scientific literature for educational purposes only.'),
    policyReconciliation('f7d6305d-1b79-4fa7-b8e7-57b43f5c66e2', 'Cloud Peptides does not provide medical advice, dosage recommendations, treatment advice'),
    policyReconciliation('b7df8c90-cb02-409c-972c-cd8ea02f66a2', 'All products offered by Cloud Peptides are intended strictly for laboratory research purposes only'),
  ],
};
