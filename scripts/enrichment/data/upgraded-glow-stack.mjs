/**
 * Upgraded Glow Stack (GHK-Cu + Glutathione) — research enrichment.
 *
 * Honest coverage note: no published study of GHK-Cu co-administered
 * with Glutathione (the combination itself) was identified. Each has
 * its own separately-verified evidence: GHK-Cu (ghk-cu.mjs, pilot) and
 * Glutathione (glutathione.mjs, batch 3 — itself a CONFLICTING human
 * evidence base, not a clean positive result).
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'upgraded-glow-stack',
  sources: [
    {
      key: 'pmid-11045606-upgraded',
      sourceType: 'pubmed_article',
      title:
        'The tripeptide-copper complex glycyl-L-histidyl-L-lysine-Cu2+ stimulates matrix metalloproteinase-2 expression by fibroblast cultures.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/11045606/',
      identifiers: { pmid: '11045606' },
      study: {
        studyDesign: 'in_vitro_study',
        intervention: 'GHK-Cu',
        resultsSummary: 'See ghk-cu.mjs for the fuller evidence base.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-21875351-upgraded',
      sourceType: 'pubmed_article',
      title:
        'Effects of oral glutathione supplementation on systemic oxidative stress biomarkers in human volunteers.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/21875351/',
      identifiers: { pmid: '21875351' },
      study: {
        studyDesign: 'rct_human',
        intervention: 'Oral glutathione',
        resultsSummary: 'See glutathione.mjs for the fuller (conflicting) evidence base.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'No published study of GHK-Cu co-administered with Glutathione (the "Upgraded Glow Stack" combination itself) was identified during this review. Each has its own separately-verified evidence, but Glutathione\'s own human-trial evidence is itself CONFLICTING (some trials find no measurable change in oxidative-stress biomarkers; others find a skin-lightening effect) — meaning this stack pairs one compound with real preclinical evidence (GHK-Cu) alongside another whose own human evidence is mixed, and no study evaluates the pairing itself.',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-11045606-upgraded', relationship: 'provides_context' },
        { sourceKey: 'pmid-21875351-upgraded', relationship: 'provides_context' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: 'b03ed737-bbd3-4506-ab5f-9f04f9a7ac22',
      legacyStatementExcerpt:
        'The Upgraded Glow Stack combines GHK-Cu and Glutathione, two compounds that are commonly investigated in laboratory settings for their potential roles in connective tissue biology, oxidative stress',
      disposition: 'revised',
      rationale:
        "Each compound individually is confirmed to have literature in these areas. The COMBINATION itself is not researched — no source evaluates them together, and Glutathione's own human evidence is itself conflicting (see glutathione.mjs), a nuance this claim omits.",
      evidenceQuality: 'low',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-11045606-upgraded', relationship: 'directly_supports' },
        { sourceKey: 'pmid-21875351-upgraded', relationship: 'directly_supports' },
      ],
    },
    {
      legacyClaimId: '3bda52ba-be59-482d-883d-8f2e5d54bc97',
      legacyStatementExcerpt:
        'Researchers study this combination because the compounds are associated with different biological pathways. GHK-Cu has been widely investigated in collagen and tissue remodeling research, while Glutathione is recognized',
      disposition: 'revised',
      rationale:
        'Each compound\'s individual research area is accurately described. "Researchers study this combination" is not supported — no combination-specific research was located.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-11045606-upgraded', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '765ba8ca-13ea-4c32-b4e9-1d23b9019b06',
      legacyStatementExcerpt:
        'Research remains ongoing, and published findings should always be interpreted within the context of individual study design',
      disposition: 'supported',
      rationale: 'Generic, appropriately cautious statement.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: 'a7355738-5edf-4d18-a9ae-63318dd3169f',
      legacyStatementExcerpt:
        'Researchers explore this combination to better understand how connective tissue biology and antioxidant pathways may interact',
      disposition: 'unsupported',
      rationale: "No study of these two compounds' pathways interacting together was located.",
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: 'bb8786bc-41cb-4ba4-b353-26f40357b12f',
      legacyStatementExcerpt:
        'Q: Why are these compounds researched together? A: They are studied because they are associated with different biological pathways involved in connective tissue and cellular antioxidant research',
      disposition: 'revised',
      rationale:
        'A plausible product-design rationale, not evidence the pairing itself has been researched.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    policyReconciliation(
      'e368dd1c-0d22-4a37-a7a1-76475170cdb3',
      'Q: Does Cloud Peptides recommend this stack? A: No.',
    ),
    policyReconciliation(
      '6b1a8baa-0cbb-445a-a035-ed8b10ad9538',
      'Q: Does this page include dosage recommendations? A: No.',
    ),
    policyReconciliation(
      '895c5c59-672c-460b-93f8-57e59b468882',
      'Q: Are these products for human consumption? A: No.',
    ),
    policyReconciliation(
      'baf030eb-8ba5-4f29-b3dc-af685bb61406',
      'This page summarizes published scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      'fed0ee5f-641e-44e8-8bdd-5b6db71c9b23',
      'Cloud Peptides does not provide medical advice, dosage recommendations, or treatment guidance.',
    ),
    policyReconciliation(
      '3176b21d-dba4-4a8d-90e9-20442a8556ef',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
