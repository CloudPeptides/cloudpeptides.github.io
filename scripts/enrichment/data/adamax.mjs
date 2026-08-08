/**
 * Adamax — research enrichment. NO independent peer-reviewed literature
 * was identified for this compound during this review.
 *
 * Extensive searching (PubMed/NCBI E-utilities, ClinicalTrials.gov,
 * general web search restricted to ncbi.nlm.nih.gov and pubmed.ncbi.nlm.nih.gov)
 * found zero primary studies, zero registered trials, and zero regulatory
 * records for "Adamax" as a named compound. The only content describing
 * it — an adamantane-modified Semax analogue (Ac-MEHFPGPAG-NH2 /
 * Ac-Met-Glu-His-Phe-Pro-Gly-Pro-Ala-Gly-NH2) — appears exclusively on
 * commercial research-chemical vendor pages (excluded as evidence per
 * project sourcing policy: vendor/affiliate pages are not primary
 * scientific sources). This is a materially different situation from
 * Semax itself, which has a real, decades-deep peer-reviewed literature
 * (see scripts/enrichment/data/semax.mjs).
 *
 * Per CLAUDE.md ("never invent claims... preserve unknown or ambiguous
 * content rather than guessing"), no sources or claims are added here.
 * Every pre-existing legacy claim is reconciled as 'unsupported' — not
 * because it is known to be false, but because no independent
 * verification could be found. This compound is flagged in the batch
 * report as requiring editorial/expert review before any further
 * content work (e.g. confirming with a chemistry reference whether the
 * described structure has ever been independently characterized or
 * studied under any other name).
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
export default {
  slug: 'adamax',
  sources: [],
  claims: [],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '6e4d170c-b253-4f93-927e-8a3e669a1aa9',
      legacyStatementExcerpt:
        'Adamax is a synthetic peptide investigated in cognitive and neurological research',
      disposition: 'unsupported',
      rationale:
        'No independent peer-reviewed publication, registered clinical/preclinical trial, or regulatory record referencing "Adamax" was located via PubMed/NCBI E-utilities or ClinicalTrials.gov during this review. The only descriptions found were on commercial vendor pages, which are excluded as evidence per this project\'s sourcing policy. This does not establish the statement is false — only that it is currently unverified by any authoritative primary source.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: 'f7ef75c9-4443-4829-8950-e9a87d7ee32a',
      legacyStatementExcerpt:
        'Researchers continue to examine Adamax in laboratory models involving learning, memory',
      disposition: 'unsupported',
      rationale:
        'Same finding as above — no independently verifiable primary research located for this named compound.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: 'c51334fd-524b-4283-8d94-9e336da54fec',
      legacyStatementExcerpt:
        'Adamax is studied for its potential influence on neurotrophic signaling and regulatory peptide pathways',
      disposition: 'unsupported',
      rationale:
        'No independently verifiable primary research located for this named compound during this review; the mechanistic claim cannot currently be traced to any authoritative source.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: 'f9b4fa77-ac83-4ff8-b2ad-9560c0de5b4a',
      legacyStatementExcerpt:
        'Q: What is Adamax researched for? A: Research commonly focuses on cognitive biology',
      disposition: 'unsupported',
      rationale: 'Same finding — no independently verifiable primary research located.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '52b6641f-3346-4381-8ae3-5726a61e2872',
      legacyStatementExcerpt:
        'Q: Is Adamax related to Semax? A: Adamax is often discussed within the same broader category',
      disposition: 'unsupported',
      rationale:
        'The claimed structural relationship to Semax (an adamantane-modified Semax analogue) appears only on commercial vendor pages, not in any independently verifiable source. The statement is appropriately hedged ("should be treated as a distinct research compound") but the underlying structural claim itself is unverified in this review.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: 'ff251615-f6e4-45ca-bbfb-14895c3ec2b0',
      legacyStatementExcerpt: 'Q: Does Cloud Peptides provide dosage information? A: No.',
      disposition: 'supported',
      rationale:
        'Site-policy statement, not a scientific claim; true by direct inspection of site policy.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: '1618f37a-8572-4272-9199-839eff725ed0',
      legacyStatementExcerpt:
        'This page summarizes publicly available scientific literature for educational purposes only.',
      disposition: 'unsupported',
      rationale:
        'This claim asserts the page summarizes "publicly available scientific literature" — but no such literature was found to exist for this specific named compound during this review, so the premise of the statement itself is not currently verifiable. Flagged distinctly from the pure site-policy claims below.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '61e15944-2743-4294-8713-86f9bd975d26',
      legacyStatementExcerpt:
        'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
      disposition: 'supported',
      rationale:
        'Site-policy statement, not a scientific claim; true by direct inspection of site policy.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: '3a80e04f-0f65-46d7-9466-4ff8b34031df',
      legacyStatementExcerpt:
        'All products are intended strictly for laboratory research purposes only',
      disposition: 'supported',
      rationale:
        'Site-policy statement, not a scientific claim; true by direct inspection of site policy.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
  ],
};
