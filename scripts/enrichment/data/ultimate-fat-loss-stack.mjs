/**
 * Ultimate Fat Loss Stack (Retatrutide + Cagrilintide) — research
 * enrichment.
 *
 * Honest coverage note: no published study of Retatrutide co-
 * administered with Cagrilintide (this specific combination) was
 * identified. Both individually have strong separately-verified human
 * RCT evidence (Retatrutide: retatrutide.mjs, pilot; Cagrilintide:
 * cagrilintide.mjs, batch 1) — but Cagrilintide's own strongest
 * evidence is specifically for its combination with SEMAGLUTIDE
 * (CagriSema), not Retatrutide. This is a genuinely novel,
 * unstudied pairing, not a repackaging of existing combination trials.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'ultimate-fat-loss-stack',
  sources: [
    {
      key: 'pmid-37366315-ultimate',
      sourceType: 'pubmed_article',
      title: 'Triple-Hormone-Receptor Agonist Retatrutide for Obesity — A Phase 2 Trial.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/37366315/',
      identifiers: { pmid: '37366315' },
      study: {
        studyDesign: 'rct_human',
        intervention: 'Retatrutide monotherapy',
        resultsSummary: 'See retatrutide.mjs for the fuller evidence base.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-34798060-ultimate',
      sourceType: 'pubmed_article',
      title: 'Once-weekly cagrilintide for weight management in people with overweight and obesity: a multicentre, randomised, double-blind, placebo-controlled and active-controlled, dose-finding phase 2 trial.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/34798060/',
      identifiers: { pmid: '34798060' },
      study: {
        studyDesign: 'rct_human',
        intervention: 'Cagrilintide monotherapy',
        resultsSummary: 'See cagrilintide.mjs for the fuller evidence base (including its stronger combination evidence with semaglutide, not retatrutide).',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'No published study of Retatrutide co-administered with Cagrilintide (this specific "Ultimate Fat Loss Stack" combination) was identified during this review. This is a notably different situation from most other combination products in this database: both individual compounds have real, separately-strong human RCT evidence, but Cagrilintide\'s own strongest published combination evidence is specifically with SEMAGLUTIDE (the CagriSema program), not Retatrutide — meaning this specific pairing cannot even be indirectly supported by extrapolating from an adjacent studied combination. Retatrutide itself also remains investigational (not FDA-approved for any indication as of this review).',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-37366315-ultimate', relationship: 'provides_context' },
        { sourceKey: 'pmid-34798060-ultimate', relationship: 'provides_context' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: 'ef301b34-4c56-4b0f-b7f8-946550299364',
      legacyStatementExcerpt: 'The Ultimate Fat Loss Stack combines two compounds that have become subjects of significant metabolic research because they influence different biological pathways',
      disposition: 'revised',
      rationale: 'Each compound individually is confirmed to have significant metabolic research (Retatrutide: GIP/GLP-1/glucagon triple agonist; Cagrilintide: amylin analog). The COMBINATION itself is not researched — no source evaluates them together.',
      evidenceQuality: 'low',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-37366315-ultimate', relationship: 'directly_supports' },
        { sourceKey: 'pmid-34798060-ultimate', relationship: 'directly_supports' },
      ],
    },
    {
      legacyClaimId: 'db159c69-311e-4ad2-a1f6-7d60bc0ba303',
      legacyStatementExcerpt: 'Rather than acting through the same mechanism, these compounds have been studied for their complementary biological effects',
      disposition: 'unsupported',
      rationale: 'Each has been studied for its own effects independently; no source has studied them "for their complementary" effect together.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '5e2d1e84-74f7-4efb-8fb9-e25eba4a02e8',
      legacyStatementExcerpt: 'While this combination has generated considerable scientific interest, research remains ongoing and findings continue to evolve',
      disposition: 'unsupported',
      rationale: 'No evidence was found that "this combination" specifically (as opposed to each individual compound) has generated scientific research interest — no combination study or registered trial was located.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '2c9e7867-aaeb-4219-af90-c19b9d6e29a7',
      legacyStatementExcerpt: 'Retatrutide and Cagrilintide are commonly discussed together in metabolic research because they influence different physiological signaling pathways',
      disposition: 'unsupported',
      rationale: 'No source discussing them "together" in actual research was located — only independent, single-compound literature for each.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '8d37ec14-e9cf-45a6-b894-fef500ef383f',
      legacyStatementExcerpt: 'Researchers are interested in understanding how multiple pathways involved in appetite, satiety, energy balance, and body composition interact when studied together',
      disposition: 'unsupported',
      rationale: 'No study of the two compounds\' pathways interacting together was located.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '7f9794e8-ef80-4b36-bb6c-f4f58433e1e1',
      legacyStatementExcerpt: 'Current research remains ongoing, and published findings continue to evolve',
      disposition: 'supported',
      rationale: 'Generic, appropriately cautious statement, true of the individual compounds\' research even though the combination itself has none.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: 'ed4c2a58-a529-4387-99b9-7a712e53c193',
      legacyStatementExcerpt: 'Q: Why are these compounds commonly researched together? A: Researchers study these compounds together because they influence different biological pathways',
      disposition: 'revised',
      rationale: 'A plausible product-design rationale, not evidence the pairing itself has been researched — and notably, unlike some other stacks in this database, there isn\'t even an adjacent studied combination (e.g. Cagrilintide+semaglutide) to draw indirect support from for THIS specific pairing.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    policyReconciliation('88eb5716-9ee0-42cd-92d2-6eafcd8ba95a', 'Q: Does Cloud Peptides recommend this stack? A: No.'),
    policyReconciliation('55faa020-6c96-4a39-a7d9-1493d4aff0af', 'Q: Does this article contain dosage recommendations? A: No.'),
    policyReconciliation('abebebf8-ad25-4313-8eb9-80f787ece5b1', 'Q: Are these products intended for human consumption? A: No.'),
    {
      legacyClaimId: '337b429e-ea58-433d-b2ba-aabe20024022',
      legacyStatementExcerpt: 'Q: Where can I learn more? A: Additional educational resources are available through published scientific literature, ClinicalTrials.gov',
      disposition: 'supported',
      rationale: 'Accurate and appropriately points readers to authoritative primary sources rather than making further unverified claims.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    policyReconciliation('98bb1398-2e4f-412f-96eb-d8b2160d5abc', 'The information provided on this page is intended solely for educational and informational purposes.'),
    policyReconciliation('7625f6f8-e707-4d27-975a-beade5e6aaf3', 'Cloud Peptides does not provide dosage recommendations, treatment advice, research protocols'),
    policyReconciliation('f1b81071-4a46-41d6-bc80-521b36897d59', 'All products offered by Cloud Peptides are intended strictly for laboratory research purposes only'),
  ],
};
