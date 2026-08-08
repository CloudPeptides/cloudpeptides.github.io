/**
 * ARA-290 (cibinetide) — research enrichment. Sources verified via NCBI
 * E-utilities and ClinicalTrials.gov.
 *
 * Honest coverage note: ARA-290 has real published human RCT evidence
 * (unusual among the compounds in this database) — two positive,
 * randomized, double-blind, placebo-controlled pilot trials in
 * sarcoidosis-associated small fiber neuropathy. Both are small pilot
 * studies from the developing company's own research network, not
 * independently replicated by an unaffiliated group as of this review.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'ara-290',
  sources: [
    {
      key: 'pmid-23168581',
      sourceType: 'pubmed_article',
      title: 'Safety and efficacy of ARA 290 in sarcoidosis patients with symptoms of small fiber neuropathy: a randomized, double-blind pilot study.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/23168581/',
      publisherOrAgency: 'Molecular Medicine',
      publicationDate: '2012-11-15',
      identifiers: { pmid: '23168581', doi: '10.2119/molmed.2012.00332' },
      study: {
        studyDesign: 'rct_human',
        population: 'Adults with sarcoidosis and symptoms of small fiber neuropathy',
        sampleSize: 22,
        intervention: 'ARA 290, 2 mg intravenous, 3x weekly for 4 weeks',
        comparator: 'Placebo',
        route: 'Intravenous',
        duration: '4 weeks treatment',
        primaryOutcomes: 'Neuropathic pain/symptom scores; safety and tolerability',
        resultsSummary: '28 days of ARA 290 dosing significantly improved neuropathic symptoms versus placebo in patients with documented small nerve fiber loss.',
        limitations: 'Small pilot trial (n=22); single-center-adjacent, sponsor-affiliated (Araim Pharmaceuticals) research network.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-24136731',
      sourceType: 'pubmed_article',
      title: 'ARA 290 improves symptoms in patients with sarcoidosis-associated small nerve fiber loss and increases corneal nerve fiber density.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/24136731/',
      publisherOrAgency: 'Molecular Medicine',
      publicationDate: '2013-11-08',
      identifiers: { pmid: '24136731', doi: '10.2119/molmed.2013.00122' },
      study: {
        studyDesign: 'rct_human',
        population: 'Adults with sarcoidosis-associated small nerve fiber loss',
        intervention: 'ARA 290, subcutaneous, daily',
        comparator: 'Placebo',
        route: 'Subcutaneous',
        primaryOutcomes: 'Neuropathic symptom scores; corneal nerve fiber density (objective imaging measure)',
        resultsSummary: 'ARA 290 improved neuropathic symptoms and increased corneal nerve fiber density (an objective, imaging-based measure of small-fiber regeneration) versus placebo.',
        limitations: 'Same sponsor-affiliated research network as the 2012 pilot; small sample.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'nct02039687',
      sourceType: 'clinicaltrials_gov',
      title: 'Study of Efficacy of ARA 290 on Corneal Nerve Fiber Density and Neuropathic Symptoms of Subjects With Sarcoidosis',
      url: 'https://clinicaltrials.gov/study/NCT02039687',
      identifiers: { nctNumber: 'NCT02039687' },
      study: {
        studyDesign: 'rct_human',
        population: 'Adults with sarcoidosis',
        intervention: 'ARA 290',
        resultsSummary: 'Registration record corresponding to the corneal nerve fiber density trial (pmid-24136731).',
        registrationNumber: 'NCT02039687',
        peerReviewStatus: 'unknown',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'In two small, randomized, double-blind, placebo-controlled pilot trials (combined n≈22+, sponsor-affiliated research network), ARA-290 improved neuropathic symptoms in sarcoidosis patients with small fiber neuropathy, and in the second trial also increased corneal nerve fiber density — an objective imaging measure of small-fiber regeneration — versus placebo.',
      evidenceQuality: 'low',
      qualityRationale: 'Randomized, double-blind, placebo-controlled design (a real strength), but small sample sizes and a single, sponsor-affiliated research network — not yet independently replicated by an unaffiliated group as of this review.',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-23168581', relationship: 'directly_supports' },
        { sourceKey: 'pmid-24136731', relationship: 'directly_supports' },
      ],
    },
    {
      contentSection: 'mechanism',
      statement:
        'ARA-290 is a synthetic peptide engineered from the tertiary structure of erythropoietin, designed to activate the innate repair receptor (IRR) — proposed to mediate tissue-protective and anti-inflammatory signaling without erythropoietin\'s blood-cell-stimulating (erythropoietic) activity.',
      evidenceQuality: 'moderate',
      qualityRationale: 'Consistent mechanistic rationale described across the clinical publications; this specific mechanistic claim was not independently re-verified against a dedicated in-vitro/receptor-binding source in this review.',
      interpretationStatus: 'supported',
      sources: [
        { sourceKey: 'pmid-23168581', relationship: 'provides_context' },
        { sourceKey: 'pmid-24136731', relationship: 'provides_context' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: 'c7413938-aa65-40f3-9209-1beb6e9cac5a',
      legacyStatementExcerpt: 'ARA-290 is a synthetic peptide engineered from erythropoietin-related research',
      disposition: 'supported',
      rationale: 'Confirmed structural/design description and correctly notes it lacks erythropoietin\'s erythropoietic activity, consistent with verified sources.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-23168581', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: 'eead9c28-2a13-4a6b-8cf9-a274f25d45d9',
      legacyStatementExcerpt: 'Published research has explored ARA-290 in laboratory models involving neurologic biology, inflammation-related pathways, tissue repair, and microvascular function',
      disposition: 'revised',
      rationale:
        'ARA-290\'s strongest verified evidence is actually human clinical trial data (two RCTs in sarcoidosis-associated small fiber neuropathy), not only "laboratory models" as this statement implies — the legacy text understates the evidence level available. Corrected/expanded in the new summary claim above.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-23168581', relationship: 'directly_supports' },
        { sourceKey: 'pmid-24136731', relationship: 'directly_supports' },
      ],
    },
    {
      legacyClaimId: '4bbaa513-911d-4238-842e-d4a9dd595099',
      legacyStatementExcerpt: 'Researchers study ARA-290 for its interaction with the innate repair receptor (IRR) pathway',
      disposition: 'supported',
      rationale: 'Confirmed IRR-pathway mechanism, consistent with the clinical publications reviewed.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-24136731', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: '146f008d-4435-4be4-9e71-de770e345fe7',
      legacyStatementExcerpt: 'Q: Is ARA-290 erythropoietin? A: No. ARA-290 is a distinct synthetic peptide derived from erythropoietin research',
      disposition: 'supported',
      rationale: 'Accurate and consistent with verified sources.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-23168581', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: '7280d1ca-2fe2-49fa-ac29-d6b5a4d4f686',
      legacyStatementExcerpt: 'Q: What is ARA-290 researched for? A: Current research investigates tissue protection',
      disposition: 'supported',
      rationale: 'Accurately summarizes the verified research focus (tissue protection, inflammation-related pathways, nerve biology) though "regenerative processes" is broader than what the clinical trials directly measured (symptom scores and corneal nerve fiber density specifically).',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-23168581', relationship: 'directly_supports' },
        { sourceKey: 'pmid-24136731', relationship: 'directly_supports' },
      ],
    },
    policyReconciliation('3ed22dd8-ed7a-47db-8b08-4126c6f90735', 'Q: Does Cloud Peptides provide dosage information? A: No.'),
    policyReconciliation('95987054-397a-442c-b81c-d6f3bd29f64f', 'This page summarizes publicly available scientific literature for educational purposes only.'),
    policyReconciliation('63ba90e2-ba02-41ea-9773-3c6f21e99e0a', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    policyReconciliation('5fdbc1c0-cd73-42b4-a19c-9d1264e10292', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
