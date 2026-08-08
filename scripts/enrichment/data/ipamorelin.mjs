/**
 * Ipamorelin — research enrichment. Sources verified via NCBI
 * E-utilities.
 *
 * Honest coverage note: Ipamorelin has real human pharmacokinetic/
 * pharmacodynamic data and was studied in a registered Phase II human
 * trial for postoperative ileus — but that clinical program (by its
 * original developer) does not appear to have resulted in an approved
 * drug, and no completed-with-results human efficacy publication was
 * identified in this review.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'ipamorelin',
  sources: [
    {
      key: 'pmid-9849822',
      sourceType: 'pubmed_article',
      title: 'Ipamorelin, the first selective growth hormone secretagogue.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/9849822/',
      publisherOrAgency: 'European Journal of Endocrinology',
      publicationDate: '1998-11',
      identifiers: { pmid: '9849822', doi: '10.1530/eje.0.1390552' },
      study: {
        studyDesign: 'animal_study',
        population: 'In vitro and in vivo (rodent/pig) models',
        intervention: 'Ipamorelin (pentapeptide GH secretagogue)',
        resultsSummary: 'Established Ipamorelin as a selective growth hormone secretagogue with high GH-releasing potency and efficacy, with minimal effect on other pituitary hormones (e.g., ACTH/cortisol) compared to earlier, less selective secretagogues.',
        limitations: 'Foundational pharmacology study; animal/in-vitro, not human efficacy.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-10496658',
      sourceType: 'pubmed_article',
      title: 'Pharmacokinetic-pharmacodynamic modeling of ipamorelin, a growth hormone releasing peptide, in human volunteers.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/10496658/',
      publisherOrAgency: 'Pharmaceutical Research',
      publicationDate: '1999-09',
      identifiers: { pmid: '10496658', doi: '10.1023/a:1018955126402' },
      study: {
        studyDesign: 'rct_human',
        population: 'Healthy human volunteers',
        intervention: 'Ipamorelin, intravenous infusion, dose-escalation (5 infusion rates)',
        route: 'Intravenous',
        primaryOutcomes: 'Growth hormone pharmacokinetics/pharmacodynamics',
        resultsSummary: 'Established a PK/PD model for Ipamorelin-stimulated GH release in healthy human volunteers across a dose-escalation design.',
        limitations: 'PK/PD modeling study, not an efficacy/outcome trial; small, healthy-volunteer population.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'nct00672074',
      sourceType: 'clinicaltrials_gov',
      title: 'Safety and Efficacy of Ipamorelin for Management of Post-Operative Ileus',
      url: 'https://clinicaltrials.gov/study/NCT00672074',
      identifiers: { nctNumber: 'NCT00672074' },
      study: {
        studyDesign: 'rct_human',
        population: 'Post-abdominal-surgery patients with ileus',
        intervention: 'Ipamorelin',
        comparator: 'Placebo',
        resultsSummary: 'Phase II, double-blind, placebo-controlled, multiple-dose registered trial (completion date reported as December 2009 in secondary sources); no peer-reviewed results publication was identified in this review.',
        limitations: 'No completed-with-results peer-reviewed publication identified for this trial in this review — its outcome status is unverified here.',
        registrationNumber: 'NCT00672074',
        peerReviewStatus: 'unknown',
      },
    },
    {
      key: 'pmid-19289567',
      sourceType: 'pubmed_article',
      title: 'Efficacy of ipamorelin, a novel ghrelin mimetic, in a rodent model of postoperative ileus.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/19289567/',
      identifiers: { pmid: '19289567' },
      study: {
        studyDesign: 'animal_study',
        population: 'Rodent model of postoperative ileus',
        intervention: 'Ipamorelin',
        resultsSummary: 'A single dose decreased time to first bowel movement; repeated dosing increased fecal pellet output, food intake, and body weight gain versus control — the preclinical basis for the human Phase II ileus trial.',
        limitations: 'Animal model only.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        'Ipamorelin is a pentapeptide that selectively activates the growth hormone secretagogue receptor (ghrelin receptor), stimulating growth hormone release with substantially less effect on other pituitary hormones (e.g., ACTH/cortisol) than earlier-generation, less-selective GH secretagogues.',
      evidenceQuality: 'moderate',
      qualityRationale: 'Foundational peer-reviewed pharmacology, confirmed via human PK/PD modeling.',
      interpretationStatus: 'supported',
      sources: [
        { sourceKey: 'pmid-9849822', relationship: 'directly_supports' },
        { sourceKey: 'pmid-10496658', relationship: 'directly_supports' },
      ],
    },
    {
      contentSection: 'summary',
      statement:
        'Ipamorelin was studied in a registered Phase II human trial for postoperative ileus (built on positive rodent preclinical data), but no completed, peer-reviewed, results-bearing publication for that human trial was identified in this review — its outcome is not established one way or the other from the sources reviewed.',
      interpretationStatus: 'unknown',
      sources: [
        { sourceKey: 'nct00672074', relationship: 'provides_context' },
        { sourceKey: 'pmid-19289567', relationship: 'provides_context' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '3da47e74-73bf-4388-aa38-e3363c4f387e',
      legacyStatementExcerpt: 'Ipamorelin is a synthetic growth hormone secretagogue studied for its selective activity at the ghrelin receptor',
      disposition: 'supported',
      rationale: 'Directly confirmed by the foundational pharmacology and human PK/PD literature.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-9849822', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '19d03edc-c487-41b6-822e-5ce45f07852a',
      legacyStatementExcerpt: 'It is commonly studied in relation to recovery biology, exercise adaptation, body composition, and growth hormone physiology',
      disposition: 'revised',
      rationale: 'GH physiology is directly confirmed. "Recovery biology, exercise adaptation, body composition" are not measured outcomes in the human trials identified in this review (which measured hormone PK/PD and, separately, postoperative-ileus outcomes) — these broader claims are not independently verified here.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-10496658', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'ea575189-1305-46bf-b599-78b50bdccb81',
      legacyStatementExcerpt: 'Ipamorelin activates the growth hormone secretagogue receptor, also known as the ghrelin receptor',
      disposition: 'supported',
      rationale: 'Directly confirmed.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-9849822', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '15c28b8d-81f8-4105-9106-49b47ad495ab',
      legacyStatementExcerpt: 'Q: Is Ipamorelin a growth hormone? A: No. Ipamorelin is a growth hormone secretagogue',
      disposition: 'supported',
      rationale: 'Accurate and confirmed.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-9849822', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'e55abbf1-5490-4b5c-9335-f986682ebec2',
      legacyStatementExcerpt: 'Q: What receptor does Ipamorelin target? A: Ipamorelin is commonly studied for activity at the growth hormone secretagogue receptor',
      disposition: 'supported',
      rationale: 'Confirmed.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-9849822', relationship: 'directly_supports' }],
    },
    policyReconciliation('f1af1a41-a794-4ed0-9f01-c798a2552301', 'Q: Does this page provide dosage information? A: No.'),
    policyReconciliation('72af1b2d-fbd6-42de-bf25-6b233b012b1d', 'This page summarizes publicly available scientific literature for educational purposes only.'),
    policyReconciliation('3f300630-42b7-4148-8a1b-4fa1b4775a2e', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    policyReconciliation('a1b45169-3822-4ad9-8b4b-249987c8c06d', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
