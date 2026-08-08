/**
 * Epithalon (Epitalon, AEDG tetrapeptide) — research enrichment. Sources
 * verified via NCBI E-utilities.
 *
 * Honest coverage note: Epithalon has real human evidence, unusual for
 * this database — but it comes from a single, long-running research
 * program (Khavinson and colleagues) using a related preparation
 * (Epithalamin, a bovine pineal peptide extract Epithalon's synthetic
 * AEDG sequence was derived from) more often than the synthesized
 * tetrapeptide alone. This distinction is preserved, not blurred.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'epithalon-compound',
  sources: [
    {
      key: 'pmid-22451889',
      sourceType: 'pubmed_article',
      title:
        'Peptide geroprotector from the pituitary gland inhibits rapid aging of elderly people: results of 15-year follow-up.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/22451889/',
      publisherOrAgency: 'Bulletin of Experimental Biology and Medicine',
      publicationDate: '2011-07',
      identifiers: { pmid: '22451889', doi: '10.1007/s10517-011-1332-x' },
      study: {
        studyDesign: 'human_observational',
        population: 'Elderly people, 15-year follow-up',
        intervention:
          'Peptide geroprotector (pituitary-gland-derived preparation, from the same Khavinson research program)',
        resultsSummary: 'Reported reduced markers of "rapid aging" over 15-year follow-up.',
        limitations:
          "Concerns a pituitary-derived peptide preparation, not Epithalon's own pineal-derived AEDG tetrapeptide specifically; long-term observational design (not described as randomized/blinded in the abstract reviewed); same research group/institute as most Epithalon-adjacent literature, without independent outside replication identified in this review.",
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-15452611',
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
          "Epithalamin (bovine pineal peptide extract; Epithalon's AEDG sequence was derived from this preparation)",
        resultsSummary:
          'A course of Epithalamin normalized/increased nighttime plasma melatonin concentration in subjects with initially reduced pineal activity.',
        limitations:
          'Studies Epithalamin (an extract/preparation), not confirmed identical to the synthesized four-amino-acid Epithalon alone; same research group.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-8010617',
      sourceType: 'pubmed_article',
      title:
        'Twenty years of study on effects of pineal peptide preparation: epithalamin in experimental gerontology and oncology.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/8010617/',
      publisherOrAgency: 'Annals of the New York Academy of Sciences',
      publicationDate: '1994-05-31',
      identifiers: { pmid: '8010617', doi: '10.1111/j.1749-6632.1994.tb56853.x' },
      study: {
        studyDesign: 'narrative_review',
        resultsSummary:
          "20-year review of the research group's own experimental gerontology and oncology (animal + some human) findings on Epithalamin.",
        limitations:
          "Narrative review by the compound-preparation's own developers — self-review, not independent; animal findings should not be read as human efficacy.",
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-40141333',
      sourceType: 'pubmed_article',
      title: 'Overview of Epitalon-Highly Bioactive Pineal Tetrapeptide with Promising Properties.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/40141333/',
      publisherOrAgency: 'International Journal of Molecular Sciences',
      publicationDate: '2025-03-17',
      identifiers: { pmid: '40141333', doi: '10.3390/ijms26062691' },
      study: {
        studyDesign: 'narrative_review',
        resultsSummary:
          'Recent (2025), independent (non-Khavinson-group) narrative review summarizing proposed antioxidant, neuroprotective, antimutagenic, and geroprotective mechanisms of Epitalon, drawing on the existing (mostly animal/observational) literature.',
        limitations:
          'Narrative, not systematic review; summarizes rather than independently replicates the underlying primary evidence.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'Human evidence for Epithalon comes primarily from a single, long-running Russian research program (Khavinson and colleagues), which reported that a course of the related pineal peptide preparation Epithalamin normalized nighttime melatonin secretion in elderly people with reduced pineal function, and that a related pituitary-derived geroprotector peptide was associated with reduced markers of "rapid aging" over 15-year observational follow-up. This evidence largely concerns Epithalamin (a peptide extract/preparation), not confirmed identical to the isolated synthetic Epithalon tetrapeptide sold commercially, and has not been independently replicated by an unaffiliated research group as of this review.',
      evidenceQuality: 'low',
      qualityRationale:
        'Human observational/small-trial evidence exists (unusual for this database), but from a single research program without independent outside replication identified, and concerning a related preparation rather than confirmed to be the isolated tetrapeptide itself.',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-22451889', relationship: 'directly_supports' },
        { sourceKey: 'pmid-15452611', relationship: 'directly_supports' },
      ],
    },
    {
      contentSection: 'mechanism',
      statement:
        "Epithalon's proposed mechanisms — antioxidant, neuroprotective, antimutagenic, and telomerase-related geroprotective effects — are summarized in a recent (2025) independent narrative review, which itself draws primarily on the same research program's animal and observational findings rather than presenting new independent primary data.",
      evidenceQuality: 'low',
      qualityRationale:
        'Narrative (non-systematic) review; underlying primary evidence is largely from one research group.',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-40141333', relationship: 'provides_context' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: 'b457c685-79b3-4d96-896f-552376bb1414',
      legacyStatementExcerpt:
        'Epithalon is a synthetic tetrapeptide commonly investigated in longevity and healthy aging research',
      disposition: 'supported',
      rationale:
        'Confirmed research focus, though the strongest human evidence concerns the related Epithalamin preparation rather than confirmed-identical isolated Epithalon — noted in the new summary claim.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-15452611', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '706d6849-32c9-442f-acf3-db55cac85f05',
      legacyStatementExcerpt:
        'Researchers continue to study Epithalon in laboratory settings to better understand peptide signaling pathways',
      disposition: 'supported',
      rationale: 'Consistent with the verified (ongoing, including a 2025 review) research base.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-40141333', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: '573cf7f9-39d1-4997-a4d3-2888c4cad839',
      legacyStatementExcerpt:
        'Epithalon is investigated for its potential influence on regulatory pathways involved in pineal function, circadian signaling, and cellular aging',
      disposition: 'supported',
      rationale: 'Directly confirmed by the melatonin-rhythm-normalization finding.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-15452611', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'bd86483f-717a-4514-a78a-9e81bc7916f9',
      legacyStatementExcerpt:
        'Q: What is Epithalon researched for? A: Research commonly focuses on healthy aging, pineal gland biology, circadian rhythm, melatonin signaling',
      disposition: 'supported',
      rationale: 'Accurately reflects the verified research focus.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-15452611', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '6a8aec28-0b98-4472-85ee-52becc350eb4',
      legacyStatementExcerpt:
        'Q: Is Epithalon a standalone peptide? A: Yes. Epithalon is a standalone tetrapeptide',
      disposition: 'revised',
      rationale:
        'Chemically accurate (Epithalon/Epitalon is a defined AEDG tetrapeptide), but most of the human evidence identified in this review concerns Epithalamin (a peptide-extract preparation), not confirmed to be pharmacologically identical to the isolated tetrapeptide — this distinction should be surfaced to avoid overstating what the human evidence actually covers.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-8010617', relationship: 'provides_context' }],
    },
    policyReconciliation(
      'c29316c1-3272-473f-8681-30c9c3c10bcd',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      '53bd7c76-52ae-40df-8ca2-2cfc0b844773',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      'c6bef697-987d-477f-9b36-cb3396ee9546',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    policyReconciliation(
      'b5882374-ae4a-47d2-a65a-e76f8242e17c',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
