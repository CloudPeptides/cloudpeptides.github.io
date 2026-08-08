/**
 * Enhanced Sleep Stack (DSIP + Epithalon) — research enrichment.
 *
 * Honest coverage note: no published study of DSIP co-administered with
 * Epithalon (the combination itself) was identified. DSIP's own
 * evidence is documented in dsip.mjs (this batch); Epithalon's own
 * evidence will be documented independently in epithalon-compound.mjs
 * (next batch) — only enough Epithalon context to support this stack's
 * reconciliation is included here.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'enhanced-sleep-stack',
  sources: [
    {
      key: 'pmid-1299794-sleepstack',
      sourceType: 'pubmed_article',
      title:
        'Effects of delta sleep-inducing peptide on sleep of chronic insomniac patients. A double-blind study.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/1299794/',
      identifiers: { pmid: '1299794' },
      study: {
        studyDesign: 'rct_human',
        population: 'Chronic insomniac patients (n=16)',
        sampleSize: 16,
        intervention: 'DSIP, intravenous',
        resultsSummary:
          'See dsip.mjs for the fuller DSIP evidence base and its explicit caveat about weak/uncertain statistical significance.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-15452611-sleepstack',
      sourceType: 'pubmed_article',
      title:
        'Effect of peptide preparation epithalamin on circadian rhythm of epiphyseal melatonin-producing function in elderly people.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/15452611/',
      publisherOrAgency: 'Bulletin of Experimental Biology and Medicine',
      publicationDate: '2004-04',
      identifiers: { pmid: '15452611', doi: '10.1023/b:bebm.0000035139.31138.bf' },
      study: {
        studyDesign: 'human_observational',
        population: 'Elderly people with reduced pineal melatonin-producing function',
        intervention:
          "Epithalamin (pineal peptide preparation, source material for Epithalon's AEDG tetrapeptide)",
        resultsSummary:
          'Reported normalization of circadian melatonin rhythm in elderly subjects with initially reduced pineal function — see epithalon-compound.mjs for the fuller Epithalon evidence base.',
        limitations:
          'Studies Epithalamin (a peptide-preparation extract), not necessarily identical to the synthesized Epithalon tetrapeptide alone; melatonin-rhythm normalization is not itself a direct sleep-quality/sleep-architecture outcome.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'No published study of DSIP co-administered with Epithalon (the "Enhanced Sleep Stack" combination itself) was identified during this review. DSIP has small, decades-old human sleep-trial evidence with an explicit author caveat about weak significance (see dsip.mjs); Epithalon-related peptide preparations have human evidence for circadian melatonin-rhythm normalization in the elderly, which is related to but distinct from a direct sleep-quality outcome.',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-1299794-sleepstack', relationship: 'provides_context' },
        { sourceKey: 'pmid-15452611-sleepstack', relationship: 'provides_context' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: 'c7d4429a-cf03-4e68-8690-910461e1b36a',
      legacyStatementExcerpt:
        'The Enhanced Sleep Stack combines DSIP and Epithalon, two compounds commonly investigated for their roles in sleep biology, circadian regulation',
      disposition: 'revised',
      rationale:
        'Each compound individually has some relevant evidence (DSIP: direct sleep trials; Epithalon-related preparations: circadian melatonin rhythm). The claim that this SPECIFIC PAIRING is "commonly investigated" together is not supported — no combination study exists.',
      evidenceQuality: 'low',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-1299794-sleepstack', relationship: 'provides_context' },
        { sourceKey: 'pmid-15452611-sleepstack', relationship: 'provides_context' },
      ],
    },
    {
      legacyClaimId: '90ed80a1-5eac-4a0f-82b2-097a5133db37',
      legacyStatementExcerpt:
        'Although these compounds are frequently discussed together, each has distinct research interests and biological targets',
      disposition: 'supported',
      rationale:
        'Accurately hedged — correctly frames each compound as having distinct, separately-verified research bases rather than claiming joint study.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-1299794-sleepstack', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: '9aa3f681-6288-464a-ba4d-cefce2aaf261',
      legacyStatementExcerpt:
        'Published findings continue to evolve, and conclusions should always be drawn from peer-reviewed scientific literature',
      disposition: 'supported',
      rationale: 'Generic, appropriately cautious statement.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: '2192fdc4-d3ca-4b62-89eb-756174a3ce53',
      legacyStatementExcerpt:
        'Researchers investigate DSIP and Epithalon together because they are associated with different aspects of sleep physiology, circadian biology',
      disposition: 'unsupported',
      rationale: 'No source investigating the two "together" was located.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '8af1671f-8210-490a-933f-17906a7d7840',
      legacyStatementExcerpt:
        'Q: Why are DSIP and Epithalon researched together? A: Researchers study this combination because the compounds are associated with complementary areas',
      disposition: 'revised',
      rationale:
        'A plausible product-design rationale, not evidence the pairing itself has been researched.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    policyReconciliation(
      'feb88845-3a9e-4197-a6e0-f29bfc2bd06e',
      'Q: Does Cloud Peptides recommend this stack? A: No.',
    ),
    policyReconciliation(
      '2af25e40-7362-42cc-ba87-8c00767fc6b7',
      'Q: Does this page provide dosage recommendations? A: No.',
    ),
    policyReconciliation(
      'f72b137f-d95e-431e-a2ae-7b4f698c72ea',
      'Q: Are these products intended for human consumption? A: No.',
    ),
    policyReconciliation(
      '97140913-0fd9-4e64-add6-3e8e1c451583',
      'This page summarizes published scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      '642abd1e-1c9f-42ff-acda-572cc40acc21',
      'Cloud Peptides does not provide medical advice, dosage recommendations, treatment guidance',
    ),
    policyReconciliation(
      'd3aa44a0-70bc-42c1-bd79-1f727ded5265',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
