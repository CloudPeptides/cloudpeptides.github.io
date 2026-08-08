/**
 * Kisspeptin-10 — research enrichment. Sources verified via NCBI
 * E-utilities and ClinicalTrials.gov.
 *
 * Honest coverage note: Kisspeptin-10 has a genuinely strong human RCT
 * evidence base from a dedicated academic research program (Dhillo and
 * colleagues, Imperial College London) — including a notable finding of
 * sexual dimorphism (different reproductive-hormone response in men vs
 * women), directly relevant to any generalized efficacy claim.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'kisspeptin-10',
  sources: [
    {
      key: 'pmid-21976724',
      sourceType: 'pubmed_article',
      title:
        'The effects of kisspeptin-10 on reproductive hormone release show sexual dimorphism in humans.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/21976724/',
      publisherOrAgency: 'The Journal of Clinical Endocrinology & Metabolism',
      publicationDate: '2011-12',
      identifiers: { pmid: '21976724', doi: '10.1210/jc.2011-1408' },
      study: {
        studyDesign: 'rct_human',
        population: 'Healthy men and women',
        intervention: 'Kisspeptin-10, intravenous infusion',
        comparator: 'Placebo/vehicle',
        route: 'Intravenous',
        primaryOutcomes: 'Reproductive hormone (LH/FSH) release',
        resultsSummary:
          'Kisspeptin-10 stimulated reproductive hormone release in both sexes, but the magnitude/pattern of the response showed sexual dimorphism — differing meaningfully between men and women.',
        limitations:
          'Academic single-center research program; findings on sex-based differences mean effects should not be generalized across sexes without qualification.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-36147569',
      sourceType: 'pubmed_article',
      title:
        'Use of kisspeptin to trigger oocyte maturation during in vitro fertilisation (IVF) treatment.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/36147569/',
      publisherOrAgency: '(journal not independently re-confirmed in this review)',
      publicationDate: '2022',
      identifiers: { pmid: '36147569' },
      study: {
        studyDesign: 'rct_human',
        population: 'Women undergoing IVF treatment',
        intervention: 'Kisspeptin, used as an oocyte-maturation trigger',
        resultsSummary:
          'Investigated kisspeptin as an alternative trigger for oocyte maturation during IVF — a specific, real applied-fertility-medicine use case, part of an active academic clinical research program.',
        limitations:
          'Specific to the IVF oocyte-maturation-trigger application; not general evidence for other reproductive-hormone uses.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'nct01667406',
      sourceType: 'clinicaltrials_gov',
      title: 'The Use of the Hormone Kisspeptin in "in Vitro Fertilisation" (IVF) Treatment',
      url: 'https://clinicaltrials.gov/study/NCT01667406',
      identifiers: { nctNumber: 'NCT01667406' },
      study: {
        studyDesign: 'rct_human',
        population: 'Women undergoing IVF',
        intervention: 'Kisspeptin',
        resultsSummary:
          'Registered trial corresponding to the kisspeptin-IVF oocyte-maturation research program (Imperial College London).',
        registrationNumber: 'NCT01667406',
        peerReviewStatus: 'unknown',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'In randomized, placebo-controlled human trials from a dedicated academic reproductive-endocrinology research program (Dhillo and colleagues, Imperial College London), intravenous kisspeptin-10 stimulated reproductive hormone (LH/FSH) release — but the magnitude and pattern of this effect show sexual dimorphism (differ meaningfully between men and women), and kisspeptin has separately been investigated as a trigger for oocyte maturation in women undergoing IVF treatment.',
      evidenceQuality: 'moderate',
      qualityRationale:
        'Randomized, controlled, peer-reviewed human trials from a specialized, sustained academic research program — genuine strength — but concentrated in one research group and covering specific applications (hormone release; IVF oocyte-maturation triggering) rather than broad efficacy across indications.',
      interpretationStatus: 'supported',
      sources: [
        { sourceKey: 'pmid-21976724', relationship: 'directly_supports' },
        { sourceKey: 'pmid-36147569', relationship: 'directly_supports' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: 'bd544301-7b08-421a-84a4-24cefcedab41',
      legacyStatementExcerpt:
        'Kisspeptin-10 is a regulatory peptide investigated for its role in reproductive hormone signaling',
      disposition: 'supported',
      rationale: 'Directly confirmed by a strong, dedicated human research program.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-21976724', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '55a97ce1-83dd-4d99-980f-3ea1b06af825',
      legacyStatementExcerpt:
        'Scientific studies explore Kisspeptin-10 in laboratory models involving fertility biology, reproductive endocrinology, puberty-related signaling',
      disposition: 'revised',
      rationale:
        'Fertility/reproductive-endocrinology evidence is directly confirmed (and unusually strong — real human RCTs, not just "laboratory models"). No puberty-specific human or animal source was independently verified in this review, so that specific sub-claim is not directly supported here.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-21976724', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '958782a2-deaa-47d9-8ba2-c69e7f657800',
      legacyStatementExcerpt:
        'Researchers investigate Kisspeptin-10 for its activation of the kisspeptin receptor (KISS1R), initiating signaling pathways associated with GnRH release',
      disposition: 'supported',
      rationale:
        "Confirmed mechanism, consistent with the verified human trials' downstream LH/FSH-release findings (GnRH being the upstream driver of LH/FSH release).",
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-21976724', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '6e5f87ff-8988-4ae5-a89d-6c0a9665c14d',
      legacyStatementExcerpt:
        'Q: What is Kisspeptin-10 researched for? A: Research commonly focuses on reproductive endocrinology, GnRH signaling, fertility biology',
      disposition: 'supported',
      rationale:
        'Accurately reflects the verified, unusually strong human research base for this compound.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-21976724', relationship: 'directly_supports' }],
    },
    policyReconciliation(
      '380f0273-7351-400a-9dc9-95f0869a361b',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      '26cd231a-d635-4104-b079-5999474c9d93',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      '51403689-c754-4718-91d2-72bb01987210',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    policyReconciliation(
      '98e23631-8567-456f-a85b-cef118099011',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
