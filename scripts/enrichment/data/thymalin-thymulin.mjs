/**
 * Thymalin / Thymulin — research enrichment. Sources verified via NCBI
 * E-utilities.
 *
 * IMPORTANT finding: the legacy page treats these as a single, closely
 * related pairing, but they have MATERIALLY DIFFERENT evidence bases.
 * Thymulin (formerly "FTS," facteur thymique serique) is a real,
 * independently well-characterized nonapeptide hormone discovered and
 * extensively studied by Bach and colleagues (France) since the 1970s —
 * broad, independent (non-Khavinson) literature. Thymalin is a
 * Khavinson-group thymic bioregulator extract preparation, following
 * the same "small cluster of largely self-authored papers" pattern seen
 * for Epithalon/Cartalax/Pinealon in this database. These should not be
 * presented as evidentially equivalent.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'thymalin-thymulin',
  sources: [
    {
      key: 'pmid-19236333',
      sourceType: 'pubmed_article',
      title: 'The thymus-neuroendocrine axis: physiology, molecular biology, and therapeutic potential of the thymic peptide thymulin.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/19236333/',
      publisherOrAgency: 'Annals of the New York Academy of Sciences',
      publicationDate: '2009-02',
      identifiers: { pmid: '19236333', doi: '10.1111/j.1749-6632.2008.03964.x' },
      study: {
        studyDesign: 'narrative_review',
        resultsSummary:
          'Reviews thymulin (formerly "FTS," facteur thymique serique) — a well-characterized zinc-dependent nonapeptide hormone produced by thymic epithelial cells, discovered and studied by Bach and colleagues since the early 1970s. Thymulin induces T-cell differentiation, enhances T-cell-subset function, and increases natural killer cell activity; its biological activity and antigenicity depend on zinc binding.',
        limitations: 'Narrative (non-systematic) review, though summarizing a genuinely broad, decades-deep, independently-replicated literature (not limited to one research group).',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-9637345',
      sourceType: 'pubmed_article',
      title: 'Natural and synthetic thymic peptides as therapeutics for immune dysfunction.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/9637345/',
      publisherOrAgency: 'International Journal of Immunopharmacology',
      publicationDate: '1997-09',
      identifiers: { pmid: '9637345', doi: '10.1016/s0192-0561(97)00058-1' },
      study: {
        studyDesign: 'narrative_review',
        resultsSummary: 'Authored by Thymalin\'s own developers (Morozov, Khavinson); reviews thymic peptide preparations (including Thymalin, isolated from calf thymus) as immune-dysfunction therapeutics.',
        limitations: 'Authored by the compound\'s own developers — a direct conflict of interest, the same limitation pattern seen for Epithalon/Cartalax/Pinealon in this database.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'Thymalin and Thymulin are NOT evidentially equivalent, despite frequently being marketed together. Thymulin (formerly "FTS") is a well-characterized, zinc-dependent nonapeptide hormone with a broad, independent, decades-deep research literature (Bach and colleagues, since the 1970s), documenting T-cell differentiation and immune-function effects. Thymalin is a Khavinson-group thymic extract preparation whose available literature is, like Epithalon/Cartalax/Pinealon in this database, predominantly self-authored by its own developers, with minimal independent outside replication identified in this review.',
      evidenceQuality: 'low',
      qualityRationale: 'Thymulin\'s evidence is comparatively strong (independent, replicated); Thymalin\'s is comparatively weak (self-authored). Presenting them as a single evidentiary unit understates this real difference.',
      interpretationStatus: 'conflicting',
      sources: [
        { sourceKey: 'pmid-19236333', relationship: 'directly_supports' },
        { sourceKey: 'pmid-9637345', relationship: 'provides_context' },
      ],
    },
    {
      contentSection: 'mechanism',
      statement:
        'Thymulin is a zinc-dependent nonapeptide hormone produced by thymic epithelial cells that induces T-cell differentiation, enhances proliferative responsiveness of T-cell subsets to mitogens, and increases natural killer cell activity — its biological activity and immunogenicity require zinc binding.',
      evidenceQuality: 'moderate',
      qualityRationale: 'Well-characterized, independently replicated mechanism across a broad literature spanning decades.',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-19236333', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '6b890c4e-f3c6-4625-ac8c-1a21970f76a8',
      legacyStatementExcerpt: 'Thymalin and Thymulin are thymus-derived peptides studied for their roles in immune system biology and age-related changes in thymic function',
      disposition: 'revised',
      rationale:
        'Accurate that both are thymus-related peptides studied for immune biology, but this framing presents them as evidentially comparable, when in fact Thymulin has a substantially broader, more independent literature than Thymalin. This distinction — significant for how much weight to give each — is added via the new summary claim above.',
      evidenceQuality: 'low',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'pmid-19236333', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'a371f915-1305-44b9-abe2-bb1d753bebc0',
      legacyStatementExcerpt: 'Current literature explores their potential influence on thymic activity, immune cell development, and recovery-related biological pathways',
      disposition: 'revised',
      rationale: 'Thymic activity/immune cell development is directly confirmed for Thymulin specifically; "recovery-related biological pathways" was not independently verified as a distinct studied outcome for either compound in this review.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-19236333', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '78da5b4b-85c3-41d7-8ffb-f75fbf6a58f2',
      legacyStatementExcerpt: 'Researchers study Thymalin and Thymulin for their effects on thymus-associated signaling pathways, T-cell maturation, cytokine regulation',
      disposition: 'supported',
      rationale: 'T-cell maturation/differentiation effects are directly confirmed, primarily for Thymulin.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-19236333', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'bb31b6cc-8d53-47e4-9c78-271efc813c0e',
      legacyStatementExcerpt: 'Q: What are Thymalin and Thymulin researched for? A: Research commonly focuses on thymus biology, immune regulation, T-cell development, and healthy aging',
      disposition: 'supported',
      rationale: 'Accurately reflects the research focus, with the evidence-strength caveat noted above.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-19236333', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'd8073e62-c54c-46ae-865d-a1f3f41f504d',
      legacyStatementExcerpt: 'Q: Are these the same peptide? A: No. They are distinct thymic peptides that are frequently discussed together because of their related biological functions',
      disposition: 'supported',
      rationale: 'Correct that they are chemically distinct — though this review found their EVIDENCE BASES are also meaningfully distinct (not just their chemistry), which this FAQ does not mention.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-19236333', relationship: 'provides_context' }],
    },
    policyReconciliation('58f32240-00ac-4702-a215-98ef8b0bff0b', 'Q: Does Cloud Peptides provide dosage information? A: No.'),
    policyReconciliation('73ef37f1-d683-42e2-a6ae-0e84a391d630', 'This page summarizes publicly available scientific literature for educational purposes only.'),
    policyReconciliation('8702d035-1deb-4c74-96ac-093902044768', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    policyReconciliation('ff2eebb9-28c0-40c7-9218-7de83f3d1682', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
