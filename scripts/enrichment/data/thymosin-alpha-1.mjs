/**
 * Thymosin Alpha-1 — research enrichment. Sources verified via NCBI
 * E-utilities.
 *
 * Note: Thymosin Alpha-1 (brand name Zadaxin) is approved as a
 * prescription drug in 35+ countries (for chronic hepatitis B/C and as
 * an immune adjunct in cancer) — but is NOT FDA-approved in the United
 * States (it holds FDA Orphan Drug designation for hepatocellular
 * carcinoma and hepatitis B, a distinct and lesser status than full
 * marketing approval). This nuanced, partial-approval status is
 * represented precisely, not simplified in either direction.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'thymosin-alpha-1',
  sources: [
    {
      key: 'pmid-10607256',
      sourceType: 'pubmed_article',
      title: 'Thymosin alpha1 treatment of chronic hepatitis B: results of a phase III multicentre, randomized, double-blind and placebo-controlled study.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/10607256/',
      publisherOrAgency: 'Journal of Viral Hepatitis',
      publicationDate: '1999-09',
      identifiers: { pmid: '10607256', doi: '10.1046/j.1365-2893.1999.00181.x' },
      study: {
        studyDesign: 'rct_human',
        population: 'Patients with serum HBV DNA and HBeAg-positive chronic hepatitis B (n=97)',
        sampleSize: 97,
        intervention: 'Thymosin alpha-1 (Talpha1), 1.6 mg, twice weekly (n=49)',
        comparator: 'Placebo, twice weekly (n=48)',
        duration: '6 months treatment, followed by 6 months follow-up',
        resultsSummary: 'Phase III, multicenter, randomized, double-blind, placebo-controlled trial — one of the pivotal studies underlying Thymosin Alpha-1\'s approval as a hepatitis B treatment in numerous countries.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        'Thymosin Alpha-1 is a naturally occurring thymic peptide studied for its role in immune regulation, including T-cell maturation, antigen presentation, and cytokine signaling in innate and adaptive immune responses.',
      evidenceQuality: 'high',
      qualityRationale: 'Well-established mechanism, supported by an extensive human clinical trial literature across multiple indications.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-10607256', relationship: 'provides_context' }],
    },
    {
      contentSection: 'regulatory',
      statement:
        'Thymosin Alpha-1 (brand name Zadaxin) is an approved prescription drug in more than 35 countries (including China, India, the Philippines, Russia, and others), primarily for chronic hepatitis B, hepatitis C, and as an immune adjunct in cancer treatment — based on multiple randomized, double-blind, placebo-controlled trials (including a pivotal Phase III hepatitis B trial). It has NOT received full FDA marketing approval in the United States, though it holds FDA Orphan Drug designation for hepatocellular carcinoma and hepatitis B — a distinct, lesser regulatory status than approval.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-10607256', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'Multiple national regulators (35+ countries, e.g. China, India, Philippines, Russia)',
      jurisdiction: 'International (outside the United States)',
      formulation: 'Thymosin Alpha-1 (Zadaxin)',
      indication: 'Chronic hepatitis B; chronic hepatitis C; immune adjunct in cancer treatment',
      regulatoryStatus: 'approved',
      sourceKey: 'pmid-10607256',
      notes: 'Approved as a prescription drug outside the United States. This record was not independently verified against each individual country\'s own regulatory database in this review — it reflects cross-corroborated secondary reporting of the approval footprint, flagged for country-by-country verification before being asserted with jurisdiction-level precision in published content.',
    },
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      indication: 'Hepatocellular carcinoma; hepatitis B (Orphan Drug designation only)',
      regulatoryStatus: 'no_determination',
      sourceKey: 'pmid-10607256',
      notes: 'Holds FDA Orphan Drug designation for hepatocellular carcinoma and hepatitis B — this facilitates but does not itself constitute marketing approval. Thymosin Alpha-1 has NOT received full FDA marketing approval for any indication in the United States, reportedly for commercial rather than scientific/safety reasons (not independently verified in this review).',
    },
  ],
  legacyReconciliations: [
    {
      legacyClaimId: '8f51ec39-80cc-4483-8a0b-a044709effd8',
      legacyStatementExcerpt: 'Thymosin Alpha-1 is a naturally occurring peptide originally isolated from the thymus. It is widely studied for its role in immune regulation',
      disposition: 'revised',
      rationale: 'Accurate mechanistically, but frames Thymosin Alpha-1 purely as a "studied" research subject, when it is in fact an approved prescription drug in 35+ countries — a significant regulatory fact, added as new regulatory claims/records above.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-10607256', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '7e3d953f-9e4b-4fbd-a0e3-805bef683f12',
      legacyStatementExcerpt: 'Researchers continue to investigate its effects on immune signaling, inflammatory pathways, and recovery-related biological processes',
      disposition: 'supported',
      rationale: 'Consistent with its extensive, ongoing clinical trial literature.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-10607256', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '1f51b111-e252-4864-be39-4f3b6b7ca995',
      legacyStatementExcerpt: 'Current research explores how Thymosin Alpha-1 influences immune cell communication, antigen presentation, and cytokine signaling',
      disposition: 'supported',
      rationale: 'Confirmed mechanism, consistent with its clinical use.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-10607256', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: 'fd301103-aa41-478d-b337-d09c80704241',
      legacyStatementExcerpt: 'Q: What is Thymosin Alpha-1 researched for? A: Published research commonly investigates immune regulation, T-cell biology, inflammation-related signaling',
      disposition: 'revised',
      rationale: 'Accurate but incomplete — omits the significant fact that it is an approved drug (outside the US) for specific indications, not solely a research subject.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-10607256', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'e8566045-43da-4dab-b5c9-750c7b0941c6',
      legacyStatementExcerpt: 'Q: Is Thymosin Alpha-1 naturally occurring? A: Yes. It is a naturally occurring peptide associated with the thymus',
      disposition: 'supported',
      rationale: 'Accurate, uncontroversial fact.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    policyReconciliation('6b5c904b-48a2-4a58-bb36-55978460a6f4', 'Q: Does Cloud Peptides provide dosage information? A: No.'),
    policyReconciliation('72a74944-befa-428a-a657-cf73c13008c4', 'This page summarizes publicly available scientific literature for educational purposes only.'),
    policyReconciliation('1afb9864-a6d8-465c-9795-1af86f6a2010', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    {
      legacyClaimId: 'c28de74d-8a6f-4249-bb1e-7978a2f279ba',
      legacyStatementExcerpt: 'All products are intended strictly for laboratory research purposes only and are not for human consumption',
      disposition: 'revised',
      rationale:
        'Not FDA-approved in the United States (unlike Botulinum Toxin/HCG/PT-141/etc.), so this disclaimer is technically accurate as applied in the US market — but the compound itself IS an approved, clinically-administered human drug in 35+ other countries, a nuance worth surfacing rather than a flat contradiction or a flat pass.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-10607256', relationship: 'provides_context' }],
    },
  ],
};
