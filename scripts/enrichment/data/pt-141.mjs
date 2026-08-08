/**
 * PT-141 (Bremelanotide) — research enrichment. Sources verified via
 * NCBI E-utilities.
 *
 * Note: like Botulinum Toxin, HCG, and Melanotan I, PT-141/Bremelanotide
 * is FDA-approved (brand name Vyleesi, 2019) — a genuine approved drug,
 * not merely a research compound.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'pt-141',
  sources: [
    {
      key: 'pmid-31599840',
      sourceType: 'pubmed_article',
      title:
        'Bremelanotide for the Treatment of Hypoactive Sexual Desire Disorder: Two Randomized Phase 3 Trials.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/31599840/',
      publisherOrAgency: 'Obstetrics and Gynecology',
      publicationDate: '2019-11',
      identifiers: { pmid: '31599840', doi: '10.1097/AOG.0000000000003500' },
      study: {
        studyDesign: 'rct_human',
        population: 'Premenopausal women with hypoactive sexual desire disorder (HSDD)',
        intervention: 'Bremelanotide 1.75 mg, subcutaneous, as-needed',
        comparator: 'Placebo',
        route: 'Subcutaneous injection',
        duration: '24 weeks (two identical RECONNECT trials)',
        primaryOutcomes: 'Sexual desire; distress related to low sexual desire',
        resultsSummary:
          'Across two identical Phase 3, randomized, double-blind, placebo-controlled trials, bremelanotide produced statistically significant increases in sexual desire and statistically significant reductions in related distress versus placebo — the pivotal trials underlying its FDA approval as Vyleesi.',
        limitations:
          'Nausea, flushing, and headache occurred in >=10% of patients on bremelanotide in both trials, more frequently than placebo.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-16839319',
      sourceType: 'pubmed_article',
      title:
        'An effect on the subjective sexual response in premenopausal women with sexual arousal disorder by bremelanotide (PT-141), a melanocortin receptor agonist.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/16839319/',
      publisherOrAgency: 'The Journal of Sexual Medicine',
      publicationDate: '2006-07',
      identifiers: { pmid: '16839319', doi: '10.1111/j.1743-6109.2006.00268.x' },
      study: {
        studyDesign: 'rct_human',
        population: 'Premenopausal women with sexual arousal disorder',
        intervention: 'Bremelanotide (PT-141)',
        comparator: 'Placebo',
        resultsSummary:
          'An earlier trial reporting an effect on subjective sexual response — foundational human evidence preceding the later pivotal Phase 3 program.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'regulatory',
      statement:
        "PT-141 is the research name for bremelanotide, a melanocortin receptor agonist that the FDA approved (brand name Vyleesi, originally approved to AMAG Pharmaceuticals' NDA and marketed by developer Palatin Technologies, with commercial rights now held by Cosette Pharmaceuticals since late 2023) for hypoactive sexual desire disorder (HSDD) in premenopausal women, based on two identical Phase 3, randomized, double-blind, placebo-controlled trials (the RECONNECT trials) showing statistically significant improvement in sexual desire and reduced related distress versus placebo. Nausea, flushing, and headache occurred more often with bremelanotide than placebo. This approval applies specifically to the Vyleesi subcutaneous autoinjector product as approved and labeled — it does not extend to compounded, research-grade, differently formulated, or independently sold bremelanotide/PT-141 products, which remain unapproved regardless of the parent molecule's regulatory history.",
      evidenceQuality: 'high',
      qualityRationale:
        'Multiple randomized, double-blind, placebo-controlled Phase 3 human trials underlying an actual FDA approval — among the strongest evidence bases identified across this database.',
      interpretationStatus: 'established',
      sources: [
        { sourceKey: 'pmid-31599840', relationship: 'directly_supports' },
        { sourceKey: 'pmid-16839319', relationship: 'directly_supports' },
      ],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      formulation:
        'Bremelanotide 1.75 mg, subcutaneous autoinjector (Vyleesi) — commercial rights held by Cosette Pharmaceuticals as of late 2023/early 2024; originally approved to AMAG Pharmaceuticals, developed by Palatin Technologies',
      indication: 'Hypoactive sexual desire disorder (HSDD) in premenopausal women',
      regulatoryStatus: 'approved',
      effectiveDate: '2019-06-21',
      sourceKey: 'pmid-31599840',
      notes:
        "Approval based on the RECONNECT Phase 3 trial program. Approval is specific to premenopausal women with HSDD — not a general sexual-enhancement approval, and not approved for use in men. Manufacturer/commercial-rights chain (AMAG Pharmaceuticals at approval → Palatin Technologies as developer → Cosette Pharmaceuticals since ~Dec 2023) was not independently re-verified against the FDA's own record in this closeout — corroborated via company press releases and SEC filings, flagged for direct confirmation before being asserted with full precision in published content. Regulatory-identity note: this approval covers the specific Vyleesi autoinjector product only — its formulation, route, and approved labeling. It does not extend to compounded, research-grade, or independently sold bremelanotide/PT-141 preparations, which remain unapproved regardless of Vyleesi's own approval.",
    },
  ],
  legacyReconciliations: [
    {
      legacyClaimId: '32addc09-08bb-4110-9bd4-c0ba73f2a1cf',
      legacyStatementExcerpt:
        'PT-141, also known as Bremelanotide, is a synthetic melanocortin peptide investigated for neuroendocrine signaling and reproductive biology',
      disposition: 'revised',
      rationale:
        'Accurate mechanistically, but omits that this compound is FDA-approved (Vyleesi) — a significant regulatory fact, consistent with the pattern seen for Botulinum Toxin, HCG, and Melanotan I in earlier batches.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-31599840', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '683813ba-5bc1-41ab-9c31-4d93a39892de',
      legacyStatementExcerpt:
        'Laboratory studies explore PT-141 in models involving melanocortin receptor biology, neuroendocrine regulation, behavioral neuroscience, and reproductive physiology',
      disposition: 'revised',
      rationale:
        'Understates the evidence level — this is not merely "laboratory studies" but real Phase 3 human randomized controlled trials underlying an FDA approval.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-31599840', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'ef2d58c6-cbc5-40e9-a2cb-02b70ee6cb4c',
      legacyStatementExcerpt:
        'Researchers investigate PT-141 for its interaction with melanocortin receptors, particularly within central nervous system pathways',
      disposition: 'supported',
      rationale: 'Confirmed mechanism.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-31599840', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '2ad38e4d-b5a6-42e6-960d-2261bf9ab84b',
      legacyStatementExcerpt:
        'Q: What is PT-141 researched for? A: Research commonly focuses on melanocortin receptor signaling, neuroendocrine biology, reproductive physiology',
      disposition: 'revised',
      rationale:
        'Accurate but understates the actual clinical/regulatory status — it is an approved drug for a specific indication (HSDD), not solely a research subject.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-31599840', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '01a1ab59-222b-4bcb-9b56-11d757f49476',
      legacyStatementExcerpt:
        'Q: Why is PT-141 also called Bremelanotide? A: Bremelanotide is the commonly used scientific and pharmaceutical name for PT-141',
      disposition: 'supported',
      rationale:
        'Accurate and confirmed by all verified sources, which use "bremelanotide" as the formal name.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-31599840', relationship: 'directly_supports' }],
    },
    policyReconciliation(
      '78f38b31-05c0-4101-b43e-9cb4be127788',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      'b758ceef-88d2-4ce7-9ed2-61d2e61dceb7',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      '47076004-17bd-4902-b3f0-c2bd5d742e4d',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    {
      legacyClaimId: '63fc3c1f-2bf7-42d7-8c75-0f813a84ff1b',
      legacyStatementExcerpt:
        'All products are intended strictly for laboratory research purposes only and are not for human consumption',
      disposition: 'supported',
      rationale:
        'CORRECTED on closeout review (2026-08-07): previously misclassified as "contradicted." Vyleesi\'s FDA approval applies to that specific autoinjector product — not to every bremelanotide/PT-141-containing product. An unapproved, research-grade PT-141 product is correctly labeled "not for human consumption" regardless of Vyleesi\'s approval. Reclassified from "contradicted" to "supported."',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-31599840', relationship: 'directly_supports' }],
    },
  ],
};
