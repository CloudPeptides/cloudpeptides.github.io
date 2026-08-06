/**
 * Botulinum Toxin — research enrichment. Sources verified via NCBI
 * E-utilities and the FDA's own approved-label document.
 *
 * Note: unlike most other compounds in this database, botulinum toxin
 * type A (onabotulinumtoxinA / Botox) is an FDA-APPROVED prescription
 * drug with a decades-long approval history for multiple indications.
 * This file documents that regulatory reality and the underlying
 * mechanistic science, without making any dosing/treatment
 * recommendation (per CLAUDE.md — no injection/treatment instructions,
 * regardless of the compound's approval status).
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'botulinum-toxin',
  sources: [
    {
      key: 'pmid-8103915',
      sourceType: 'pubmed_article',
      title: 'Botulinum neurotoxin A selectively cleaves the synaptic protein SNAP-25.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/8103915/',
      publisherOrAgency: 'Nature',
      publicationDate: '1993',
      identifiers: { pmid: '8103915' },
      study: {
        studyDesign: 'in_vitro_study',
        resultsSummary:
          'Established that botulinum neurotoxin type A acts as a zinc-dependent protease that selectively cleaves SNAP-25, a SNARE protein required for synaptic vesicle fusion — the foundational mechanistic finding explaining how the toxin blocks acetylcholine release at the neuromuscular junction.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'fda-botox-label',
      sourceType: 'fda_document',
      title: 'BOTOX (onabotulinumtoxinA) for injection — approved labeling (BLA 103000)',
      url: 'https://www.fda.gov/media/172965/download',
      publisherOrAgency: 'U.S. Food and Drug Administration',
      publicationDate: '1989-12-29',
      identifiers: {},
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        'Botulinum neurotoxin type A is a zinc-dependent protease that selectively cleaves SNAP-25, a SNARE-complex protein required for synaptic vesicle fusion at the presynaptic membrane, thereby blocking acetylcholine release at the neuromuscular junction and producing temporary, reversible muscle paralysis.',
      evidenceQuality: 'high',
      qualityRationale: 'Foundational, extensively replicated mechanistic finding published in a top-tier journal (Nature) and confirmed across decades of subsequent molecular biology research.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-8103915', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'regulatory',
      statement:
        'Botulinum toxin type A (onabotulinumtoxinA, brand name Botox) was first FDA-approved on 1989-12-29 for essential blepharospasm and strabismus in patients over 12 years old, and has since been approved for numerous additional indications including cervical dystonia (2000), cosmetic glabellar lines (2002), chronic migraine, and overactive bladder, among others, under BLA 103000.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-botox-label', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      formulation: 'OnabotulinumtoxinA (BOTOX) for injection',
      indication: 'Multiple — initially essential blepharospasm/strabismus/hemifacial spasm; later expanded to cervical dystonia, cosmetic glabellar lines, chronic migraine, overactive bladder, and others',
      regulatoryStatus: 'approved',
      effectiveDate: '1989-12-29',
      sourceKey: 'fda-botox-label',
      notes: 'Approved under BLA 103000. This record covers only the onabotulinumtoxinA (Botox) brand/BLA; other botulinum toxin products (e.g. abobotulinumtoxinA/Dysport, incobotulinumtoxinA/Xeomin, rimabotulinumtoxinB/Myobloc) hold separate FDA approvals not independently verified in this review.',
    },
  ],
  legacyReconciliations: [
    {
      legacyClaimId: '2e8bdd6c-6486-4d3a-ac53-50b393406948',
      legacyStatementExcerpt: 'Botulinum toxin is a bacterial neurotoxin extensively investigated in neuroscience, neuromuscular physiology, and synaptic biology',
      disposition: 'revised',
      rationale:
        'Accurate as a description of the underlying science, but materially incomplete: botulinum toxin is not merely a research subject — it is an FDA-approved prescription drug (onabotulinumtoxinA/Botox and other formulations) with a 35+ year approval history for multiple medical and cosmetic indications. The legacy framing (pure "research" framing) undersells its actual regulatory status, which is added as a new regulatory claim below.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [
        { sourceKey: 'pmid-8103915', relationship: 'directly_supports' },
        { sourceKey: 'fda-botox-label', relationship: 'provides_context' },
      ],
    },
    {
      legacyClaimId: '06c348e1-6192-4d75-9335-9611326b70c6',
      legacyStatementExcerpt: 'Experimental models examine botulinum toxin in studies of peripheral nerves, synaptic transmission, motor neuron function, and neurophysiology',
      disposition: 'supported',
      rationale: 'Accurate description of the mechanistic research base, consistent with the verified SNAP-25 cleavage literature.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-8103915', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'db7ca0f4-7bb6-40c5-b1a0-96d2562f6bf4',
      legacyStatementExcerpt: 'Researchers investigate botulinum toxin for its ability to interfere with SNARE proteins involved in acetylcholine release',
      disposition: 'supported',
      rationale: 'Precisely matches the verified, foundational SNAP-25/SNARE mechanistic literature.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-8103915', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '13b14b46-f6fc-4caa-93ae-4a91708d9a41',
      legacyStatementExcerpt: 'Q: What is Botulinum Toxin researched for? A: Research commonly focuses on neuromuscular signaling',
      disposition: 'supported',
      rationale: 'Consistent with the verified mechanistic literature, though — as with the summary claim above — the compound\'s status as an approved therapeutic (not solely a research subject) is materially relevant context added elsewhere in this file.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-8103915', relationship: 'directly_supports' }],
    },
    policyReconciliation('38f1fbbf-cc9a-447a-ba96-ecc9083767e6', 'Q: Is this page intended as medical guidance? A: No.'),
    policyReconciliation('78122aa4-fa40-470a-abfb-2a0efdbce6af', 'Q: Does Cloud Peptides provide dosage information? A: No.'),
    policyReconciliation('58150996-39dd-41e1-9c50-72921c5925d5', 'This page summarizes publicly available scientific literature for educational purposes only.'),
    policyReconciliation('1abb128f-60ea-4539-ba8f-be4b8a0d895f', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    {
      legacyClaimId: '6f1fd700-ae6a-4c40-a861-55786ff5caeb',
      legacyStatementExcerpt: 'All products are intended strictly for laboratory research purposes only and are not for human consumption',
      disposition: 'contradicted',
      rationale:
        'Unlike the other boilerplate "research use only" disclaimers reused across this database, this specific statement is factually at odds with reality for botulinum toxin: it is an FDA-approved prescription drug administered to humans for numerous approved indications. This boilerplate line was almost certainly copied from a template without being adapted for this specific compound. Flagged here rather than silently reused — this compound\'s page requires editorial attention to correct or contextualize this disclaimer (e.g. clarifying that Cloud Peptides sells/discusses it for research purposes even though the substance itself has approved medical uses when administered by licensed prescribers).',
      evidenceQuality: 'high',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'fda-botox-label', relationship: 'contradicts' }],
    },
  ],
};
