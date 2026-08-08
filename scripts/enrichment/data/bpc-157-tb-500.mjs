/**
 * BPC-157 + TB-500 (peptide blend) — research enrichment.
 *
 * Honest coverage note: this is a named commercial combination of two
 * individually-studied peptides. NO published study of the combination
 * itself (BPC-157 co-administered with TB-500/thymosin beta-4) was
 * identified during this review — no in-vitro, animal, or human trial
 * of the pairing exists in the literature searched. All evidence here
 * is necessarily about the two components studied SEPARATELY; this
 * file does not infer that combining them produces an additive,
 * synergistic, or even safe effect beyond what is independently known
 * about each component (BPC-157's own literature is documented in
 * scripts/enrichment/data/bpc-157.mjs; TB-500/thymosin beta-4's
 * foundational animal wound-healing evidence is summarized directly
 * below, since it does not yet have its own dedicated compound file in
 * this pipeline).
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'bpc-157-tb-500',
  sources: [
    {
      key: 'pmid-10469335',
      sourceType: 'pubmed_article',
      title: 'Thymosin beta4 accelerates wound healing.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/10469335/',
      publisherOrAgency: 'The Journal of Investigative Dermatology',
      publicationDate: '1999-09',
      identifiers: { pmid: '10469335', doi: '10.1046/j.1523-1747.1999.00708.x' },
      study: {
        studyDesign: 'animal_study',
        population: 'Rat, full-thickness skin wound model',
        intervention: 'Thymosin beta-4 (the active peptide in TB-500), topical or intraperitoneal',
        comparator: 'Saline control',
        resultsSummary:
          'Thymosin beta-4 increased reepithelialization by 42% over saline controls at 4 days (up to 61% at 7 days) and increased wound contraction, collagen deposition, and angiogenesis.',
        limitations: 'Animal model only; TB-500 (a synthetic fragment/analog) is not always identical to the natural full-length thymosin beta-4 peptide used in this study.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-20536453',
      sourceType: 'pubmed_article',
      title: 'Animal studies with thymosin beta, a multifunctional tissue repair and regeneration peptide.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/20536453/',
      publisherOrAgency: 'Annals of the New York Academy of Sciences',
      publicationDate: '2010-04',
      identifiers: { pmid: '20536453', doi: '10.1111/j.1749-6632.2010.05479.x' },
      study: {
        studyDesign: 'narrative_review',
        resultsSummary:
          'Review of animal studies with thymosin beta-4 across dermal, corneal, and cardiac tissue-repair models, describing anti-inflammatory, cell-migration, angiogenic, and stem-cell-maturation activities.',
        limitations: 'Narrative (non-systematic) review; underlying primary studies are animal-only.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-21030672-blend',
      sourceType: 'pubmed_article',
      title: 'The promoting effect of pentadecapeptide BPC 157 on tendon healing involves tendon outgrowth, cell survival, and cell migration.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/21030672/',
      publisherOrAgency: 'Journal of Applied Physiology',
      publicationDate: '2011-03-01',
      identifiers: { pmid: '21030672', doi: '10.1152/japplphysiol.00945.2010' },
      study: {
        studyDesign: 'in_vitro_study',
        population: 'Rat tendon fibroblast explant culture',
        intervention: 'BPC 157 applied to cultured rat tendon explants/fibroblasts',
        resultsSummary: 'BPC 157 accelerated tendon explant outgrowth, increased fibroblast survival under oxidative stress, and increased fibroblast migration (see bpc-157.mjs for the fuller BPC-157 evidence base).',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'No published in-vitro, animal, or human study of BPC-157 co-administered with TB-500/thymosin beta-4 (i.e., the combination itself) was identified during this review. Everything known about this pairing is inferred by combining each peptide\'s separately-studied evidence, not evidence of the combination\'s own effect, safety, or interaction.',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-21030672-blend', relationship: 'provides_context' },
        { sourceKey: 'pmid-10469335', relationship: 'provides_context' },
      ],
    },
    {
      contentSection: 'mechanism',
      statement:
        'Thymosin beta-4 (the active peptide TB-500 is derived from/marketed as) accelerated wound reepithelialization, contraction, collagen deposition, and angiogenesis in a rat full-thickness skin wound model, and has broader animal evidence across dermal, corneal, and cardiac tissue-repair models.',
      evidenceQuality: 'moderate',
      qualityRationale: 'Peer-reviewed animal studies; TB-500 as commercially sold is a synthetic peptide related to but not always identical to the natural thymosin beta-4 used in the cited research — this distinction was not independently resolved in this review.',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-10469335', relationship: 'directly_supports' },
        { sourceKey: 'pmid-20536453', relationship: 'directly_supports' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '3efcd5c9-ff0a-487a-ba77-f1c8ff805558',
      legacyStatementExcerpt: 'BPC-157 and TB-500 are frequently studied together because they are associated with different biological processes involved in tissue repair',
      disposition: 'unsupported',
      rationale:
        'This statement\'s premise ("frequently studied together") is not supported — no published study of the actual combination was located during this review. Each peptide has been independently studied (BPC-157: see bpc-157.mjs; thymosin beta-4/TB-500: sources in this file), but co-administration itself has not been directly researched as far as this review could determine.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-21030672-blend', relationship: 'provides_context' },
        { sourceKey: 'pmid-10469335', relationship: 'provides_context' },
      ],
    },
    {
      legacyClaimId: '4466352f-b342-490e-b453-8a45acfe844b',
      legacyStatementExcerpt: 'Scientific literature continues to evaluate how these pathways interact across musculoskeletal, soft tissue, and vascular research models',
      disposition: 'unsupported',
      rationale: 'No literature evaluating the interaction of these two peptides\' pathways (as opposed to each pathway independently) was located during this review.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: 'da730617-f2f3-4b2a-9618-5f1fbdae9bd6',
      legacyStatementExcerpt: 'Q: Why are BPC-157 and TB-500 researched together? A: Researchers investigate this pairing because each compound has been studied for different aspects',
      disposition: 'revised',
      rationale: 'More accurate as written than the summary claim above — it correctly attributes the rationale to each compound\'s SEPARATE research base rather than claiming the pairing itself has been researched. Retained with this distinction now made explicit in the new summary claim.',
      evidenceQuality: 'low',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-21030672-blend', relationship: 'provides_context' },
        { sourceKey: 'pmid-10469335', relationship: 'provides_context' },
      ],
    },
    policyReconciliation('4a71eb12-48b8-44b7-8e90-09d9e14d6513', 'Q: Does Cloud Peptides provide dosage information? A: No.'),
    policyReconciliation('442f3a2d-2c55-42b8-a90a-2b8279677a7a', 'Q: What is the purpose of this page? A: This page summarizes publicly available scientific literature'),
    policyReconciliation('1fdaf81a-e3fd-49b5-948c-7d1bce5004fa', 'This page summarizes published scientific literature for educational purposes only.'),
    policyReconciliation('635a0160-8385-4a9a-82dd-f68c3a4843e2', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    policyReconciliation('ff461eeb-3496-4157-aef5-f34ddc5f64a3', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
