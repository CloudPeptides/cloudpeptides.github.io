/**
 * DSIP (Delta Sleep-Inducing Peptide) — research enrichment. Sources
 * verified via NCBI E-utilities.
 *
 * Honest coverage note: DSIP has genuine human trial evidence dating
 * from the 1980s-90s — but the effect sizes are small and one of the
 * clinical-efficacy studies explicitly cautions that its own results
 * "could partly be due to incidental changes in the placebo group" and
 * that short-term treatment is "not likely to be of major therapeutic
 * benefit." This caveat is preserved, not smoothed over.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'dsip',
  sources: [
    {
      key: 'pmid-6895513',
      sourceType: 'pubmed_article',
      title:
        'Acute and delayed effects of DSIP (delta sleep-inducing peptide) on human sleep behavior.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/6895513/',
      publisherOrAgency: 'International Journal of Clinical Pharmacology, Therapy, and Toxicology',
      publicationDate: '1981-08',
      identifiers: { pmid: '6895513' },
      study: {
        studyDesign: 'rct_human',
        population: 'Healthy normal volunteers (n=6)',
        sampleSize: 6,
        intervention: 'Synthetic DSIP, slow intravenous infusion, 25 nmol/kg',
        comparator: 'Placebo',
        route: 'Intravenous',
        resultsSummary:
          "Acute infusion increased subjective sleep pressure/sleepiness by 59% within 130 minutes versus placebo; delayed effects on the following night's sleep included shorter sleep onset, reduced stage-1 sleep, and better sleep efficiency. Detailed EEG/behavioral analysis found no classic pharmacologic sedation.",
        limitations:
          'Very small sample (n=6); acute IV administration, not representative of any commercial oral/subcutaneous use.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-1299794',
      sourceType: 'pubmed_article',
      title:
        'Effects of delta sleep-inducing peptide on sleep of chronic insomniac patients. A double-blind study.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/1299794/',
      publisherOrAgency: 'Neuropsychobiology',
      publicationDate: '1992',
      identifiers: { pmid: '1299794', doi: '10.1159/000118919' },
      study: {
        studyDesign: 'rct_human',
        population: 'Chronic insomniac patients (n=16)',
        sampleSize: 16,
        intervention: 'DSIP, intravenous, 25 nmol/kg body weight',
        comparator: 'Placebo',
        route: 'Intravenous',
        resultsSummary:
          'Higher sleep efficiency and shorter sleep latency with DSIP versus placebo, but the authors explicitly caution the statistically significant effects were weak and could partly be due to incidental changes in the placebo group; short-term DSIP treatment is "not likely to be of major therapeutic benefit."',
        limitations:
          "Small sample (n=16); authors' own stated caveat about weak/uncertain significance is preserved rather than omitted.",
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-7028502',
      sourceType: 'pubmed_article',
      title:
        'The influence of synthetic DSIP (delta-sleep-inducing-peptide) on disturbed human sleep.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/7028502/',
      publisherOrAgency: 'Experientia',
      publicationDate: '1981',
      identifiers: { pmid: '7028502', doi: '10.1007/BF01971753' },
      study: {
        studyDesign: 'rct_human',
        population: 'Middle-aged chronic insomniac patients (n=6)',
        sampleSize: 6,
        intervention: 'Synthetic DSIP, acute intravenous administration, 25 nmol/kg',
        route: 'Intravenous',
        resultsSummary:
          'Longer sleep duration and higher-quality sleep with fewer interruptions, and slightly more REM sleep, with no daytime sedation or reported side effects.',
        limitations: 'Very small sample (n=6); acute single-dose IV administration only.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'In small human trials from the 1980s-90s (intravenous administration, n=6-16 per study), DSIP produced modest improvements in sleep parameters (sleep latency, sleep efficiency, subjective sleepiness) versus placebo. One of these trials explicitly cautioned that its statistically significant findings were weak and could be partly attributable to incidental placebo-group changes, and concluded short-term DSIP treatment is unlikely to be of major therapeutic benefit.',
      evidenceQuality: 'low',
      qualityRationale:
        "Randomized, placebo-controlled design (a genuine strength) but very small samples, decades-old trials, intravenous route not representative of commercial use, and the authors' own explicit caution about the strength/reliability of their positive findings.",
      interpretationStatus: 'conflicting',
      sources: [
        { sourceKey: 'pmid-6895513', relationship: 'directly_supports' },
        { sourceKey: 'pmid-1299794', relationship: 'directly_supports' },
        { sourceKey: 'pmid-7028502', relationship: 'directly_supports' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: 'fcb34113-2556-4dc6-aec9-3dedbd1f828b',
      legacyStatementExcerpt:
        'DSIP is a regulatory peptide investigated in sleep and neuroendocrine research',
      disposition: 'supported',
      rationale:
        'Confirmed — DSIP has real human trial evidence in sleep research, unusual among the peptides in this database for having decades-old human data.',
      evidenceQuality: 'low',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'pmid-1299794', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'c11380b6-a9cf-4124-af00-6da3a74fc479',
      legacyStatementExcerpt:
        'Laboratory research continues to explore DSIP in models involving restorative physiology, neuropeptide regulation, and behavioral neuroscience',
      disposition: 'revised',
      rationale:
        'DSIP\'s human sleep trials date from the 1980s-90s; this review found no evidence of substantial ongoing ("continues to explore") active research since — represented here as historical rather than ongoing.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-6895513', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: 'a9b939c2-9823-4e02-8ceb-5987eeb51fd2',
      legacyStatementExcerpt:
        'Researchers investigate DSIP for its potential influence on neuroendocrine pathways associated with sleep regulation',
      disposition: 'supported',
      rationale: 'Consistent with the verified human sleep-effect literature.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-7028502', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '4cf32bfe-3a64-457b-a5d0-b0515fe7d33a',
      legacyStatementExcerpt:
        'Q: What is DSIP researched for? A: Research commonly focuses on sleep biology, circadian rhythm, stress-response pathways',
      disposition: 'supported',
      rationale:
        'Accurately reflects the actual (older) research base, though "circadian rhythm" and "stress-response pathways" specifically were not directly measured in the verified sleep trials — this review verified sleep-parameter outcomes specifically.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-1299794', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '54d9f6c8-45f8-47a4-a1a1-dbd904eb75c1',
      legacyStatementExcerpt: 'Q: Does DSIP stand for Delta Sleep-Inducing Peptide? A: Yes.',
      disposition: 'supported',
      rationale: 'Confirmed by all verified sources, which uniformly use this name.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-6895513', relationship: 'directly_supports' }],
    },
    policyReconciliation(
      'd3935dfe-0c99-4a37-9e64-a72df07a0959',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      '3fe613b5-a7b5-4a9d-bd86-d11efc018d78',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      'afa96b28-e6db-4a2e-a25b-f52ffce5132e',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    policyReconciliation(
      '9add4a7b-3435-4909-bbf8-224bef2c1094',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
