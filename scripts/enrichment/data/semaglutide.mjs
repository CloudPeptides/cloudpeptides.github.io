/**
 * Semaglutide — research enrichment pilot data. All sources verified
 * via NCBI E-utilities and the FDA's own document repository before
 * being added. Semaglutide has an unusually large, high-quality human
 * RCT evidence base (unlike BPC-157) — this file selects a
 * representative subset (primary efficacy, a diabetes-population trial,
 * a large cardiovascular-outcomes trial, and a withdrawal/discontinuation
 * follow-up) rather than attempting exhaustive coverage of the full
 * literature within this pilot's scope.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'semaglutide',
  sources: [
    {
      key: 'pmid-33567185',
      sourceType: 'pubmed_article',
      title: 'Once-Weekly Semaglutide in Adults with Overweight or Obesity.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/33567185/',
      publisherOrAgency: 'New England Journal of Medicine',
      publicationDate: '2021-03-18',
      identifiers: { pmid: '33567185', doi: '10.1056/NEJMoa2032183', nctNumber: 'NCT03548935' },
      study: {
        studyDesign: 'rct_human',
        population: 'Adults with overweight or obesity, without diabetes (STEP 1 trial)',
        intervention: 'Semaglutide 2.4 mg once weekly, subcutaneous, plus lifestyle intervention',
        comparator: 'Placebo plus lifestyle intervention',
        route: 'Subcutaneous injection',
        duration: '68 weeks',
        primaryOutcomes: 'Percent change in body weight from baseline to week 68',
        resultsSummary:
          'Mean body-weight change was -14.9% with semaglutide versus -2.4% with placebo (estimated treatment difference -12.4 percentage points). More participants on semaglutide achieved >=5% weight loss than placebo.',
        limitations:
          'Excludes patients with type 2 diabetes; industry-funded (Novo Nordisk); GI adverse events more frequent with semaglutide.',
        registrationNumber: 'NCT03548935',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-33667417',
      sourceType: 'pubmed_article',
      title:
        'Semaglutide 2·4 mg once a week in adults with overweight or obesity, and type 2 diabetes (STEP 2): a randomised, double-blind, double-dummy, placebo-controlled, phase 3 trial.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/33667417/',
      publisherOrAgency: 'The Lancet',
      publicationDate: '2021-03-13',
      identifiers: { pmid: '33667417', doi: '10.1016/S0140-6736(21)00213-0' },
      study: {
        studyDesign: 'rct_human',
        population: 'Adults with overweight or obesity AND type 2 diabetes (STEP 2 trial)',
        intervention: 'Semaglutide 2.4 mg once weekly, subcutaneous',
        comparator: 'Semaglutide 1.0 mg (active comparator) and placebo',
        route: 'Subcutaneous injection',
        duration: '68 weeks',
        resultsSummary:
          "Semaglutide 2.4 mg produced significantly greater weight loss than both semaglutide 1.0 mg and placebo in a population with type 2 diabetes — a population generally more resistant to weight loss than STEP 1's non-diabetic cohort.",
        limitations:
          'Industry-funded (Novo Nordisk); double-dummy design adds complexity but supports blinding integrity.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-37952131',
      sourceType: 'pubmed_article',
      title: 'Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/37952131/',
      publisherOrAgency: 'New England Journal of Medicine',
      publicationDate: '2023-12-14',
      identifiers: { pmid: '37952131', doi: '10.1056/NEJMoa2307563' },
      study: {
        studyDesign: 'rct_human',
        population:
          'Adults 45+ with pre-existing cardiovascular disease and BMI >=27, without diabetes (SELECT trial, n=17,604)',
        sampleSize: 17604,
        intervention: 'Semaglutide 2.4 mg once weekly, subcutaneous',
        comparator: 'Placebo',
        route: 'Subcutaneous injection',
        primaryOutcomes:
          'Major adverse cardiovascular events (MACE): cardiovascular death, non-fatal MI, non-fatal stroke',
        resultsSummary:
          'Semaglutide reduced major adverse cardiovascular events by 20% versus placebo (hazard ratio reported by the trial) in this population with established cardiovascular disease and obesity/overweight but no diabetes.',
        limitations:
          'Population restricted to those with pre-existing cardiovascular disease — findings should not be generalized to primary-prevention populations without similar risk. Industry-funded (Novo Nordisk).',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-35441470',
      sourceType: 'pubmed_article',
      title:
        'Weight regain and cardiometabolic effects after withdrawal of semaglutide: The STEP 1 trial extension.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/35441470/',
      publisherOrAgency: 'Diabetes, Obesity and Metabolism',
      publicationDate: '2022-08-01',
      identifiers: { pmid: '35441470', doi: '10.1111/dom.14725' },
      study: {
        studyDesign: 'rct_human',
        population: 'STEP 1 trial participants followed after treatment withdrawal',
        intervention: 'Discontinuation of semaglutide after the STEP 1 treatment period',
        duration: '1 year post-withdrawal',
        resultsSummary:
          'Participants regained a majority of the weight they had lost within one year of stopping semaglutide, and cardiometabolic improvements seen during treatment also reverted toward baseline.',
        limitations:
          'Extension/follow-up analysis of a subset of the original STEP 1 cohort, not a fresh independent trial.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'fda-wegovy-label-2021',
      sourceType: 'fda_document',
      title: 'WEGOVY (semaglutide) injection, for subcutaneous use — original approval label',
      url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2021/215256s000lbl.pdf',
      publisherOrAgency: 'U.S. Food and Drug Administration',
      publicationDate: '2021-06-04',
      identifiers: {},
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'In adults with overweight or obesity without diabetes, once-weekly subcutaneous semaglutide 2.4 mg plus lifestyle intervention produced a mean body-weight reduction of 14.9% over 68 weeks, versus 2.4% with placebo plus lifestyle intervention (STEP 1 trial).',
      evidenceQuality: 'high',
      qualityRationale:
        'Large, multicenter, randomized, double-blind, placebo-controlled phase 3 trial published in a top-tier peer-reviewed journal.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-33567185', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'summary',
      statement:
        'The weight-loss effect of semaglutide 2.4 mg also holds in adults with overweight/obesity and type 2 diabetes (STEP 2 trial), though absolute weight loss in this population is typically smaller than in non-diabetic populations.',
      evidenceQuality: 'high',
      qualityRationale: 'Randomized, double-blind, double-dummy, placebo-controlled phase 3 trial.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-33667417', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'summary',
      statement:
        'In a large (n=17,604) randomized trial of adults with pre-existing cardiovascular disease and obesity/overweight but no diabetes, semaglutide 2.4 mg reduced major adverse cardiovascular events (cardiovascular death, non-fatal MI, non-fatal stroke) by 20% versus placebo (SELECT trial).',
      evidenceQuality: 'high',
      qualityRationale:
        'Large, multicenter, event-driven, randomized, double-blind, placebo-controlled superiority trial.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-37952131', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'safety',
      statement:
        'Gastrointestinal adverse events (nausea, diarrhea, vomiting, constipation), mostly mild-to-moderate, occurred more frequently with semaglutide than placebo across the STEP trial program.',
      evidenceQuality: 'high',
      qualityRationale:
        'Consistent safety signal reported across multiple large randomized controlled trials.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-33567185', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'summary',
      statement:
        'Weight loss achieved with semaglutide is not durable after discontinuation: STEP 1 trial participants regained most of the lost weight, and cardiometabolic improvements reverted toward baseline, within one year of stopping treatment.',
      evidenceQuality: 'moderate',
      qualityRationale:
        'Extension/follow-up analysis of the original STEP 1 randomized cohort, not an independently powered new trial.',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-35441470', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      formulation: 'Wegovy — 2.4 mg once-weekly subcutaneous injection',
      indication:
        'Chronic weight management in adults with obesity, or overweight with a weight-related comorbidity',
      regulatoryStatus: 'approved',
      effectiveDate: '2021-06-04',
      sourceKey: 'fda-wegovy-label-2021',
      notes:
        "Original approval under NDA 215256, sponsor Novo Nordisk. Subsequent label updates have added a cardiovascular-risk-reduction indication (based on the SELECT trial) and a MASH (liver disease) indication — not independently re-verified in this pilot review. This approval applies specifically to the Wegovy (and separately, Ozempic) branded products manufactured by Novo Nordisk, in their approved formulations, routes, and indications — it does not extend to compounded, research-grade, differently-formulated, or independently-sold semaglutide products, which remain unapproved regardless of the parent molecule's regulatory history.",
    },
  ],
  // Closeout pass (2026-08-07): reconciles the 9 pre-existing legacy
  // claims that predate this pipeline's legacy-claim-reconciliation
  // feature. One correction applied here that was NOT part of the
  // original pilot: the site's "research purposes only, not for human
  // consumption" disclaimer was initially assumed to be in tension with
  // semaglutide's real FDA approval (Ozempic/Wegovy) — on review, that
  // reasoning was wrong. FDA approval attaches to a specific drug
  // product (manufacturer, formulation, route, indication, labeling),
  // not to every product containing the same molecular entity. A
  // vendor's unapproved, research-grade semaglutide product is
  // correctly labeled "not for human consumption" even though Novo
  // Nordisk's Ozempic/Wegovy are approved — those are not the same
  // product. See the batch closeout for the fuller correction of this
  // same reasoning error across 8 other compounds.
  legacyReconciliations: [
    {
      legacyClaimId: 'fd3faf20-adf6-4f9c-bc30-5aade7fc5e20',
      legacyStatementExcerpt:
        'Semaglutide is a GLP-1 receptor agonist that has become one of the most extensively studied compounds in metabolic research',
      disposition: 'supported',
      rationale: 'Directly confirmed by the large STEP/SELECT trial program verified in this file.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-33567185', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '23ae369d-ec5b-4f71-a91a-e76d804164db',
      legacyStatementExcerpt:
        'By selectively activating the GLP-1 receptor, researchers explore how this pathway influences food intake, energy balance, and cardiometabolic physiol',
      disposition: 'supported',
      rationale:
        'Food intake/energy balance confirmed by the STEP trials; cardiometabolic physiology confirmed by the SELECT trial.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [
        { sourceKey: 'pmid-33567185', relationship: 'directly_supports' },
        { sourceKey: 'pmid-37952131', relationship: 'directly_supports' },
      ],
    },
    {
      legacyClaimId: 'd30fdb5d-9558-4f91-aef0-1cda8561e05b',
      legacyStatementExcerpt:
        'Semaglutide activates the GLP-1 receptor, a signaling pathway involved in appetite regulation and metabolic control',
      disposition: 'supported',
      rationale: 'Directly confirmed mechanism.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-33567185', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '13fc5dd2-d408-48e9-8a58-c16d9247569f',
      legacyStatementExcerpt:
        'Q: What receptor does Semaglutide target? A: Semaglutide is designed to activate the GLP-1 receptor',
      disposition: 'supported',
      rationale: 'Directly confirmed.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-33567185', relationship: 'directly_supports' }],
    },
    policyReconciliation(
      '99e0482e-2530-4e8c-a4af-026d7829c9c8',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      '0bd75aab-c207-4ab0-b91f-f2a5a2ddcfa5',
      'Q: Is this page educational? A: Yes.',
    ),
    policyReconciliation(
      '22ccf701-842e-452b-8e82-5076b1aaa2e8',
      'This page is provided for educational purposes only.',
    ),
    policyReconciliation(
      '88c65715-e38e-4423-92ed-7b00d18bf1f2',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    {
      legacyClaimId: '36f30fd8-4862-4cfb-ac7d-f43afd0aefdd',
      legacyStatementExcerpt:
        'All products are intended strictly for laboratory research purposes only and are not for human consumption',
      disposition: 'supported',
      rationale:
        'Semaglutide has real FDA-approved drug products (Ozempic for type 2 diabetes, Wegovy for chronic weight management — both manufactured by Novo Nordisk). This does NOT make the disclaimer wrong: FDA approval attaches to a specific drug product — its manufacturer, formulation, route, indication, and labeling — not to every product containing the same molecular entity. An unapproved, research-grade semaglutide product sold for research use is correctly and appropriately labeled "not for human consumption," regardless of Ozempic/Wegovy\'s approval, because it is not that approved product: different manufacturing process/quality controls, different (or absent) formulation/excipients, and no FDA review of this specific material. This distinction is recorded in the regulatory record above (Novo Nordisk, NDA 215256, Wegovy-specific).',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-wegovy-label-2021', relationship: 'directly_supports' }],
    },
  ],
};
