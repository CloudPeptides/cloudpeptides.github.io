/**
 * AHK-Cu (copper tripeptide-3) — research enrichment. Sources verified
 * via NCBI E-utilities (abstract text directly confirms "AHK-Cu" is the
 * compound under study, not just an ambiguous "copper tripeptide" title).
 *
 * Honest coverage note: exactly one AHK-Cu-specific peer-reviewed
 * primary source was identified (an ex vivo human hair follicle organ
 * culture + dermal papilla cell in vitro study). AHK-Cu is structurally
 * related to GHK-Cu (alanine substituted for glycine at the N-terminus)
 * and vendor material extensively cites GHK-Cu's much larger literature
 * as if it applied to AHK-Cu directly — that inference is NOT made here.
 * GHK-Cu's own findings (see scripts/enrichment/data/ghk-cu.mjs) are
 * referenced only as structural context, never as direct AHK-Cu evidence.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'ahk-cu',
  sources: [
    {
      key: 'pmid-17703734',
      sourceType: 'pubmed_article',
      title: 'The effect of tripeptide-copper complex on human hair growth in vitro.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/17703734/',
      publisherOrAgency: 'Archives of Pharmacal Research',
      publicationDate: '2007-07',
      identifiers: { pmid: '17703734' },
      study: {
        studyDesign: 'in_vitro_study',
        population:
          'Human hair follicles (ex vivo organ culture) and cultured human dermal papilla cells (DPCs)',
        intervention:
          'AHK-Cu (L-alanyl-L-histidyl-L-lysine-Cu2+), concentrations 10^-12 to 10^-9 M',
        resultsSummary:
          'AHK-Cu stimulated elongation of human hair follicles in ex vivo organ culture (consistent with prolonging the anagen/active growth phase) and increased proliferation of cultured dermal papilla cells, with effects observed across the picomolar-to-nanomolar concentration range tested.',
        limitations:
          'Ex vivo/in vitro only — no in vivo animal or human clinical (scalp application) study identified. Single published study identified for this compound; not independently replicated.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        'In ex vivo human hair follicle organ culture and cultured human dermal papilla cells, AHK-Cu (10^-12 to 10^-9 M) stimulated follicle elongation and increased dermal papilla cell proliferation.',
      evidenceQuality: 'low',
      qualityRationale:
        'Single peer-reviewed ex vivo/in vitro study; not replicated; not an in vivo or clinical (scalp) outcome.',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-17703734', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'safety',
      statement:
        'As of this review, no published in vivo animal study or human clinical trial of topical AHK-Cu was identified — the only primary evidence located is one ex vivo/in vitro study.',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-17703734', relationship: 'provides_context' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '6a100f8c-a826-4ba3-ad9c-5efb37e6e365',
      legacyStatementExcerpt:
        'AHK-Cu is a naturally occurring copper-binding tripeptide investigated for its role in skin biology, connective tissue research, hair follicle physiology',
      disposition: 'revised',
      rationale:
        'The one verified AHK-Cu study covers hair follicle/dermal papilla effects specifically, not the full breadth implied ("skin biology, connective tissue research... collagen biology, tissue remodeling, and heal[ing]"). Hair-follicle framing is supported; the broader skin/connective-tissue/collagen/healing claims are not independently verified for AHK-Cu specifically in this review (they describe GHK-Cu\'s literature, a related but distinct molecule). Also note: "naturally occurring" is not established by the verified source, which studies AHK-Cu as a synthesized tripeptide-copper complex.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-17703734', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '35f09d8e-0933-4e2d-ade7-eeaab4775e2c',
      legacyStatementExcerpt:
        'Researchers investigate AHK-Cu for its interaction with copper-dependent signaling pathways involving fibroblast activity',
      disposition: 'unsupported',
      rationale:
        "The verified AHK-Cu source studies hair follicle organ culture and dermal papilla cells, not fibroblast activity or extracellular matrix organization specifically — this appears to conflate AHK-Cu with GHK-Cu's (independently verified, see ghk-cu.mjs) fibroblast/MMP literature. No AHK-Cu-specific fibroblast study was identified.",
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '163b6053-0c82-4526-a7e9-4f154e393f08',
      legacyStatementExcerpt:
        'Q: What is AHK-Cu? A: AHK-Cu is a copper-binding peptide studied for skin biology, tissue remodeling, and hair follicle research',
      disposition: 'revised',
      rationale:
        'Hair follicle research is verified. "Skin biology" and "tissue remodeling" beyond the hair follicle context are not independently verified for AHK-Cu specifically in this review — see note on the summary claim above.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-17703734', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'c587bcdd-0951-454c-8f67-b2c31ee24f7a',
      legacyStatementExcerpt:
        'Q: How is AHK-Cu different from GHK-Cu? A: Although both are copper peptides, they are distinct molecules',
      disposition: 'supported',
      rationale:
        "Accurately and conservatively hedged — correctly states they are distinct molecules with overlapping but different pathways, without overclaiming equivalence. Consistent with this review's own finding that AHK-Cu's verified evidence base does not extend to all of GHK-Cu's findings.",
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-17703734', relationship: 'provides_context' }],
    },
    policyReconciliation(
      'abe0bbf7-2fc1-43bd-8357-4d8cab95e9f6',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      '31fe6c35-07f9-4b8c-a7ce-2c320e4199cc',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      '5f69cc37-08df-406c-af0c-222def9c8770',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    policyReconciliation(
      '8812b934-8b15-49c4-b2f0-2bfc7acb29d6',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
