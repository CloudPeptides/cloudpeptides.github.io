/**
 * Tesamorelin — research enrichment. Sources verified via NCBI
 * E-utilities and the FDA's own approval letter.
 *
 * Note: Tesamorelin (Egrifta) is FDA-approved (2010) — a genuine
 * approved drug, not merely a research compound. Full independent
 * research for this compound's own page (previously only lightly
 * sourced as context for the Growth Hormone Fat Loss Stack in batch 3).
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'tesamorelin',
  sources: [
    {
      key: 'pmid-25038357',
      sourceType: 'pubmed_article',
      title:
        'Effect of tesamorelin on visceral fat and liver fat in HIV-infected patients with abdominal fat accumulation: a randomized clinical trial.',
      // PMC open-access full-text mirror, not the PubMed abstract page —
      // corrected 2026-08-08 (scripts/enrichment/fix-broken-citations-
      // 2026-08-08.mjs): the DOI identifier below resolves to a real
      // JAMA Network page that blocks automated link checkers; PMC hosts
      // the identical peer-reviewed article with no such block.
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4363137/',
      publisherOrAgency: 'JAMA',
      publicationDate: '2014-07-23',
      identifiers: { pmid: '25038357', doi: '10.1001/jama.2014.8334' },
      study: {
        studyDesign: 'rct_human',
        population: 'HIV-infected patients with abdominal fat accumulation (lipodystrophy)',
        intervention: 'Tesamorelin, subcutaneous injection',
        comparator: 'Placebo',
        route: 'Subcutaneous injection',
        duration: '26 weeks (with a 52-week extension phase)',
        primaryOutcomes: 'Visceral adipose tissue (VAT); liver fat',
        resultsSummary:
          'Tesamorelin significantly reduced visceral adipose tissue and liver fat versus placebo over 26 weeks, with the VAT reduction maintained through 52 weeks in patients who continued treatment in the extension phase. Did not significantly affect subcutaneous adipose tissue.',
        limitations:
          'Studied specifically in HIV-associated lipodystrophy — findings should not be generalized to other populations seeking visceral-fat reduction without that condition.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'fda-egrifta-approval',
      sourceType: 'fda_document',
      title: 'EGRIFTA (tesamorelin for injection) — FDA approval letter, NDA 22-505',
      url: 'https://www.accessdata.fda.gov/drugsatfda_docs/appletter/2010/022505s000ltr.pdf',
      publisherOrAgency: 'U.S. Food and Drug Administration',
      publicationDate: '2010-11-10',
      identifiers: {},
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        'Tesamorelin is a synthetic analog of growth hormone-releasing hormone (GHRH) that binds and activates the GHRH receptor in the pituitary, stimulating endogenous growth hormone (and downstream IGF-1) release.',
      evidenceQuality: 'high',
      qualityRationale:
        "Well-established mechanism confirmed by the FDA-approved product's own labeling and multiple Phase 3 trials.",
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-egrifta-approval', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'summary',
      statement:
        "In a randomized, placebo-controlled human trial of HIV-infected patients with abdominal fat accumulation (lipodystrophy), tesamorelin significantly reduced visceral adipose tissue and liver fat over 26 weeks, with the visceral-fat reduction maintained through a 52-week extension — the type of pivotal evidence underlying its FDA approval as Egrifta (manufactured by Theratechnologies Inc., NDA 22-505). That approval applies specifically to the Egrifta drug product — it does not extend to compounded, research-grade, or independently sold tesamorelin products, which remain unapproved regardless of the parent molecule's regulatory history.",
      evidenceQuality: 'high',
      qualityRationale:
        "Randomized, placebo-controlled trial in a top-tier journal (JAMA), part of the approved drug's pivotal evidence base.",
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-25038357', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      formulation: 'Tesamorelin for injection (Egrifta), manufactured by Theratechnologies Inc.',
      indication: 'Reduction of excess abdominal fat in HIV-infected patients with lipodystrophy',
      regulatoryStatus: 'approved',
      effectiveDate: '2010-11-10',
      sourceKey: 'fda-egrifta-approval',
      notes:
        "Approved under NDA 22-505 as a New Molecular Entity, manufacturer Theratechnologies Inc. Indication is specific to HIV-associated lipodystrophy — not a general approval for visceral fat reduction or body composition in other populations. Regulatory-identity note: this approval covers the specific Egrifta drug product only — its manufacturer, formulation, and approved labeling. It does not extend to compounded, generic-looking, research-grade, or independently sold tesamorelin preparations, which remain unapproved regardless of Egrifta's own approval.",
    },
  ],
  legacyReconciliations: [
    {
      legacyClaimId: 'cd1e441e-9f2f-4649-98f8-d664a2205941',
      legacyStatementExcerpt:
        'Tesamorelin is a synthetic analog of growth hormone-releasing hormone (GHRH)',
      disposition: 'revised',
      rationale:
        'Accurate mechanistically, but frames Tesamorelin purely as a research subject when it is in fact an FDA-approved drug (Egrifta, since 2010) for a specific indication — added as a new regulatory claim/record above.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-egrifta-approval', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'fa09f611-9b78-4453-8b30-2962b5e4feeb',
      legacyStatementExcerpt:
        'Current scientific literature explores its role in body composition, visceral adipose tissue biology, endocrine signaling, and metabolic health',
      disposition: 'supported',
      rationale:
        'Directly confirmed — visceral adipose tissue reduction is precisely the FDA-approved, pivotal-trial-demonstrated effect.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-25038357', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '7735ea78-67bd-4ad5-8871-146411ab0bef',
      legacyStatementExcerpt:
        "Tesamorelin binds to GHRH receptors in the pituitary, stimulating the body's own release of growth hormone",
      disposition: 'supported',
      rationale: 'Confirmed mechanism.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-egrifta-approval', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '1b4e1dac-5b29-493c-954a-31b89092c570',
      legacyStatementExcerpt:
        'Q: Is Tesamorelin a growth hormone? A: No. Tesamorelin is a GHRH analog that stimulates endogenous growth hormone release',
      disposition: 'supported',
      rationale: 'Accurate and confirmed.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-egrifta-approval', relationship: 'directly_supports' }],
    },
    policyReconciliation(
      '0c88f52e-744e-4d28-b07a-4b4b4bb9a65d',
      'Q: Does this page include dosage recommendations? A: No.',
    ),
    policyReconciliation(
      '9301b8bf-47ef-4be6-b5e3-18b3183ab072',
      'Q: What is this page for? A: This page summarizes publicly available scientific literature',
    ),
    policyReconciliation(
      'cffd3b10-7815-4d54-86ac-67e6ac7543af',
      'This page summarizes published scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      '0c0c26be-674a-4ced-8629-da6b35dd082d',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    {
      legacyClaimId: '2f60235e-f765-41fe-8c9f-f947eaaa725b',
      legacyStatementExcerpt:
        'All products are intended strictly for laboratory research purposes only and are not for human consumption',
      disposition: 'supported',
      rationale:
        'CORRECTED on closeout review (2026-08-07): previously misclassified as "contradicted." Egrifta\'s FDA approval (Theratechnologies Inc., NDA 22-505) applies to that specific drug product — not to every tesamorelin-containing research product. An unapproved, research-grade tesamorelin product is correctly labeled "not for human consumption" regardless of Egrifta\'s approval. Reclassified from "contradicted" to "supported."',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-egrifta-approval', relationship: 'directly_supports' }],
    },
  ],
};
