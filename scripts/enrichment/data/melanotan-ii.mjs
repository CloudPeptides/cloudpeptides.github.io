/**
 * Melanotan II — research enrichment. Sources verified via NCBI
 * E-utilities.
 *
 * IMPORTANT finding: unlike Melanotan I/afamelanotide, Melanotan II has
 * NO FDA or equivalent approval for any indication, and has a real,
 * multi-report human safety literature describing serious adverse
 * events from non-medical/self-administered use: priapism (including
 * overdose-associated cases), systemic toxicity with rhabdomyolysis,
 * and multiple case reports of new/changing melanocytic lesions and
 * melanoma temporally associated with use. These are represented
 * directly, not summarized away.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'melanotan-ii',
  sources: [
    {
      key: 'pmid-23537392',
      sourceType: 'pubmed_article',
      title: 'Melanotan II overdose associated with priapism.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/23537392/',
      publisherOrAgency: 'Clinical Toxicology',
      publicationDate: '2013-05',
      identifiers: { pmid: '23537392', doi: '10.3109/15563650.2013.784775' },
      study: {
        studyDesign: 'case_report_or_series',
        population: 'Human case report',
        intervention: 'Self-administered Melanotan II (overdose)',
        resultsSummary: 'Reported priapism following Melanotan II overdose.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-23121206',
      sourceType: 'pubmed_article',
      title: 'Melanotan II injection resulting in systemic toxicity and rhabdomyolysis.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/23121206/',
      publisherOrAgency: 'Clinical Toxicology',
      publicationDate: '2012-12',
      identifiers: { pmid: '23121206', doi: '10.3109/15563650.2012.740637' },
      study: {
        studyDesign: 'case_report_or_series',
        population: 'Human case report',
        intervention: 'Self-administered Melanotan II injection',
        resultsSummary:
          'Reported systemic toxicity and rhabdomyolysis following Melanotan II injection.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-24355990',
      sourceType: 'pubmed_article',
      title: 'Melanoma associated with the use of melanotan-II.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/24355990/',
      publisherOrAgency: 'Dermatology',
      publicationDate: '2014',
      identifiers: { pmid: '24355990', doi: '10.1159/000356389' },
      study: {
        studyDesign: 'case_report_or_series',
        population: 'Human case report(s)',
        intervention: 'Self-administered Melanotan II',
        resultsSummary: 'Reported melanoma temporally associated with Melanotan II use.',
        limitations:
          'Case report(s) — establishes temporal association, not proven causation; melanoma has multifactorial causes including UV exposure, which is often co-occurring in melanotan users seeking a tan.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'safety',
      statement:
        'Multiple independent published case reports describe serious adverse events temporally associated with Melanotan II use in humans (via unregulated, self-administered/non-medical channels, not a clinical trial context): priapism (including an overdose-associated case), systemic toxicity with rhabdomyolysis, and new or changing melanocytic lesions/melanoma. These are real, published safety signals — not established causation from controlled trials, but genuine cause for caution, and are not omitted or downplayed here.',
      evidenceQuality: 'low',
      qualityRationale:
        'Case reports (not controlled trials) — cannot establish causation with the rigor of a randomized trial, but multiple independent reports of serious, mechanistically plausible adverse events (melanocortin-receptor activation driving both priapism via central pathways and melanocyte proliferation) constitute a real safety signal that should not be dismissed as "no evidence."',
      interpretationStatus: 'conflicting',
      sources: [
        { sourceKey: 'pmid-23537392', relationship: 'directly_supports' },
        { sourceKey: 'pmid-23121206', relationship: 'directly_supports' },
        { sourceKey: 'pmid-24355990', relationship: 'directly_supports' },
      ],
    },
    {
      contentSection: 'regulatory',
      statement:
        'Unlike Melanotan I (afamelanotide/Scenesse), Melanotan II has NO FDA or equivalent regulatory approval for any indication, including cosmetic tanning. It is sold and used almost exclusively via unregulated, non-medical channels — the context in which the serious adverse events documented above occurred.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-23537392', relationship: 'provides_context' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: 'f162e7a9-7401-408c-9715-7b8fd8738712',
      legacyStatementExcerpt:
        'Melanotan II is a synthetic analog of α-melanocyte stimulating hormone (α-MSH) investigated for its interaction with melanocortin receptors',
      disposition: 'revised',
      rationale:
        'The mechanistic description is accurate, but the claim that it is merely "investigated" and "widely used" omits the most consequential fact this review found: real, published human case reports of serious adverse events (priapism, rhabdomyolysis, melanoma) from actual use, and the complete absence of any regulatory approval. This is a significant safety-relevant omission, corrected via the new safety claim above.',
      evidenceQuality: 'low',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'pmid-23537392', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '3270270d-4c02-4d0d-9d19-ad8cffcfb4bd',
      legacyStatementExcerpt:
        'Scientific literature investigates receptor activation, skin pigmentation biology, UV-response pathways, and broader melanocortin receptor function',
      disposition: 'revised',
      rationale:
        "Accurate as far as mechanistic research goes, but again omits the real human safety case-report literature that is a defining feature of this specific compound's evidence base.",
      evidenceQuality: 'low',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'pmid-24355990', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'c6a5536b-1812-407b-9917-44ef290d18ef',
      legacyStatementExcerpt:
        'Researchers investigate Melanotan II for activation of melanocortin receptors, particularly MC1R and MC4R',
      disposition: 'supported',
      rationale:
        'Mechanistically accurate — MC4R activation is the proposed mechanism for the priapism cases specifically.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-23537392', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: 'a161a38f-7fee-4935-a92c-af2d582c313d',
      legacyStatementExcerpt:
        'Q: How is Melanotan II different from Melanotan I? A: Although both are melanocortin analogs, they differ in receptor activity',
      disposition: 'revised',
      rationale:
        'Accurate but understates the difference: Melanotan I\'s FDA-approved form has controlled clinical use with a defined safety profile; Melanotan II has no approval and a real published case-report literature of serious adverse events from unregulated use. This is a materially more important distinction than "differ in receptor activity" conveys.',
      evidenceQuality: 'low',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'pmid-23537392', relationship: 'directly_supports' }],
    },
    policyReconciliation(
      '87c1c2ab-f7d5-4303-9491-f1bcca582f79',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      '7de3f9e5-bf82-4bb9-9c89-10464f0d57c5',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      '6115cb3a-63c1-47d3-8710-7c7e9544ab07',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    policyReconciliation(
      '91398296-d957-4ecf-bb9e-ad5637ec68a0',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
