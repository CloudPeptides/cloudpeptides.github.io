/**
 * PE-22-28 — research enrichment. Source verified via NCBI E-utilities.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'pe-22-28',
  sources: [
    {
      key: 'pmid-28955242',
      sourceType: 'pubmed_article',
      title: 'Shortened Spadin Analogs Display Better TREK-1 Inhibition, In Vivo Stability and Antidepressant Activity.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/28955242/',
      publisherOrAgency: 'Frontiers in Pharmacology',
      publicationDate: '2017',
      identifiers: { pmid: '28955242', doi: '10.3389/fphar.2017.00643' },
      study: {
        studyDesign: 'animal_study',
        population: 'Mice; in vitro hTREK-1/HEK cell patch-clamp',
        intervention: 'PE-22-28 (a shortened, optimized analog of spadin, a sortilin-derived peptide)',
        comparator: 'Spadin (parent peptide)',
        resultsSummary:
          'PE-22-28 showed markedly better TREK-1 potassium channel inhibition than spadin (IC50 0.12 nM vs 40-60 nM for spadin — roughly 300-fold more potent), improved in vivo stability, and antidepressant-like activity in the forced swimming test (reduced immobility time) in mice.',
        limitations: 'Animal/in-vitro study only; no human trial identified in this review. TREK-1-based antidepressant mechanisms have not, to this review\'s knowledge, been validated in human trials for any compound in this class.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        'PE-22-28 is a shortened, optimized analog of spadin (a sortilin-derived peptide) that potently inhibits the TREK-1 two-pore potassium channel (IC50 ~0.12 nM, ~300-fold more potent than the parent spadin peptide) and showed antidepressant-like activity (reduced immobility in the forced swimming test) in mice.',
      evidenceQuality: 'moderate',
      qualityRationale: 'Peer-reviewed animal/in-vitro pharmacology study with a clear, quantified potency improvement over its parent compound — genuine strength — but animal-only, no human trial identified.',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-28955242', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '36b7708e-0ee4-4f0a-9d1d-da77b5cb1e23',
      legacyStatementExcerpt: 'PE-22-28 is a synthetic peptide investigated in neurological and behavioral research',
      disposition: 'supported',
      rationale: 'Confirmed by real, peer-reviewed pharmacology and behavioral (forced swimming test) research.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-28955242', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'a71f9129-2bb5-45f4-a6b8-0623eb5c8b85',
      legacyStatementExcerpt: 'Researchers continue to study PE-22-28 in experimental models involving peptide-mediated regulation, behavior, cognition, and neural communication',
      disposition: 'revised',
      rationale: 'Behavioral (mood/depression-model) research is directly confirmed. "Cognition" specifically was not verified as a separate studied outcome in the source identified — the verified research is specifically antidepressant-behavior-focused (TREK-1/forced swimming test), not general cognition.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-28955242', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '92ab222d-65ce-4332-aaac-9159b45ffeb1',
      legacyStatementExcerpt: 'PE-22-28 is studied for its potential influence on regulatory peptide pathways and neurochemical signaling',
      disposition: 'supported',
      rationale: 'Confirmed — TREK-1 channel inhibition is precisely a regulatory/neurochemical signaling pathway.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-28955242', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '8f965a42-2fc4-467f-853f-e1033c2b61bb',
      legacyStatementExcerpt: 'Q: What is PE-22-28 researched for? A: Research commonly focuses on behavioral neuroscience, mood-related laboratory models, stress-response pathways',
      disposition: 'supported',
      rationale: 'Directly and precisely confirmed — mood-related laboratory models (antidepressant testing) is exactly the verified research focus.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-28955242', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '281c636b-1262-4a8c-9721-365b89922994',
      legacyStatementExcerpt: 'Q: Is PE-22-28 the same as PE-22-29? A: No. They are distinct research peptides',
      disposition: 'revised',
      rationale: 'PE-22-28 is a confirmed, real, independently verifiable compound. PE-22-29 (see pe-22-29.mjs) has NO independently verifiable literature identified in this review at all — they are not comparably evidenced "distinct research peptides" as this statement implies parity between them.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-28955242', relationship: 'provides_context' }],
    },
    policyReconciliation('af0001ad-08a6-429d-8ca4-dccf39f508e1', 'Q: Does Cloud Peptides provide dosage information? A: No.'),
    policyReconciliation('273e6df4-c966-49b7-a4d0-54212a9e98eb', 'This page summarizes publicly available scientific literature for educational purposes only.'),
    policyReconciliation('6517fe03-f31d-4163-8cf0-569605064561', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    policyReconciliation('ef27b60f-583f-4a35-a280-27b02a4aa8b9', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
