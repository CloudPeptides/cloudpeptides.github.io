/**
 * TB-500 — research enrichment. Sources verified via NCBI E-utilities.
 *
 * Honest coverage note: "TB-500" is commercially sold as a synthetic
 * fragment/analog associated with thymosin beta-4 — the actual
 * peer-reviewed literature is on natural thymosin beta-4 itself, not
 * verified in this review to be chemically identical to what is sold
 * as "TB-500." This distinction (already correctly hedged in the
 * legacy page's own FAQ) is preserved throughout.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'tb-500',
  sources: [
    {
      key: 'pmid-10469335-tb500',
      sourceType: 'pubmed_article',
      title: 'Thymosin beta4 accelerates wound healing.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/10469335/',
      publisherOrAgency: 'The Journal of Investigative Dermatology',
      publicationDate: '1999-09',
      identifiers: { pmid: '10469335' },
      study: {
        studyDesign: 'animal_study',
        population: 'Rat, full-thickness skin wound model',
        intervention: 'Thymosin beta-4, topical or intraperitoneal',
        comparator: 'Saline control',
        resultsSummary:
          'Increased reepithelialization (42% at 4 days, up to 61% at 7 days), wound contraction, collagen deposition, and angiogenesis versus saline control.',
        limitations:
          'Animal model; studies natural thymosin beta-4, not independently confirmed identical to the commercial "TB-500" product.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-14500546',
      sourceType: 'pubmed_article',
      title: 'The actin binding site on thymosin beta4 promotes angiogenesis.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/14500546/',
      identifiers: { pmid: '14500546' },
      study: {
        studyDesign: 'in_vitro_study',
        intervention: 'Thymosin beta-4 and its actin-binding domain',
        resultsSummary:
          'Identified the actin-binding site on thymosin beta-4 as the region responsible for its angiogenesis-promoting activity, linking its cell-migration mechanism to endothelial tube formation.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-22074294',
      sourceType: 'pubmed_article',
      title:
        'Thymosin β4: a multi-functional regenerative peptide. Basic properties and clinical applications.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/22074294/',
      publisherOrAgency: 'Expert Opinion on Biological Therapy',
      publicationDate: '2011',
      identifiers: { pmid: '22074294' },
      study: {
        studyDesign: 'narrative_review',
        resultsSummary:
          "Reviews thymosin beta-4's regenerative properties across dermal, corneal, and cardiac wound-repair models and notes progress toward multicenter clinical trials.",
        limitations: 'Narrative review, not systematic.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        '"TB-500" is commercially sold as a synthetic peptide fragment/analog associated with natural thymosin beta-4 — this review verified real, substantial peer-reviewed evidence for NATURAL thymosin beta-4 (wound healing, angiogenesis via its actin-binding domain, broader regenerative properties reviewed across dermal/corneal/cardiac models), but did NOT independently confirm the commercial "TB-500" product is chemically identical to the natural peptide studied in this literature. This distinction should be preserved, not blurred, when presenting this evidence.',
      evidenceQuality: 'moderate',
      qualityRationale:
        'Multiple independent peer-reviewed animal/in-vitro studies with a consistent mechanism and effect, but concerning the natural peptide, with the commercial-product-identity question unresolved in this review.',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-10469335-tb500', relationship: 'directly_supports' },
        { sourceKey: 'pmid-14500546', relationship: 'directly_supports' },
      ],
    },
    {
      contentSection: 'mechanism',
      statement:
        'Thymosin beta-4 promotes angiogenesis via its actin-binding domain, which drives endothelial cell migration and tube formation — the same actin-sequestering activity underlies its broader roles in cell migration and wound-tissue reepithelialization.',
      evidenceQuality: 'moderate',
      qualityRationale:
        'Peer-reviewed in-vitro mechanistic study with a specific, testable structure-function finding (the actin-binding domain).',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-14500546', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '22f2ec2c-59df-4fdd-abd4-f4863629bb76',
      legacyStatementExcerpt:
        'TB-500 is a synthetic peptide fragment associated with thymosin beta-4 research. It has become a common subject of regenerative and recovery-related studies',
      disposition: 'revised',
      rationale:
        'Accurate that TB-500 is "associated with" thymosin beta-4 research, but the actual verified peer-reviewed studies are of natural thymosin beta-4, not independently confirmed to be TB-500 itself — a distinction this page\'s own later FAQ (see below) already correctly hedges, but the summary claim does not.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-10469335-tb500', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'b77428ec-60fa-4528-88de-e94b13aa9795',
      legacyStatementExcerpt:
        'Researchers investigate TB-500 in relation to wound repair, angiogenesis, connective tissue biology, soft tissue recovery, and cellular movement',
      disposition: 'revised',
      rationale:
        'Wound repair, angiogenesis, and cellular movement are directly confirmed for natural thymosin beta-4. "Connective tissue biology" and "soft tissue recovery" specifically beyond skin-wound healing were not independently verified as distinct study outcomes in the sources reviewed here.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-10469335-tb500', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'cfc0cd19-0dd6-4d5e-b47d-0b9ba6435869',
      legacyStatementExcerpt:
        'TB-500 is studied for its role in actin-related processes and cellular migration',
      disposition: 'supported',
      rationale:
        'Directly confirmed for thymosin beta-4 (the natural peptide) via its actin-binding domain mechanism.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-14500546', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'c39c143e-5a73-4882-bcad-8f7c97b957d8',
      legacyStatementExcerpt:
        'Q: What is TB-500 primarily researched for? A: TB-500 is commonly researched for cell migration, actin regulation, angiogenesis, and tissue remodeling',
      disposition: 'supported',
      rationale: 'Accurately reflects the verified research focus (for natural thymosin beta-4).',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-14500546', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '93841c16-9a97-44c7-b07c-403b8120baf8',
      legacyStatementExcerpt:
        'Q: Is TB-500 the same as thymosin beta-4? A: TB-500 is commonly discussed as a synthetic peptide fragment associated with thymosin beta-4 research, but it should be treated as its own research product',
      disposition: 'supported',
      rationale:
        "This is exactly the correct, appropriately hedged framing — consistent with this review's own finding that the two should not be treated as automatically identical. The strongest legacy claim on this page.",
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-10469335-tb500', relationship: 'provides_context' }],
    },
    policyReconciliation(
      'dea207f8-167c-4c57-bfbe-d446a66a0262',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      '7d08edf8-c6b4-475f-9efc-794cec4d9959',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      '0cdc9464-7d8d-4e2a-8c2b-a51070edfbfa',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    policyReconciliation(
      'de635ad1-86f7-4452-aadb-c38b3ec7e54a',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
