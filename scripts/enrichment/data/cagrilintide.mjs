/**
 * Cagrilintide — research enrichment. Sources verified via NCBI
 * E-utilities.
 *
 * Honest coverage note: cagrilintide has a strong, recent human RCT
 * evidence base (monotherapy Phase 2, and combination-with-semaglutide
 * "CagriSema" Phase 1b/2/3), but remains investigational — an FDA
 * decision on the CagriSema NDA was, per company disclosures, still
 * pending as of this review (filed December 2025, decision anticipated
 * late 2026). Not yet approved for any indication.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'cagrilintide',
  sources: [
    {
      key: 'pmid-34798060',
      sourceType: 'pubmed_article',
      title: 'Once-weekly cagrilintide for weight management in people with overweight and obesity: a multicentre, randomised, double-blind, placebo-controlled and active-controlled, dose-finding phase 2 trial.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/34798060/',
      publisherOrAgency: 'The Lancet',
      publicationDate: '2021-12-11',
      identifiers: { pmid: '34798060', doi: '10.1016/S0140-6736(21)01751-7' },
      study: {
        studyDesign: 'rct_human',
        population: 'Adults with overweight or obesity',
        intervention: 'Cagrilintide monotherapy (multiple doses), once weekly, subcutaneous',
        comparator: 'Placebo and active comparator (liraglutide 3.0 mg)',
        route: 'Subcutaneous injection',
        primaryOutcomes: 'Percent change in body weight',
        resultsSummary: 'Cagrilintide monotherapy produced dose-dependent weight loss significantly greater than placebo in this Phase 2 dose-finding trial.',
        limitations: 'Phase 2, not yet Phase 3-confirmed as monotherapy (subsequent development combined it with semaglutide rather than pursuing cagrilintide alone); industry-funded (Novo Nordisk).',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-33894838',
      sourceType: 'pubmed_article',
      title: 'Safety, tolerability, pharmacokinetics, and pharmacodynamics of concomitant administration of multiple doses of cagrilintide with semaglutide 2·4 mg for weight management.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/33894838/',
      publisherOrAgency: 'The Lancet',
      publicationDate: '2021-05-08',
      identifiers: { pmid: '33894838', doi: '10.1016/S0140-6736(21)00845-X' },
      study: {
        studyDesign: 'rct_human',
        population: 'Adults with overweight/obesity',
        intervention: 'Cagrilintide co-administered with semaglutide 2.4 mg, once weekly',
        comparator: 'Semaglutide alone; placebo',
        route: 'Subcutaneous injection',
        primaryOutcomes: 'Safety, tolerability, pharmacokinetics, pharmacodynamics',
        resultsSummary: 'Phase 1b trial establishing that co-administered cagrilintide + semaglutide was safe and tolerable, supporting progression to larger efficacy trials (the "CagriSema" program).',
        limitations: 'Phase 1b (safety/PK/PD focus, not powered for efficacy); industry-funded.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-37364590',
      sourceType: 'pubmed_article',
      title: 'Efficacy and safety of co-administered once-weekly cagrilintide 2·4 mg with once-weekly semaglutide 2·4 mg in type 2 diabetes: a multicentre, randomised, double-blind, active-controlled, phase 2 trial.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/37364590/',
      publisherOrAgency: 'The Lancet',
      publicationDate: '2023-08-26',
      identifiers: { pmid: '37364590', doi: '10.1016/S0140-6736(23)01163-7' },
      study: {
        studyDesign: 'rct_human',
        population: 'Adults with type 2 diabetes',
        intervention: 'CagriSema (cagrilintide + semaglutide 2.4 mg each), once weekly',
        comparator: 'Semaglutide alone; cagrilintide alone',
        route: 'Subcutaneous injection',
        duration: '32 weeks',
        resultsSummary: 'CagriSema produced significantly greater weight loss than either semaglutide or cagrilintide alone in adults with type 2 diabetes; HbA1c improvement was greater than cagrilintide alone but not significantly different from semaglutide alone.',
        limitations: 'Phase 2; industry-funded (Novo Nordisk).',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-40544433',
      sourceType: 'pubmed_article',
      title: 'Coadministered Cagrilintide and Semaglutide in Adults with Overweight or Obesity.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/40544433/',
      publisherOrAgency: 'New England Journal of Medicine',
      publicationDate: '2025-08-14',
      identifiers: { pmid: '40544433', nctNumber: 'NCT05567796' },
      study: {
        studyDesign: 'rct_human',
        population: 'Adults with overweight or obesity (REDEFINE-1 trial)',
        intervention: 'CagriSema (cagrilintide + semaglutide 2.4 mg each), once weekly',
        comparator: 'Placebo',
        route: 'Subcutaneous injection',
        duration: '68 weeks',
        primaryOutcomes: 'Percent change in body weight',
        resultsSummary: 'CagriSema produced significant, clinically relevant body-weight reduction versus placebo in this Phase 3 trial — the pivotal trial underlying Novo Nordisk\'s FDA New Drug Application.',
        limitations: 'Industry-funded (Novo Nordisk); as with all combination-product trials here, isolates the combination\'s effect, not cagrilintide monotherapy\'s effect specifically.',
        registrationNumber: 'NCT05567796',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'novo-cagrisema-nda-filing',
      sourceType: 'regulatory_announcement',
      title: 'Novo Nordisk files for FDA approval of CagriSema, the first once-weekly combination of GLP-1 and amylin analogues for weight management',
      url: 'https://www.prnewswire.com/news-releases/novo-nordisk-files-for-fda-approval-of-cagrisema-the-first-once-weekly-combination-of-glp1-and-amylin-analogues-for-weight-management-302645862.html',
      publisherOrAgency: 'Novo Nordisk (company announcement, distributed via PR Newswire)',
      publicationDate: '2025-12-18',
      identifiers: {},
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        'Cagrilintide is a long-acting amylin-receptor agonist (amylin analogue) — a mechanism distinct from GLP-1 receptor agonists like semaglutide — investigated for its role in satiety and appetite regulation.',
      evidenceQuality: 'moderate',
      qualityRationale: 'Mechanism of action consistent across all reviewed clinical publications.',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-34798060', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'summary',
      statement:
        'As monotherapy, once-weekly cagrilintide produced dose-dependent weight loss significantly greater than placebo in a Phase 2 trial. Cagrilintide\'s clinical development has since centered on combination with semaglutide ("CagriSema"): a Phase 3 trial (REDEFINE-1, NCT05567796) showed significant, clinically relevant weight loss versus placebo, and Novo Nordisk filed an FDA New Drug Application for CagriSema in December 2025, with a decision anticipated in late 2026 as of this review.',
      evidenceQuality: 'high',
      qualityRationale: 'Multiple large, randomized, double-blind, placebo-controlled trials including a Phase 3 pivotal trial in a top-tier journal — but all industry-funded (Novo Nordisk), and not yet FDA-approved.',
      interpretationStatus: 'supported',
      sources: [
        { sourceKey: 'pmid-34798060', relationship: 'directly_supports' },
        { sourceKey: 'pmid-40544433', relationship: 'directly_supports' },
      ],
    },
    {
      contentSection: 'regulatory',
      statement:
        'As of this review, cagrilintide (alone or as the CagriSema combination) has not received FDA approval for any indication. Novo Nordisk\'s CagriSema New Drug Application was filed in December 2025, based on the REDEFINE-1 and REDEFINE-2 Phase 3 trials, with an FDA decision anticipated in late 2026.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'novo-cagrisema-nda-filing', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      formulation: 'CagriSema — cagrilintide 2.4 mg + semaglutide 2.4 mg, once-weekly subcutaneous',
      indication: 'Chronic weight management (obesity/overweight)',
      regulatoryStatus: 'investigational',
      statusChangeDate: '2025-12-18',
      sourceKey: 'novo-cagrisema-nda-filing',
      notes:
        'New Drug Application filed by Novo Nordisk 2025-12-18; company guidance anticipates an FDA decision in Q4 2026 (not yet decided as of this review). This source is a company press release (distributed via PR Newswire), not an independent FDA record — the underlying NDA filing itself was not independently verified against FDA\'s own database in this review; flagged for follow-up confirmation once/if FDA publishes its own record.',
    },
  ],
  legacyReconciliations: [
    {
      legacyClaimId: '8d498ec6-2ae2-44bd-9d43-190cfb1e5e80',
      legacyStatementExcerpt: 'Cagrilintide is a long-acting amylin analogue being investigated for its role in appetite regulation and metabolic physiology',
      disposition: 'supported',
      rationale: 'Accurately describes the verified mechanism and research focus.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-34798060', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'b9e405cc-14a2-4f39-bcd1-62cbee3fa5e5',
      legacyStatementExcerpt: 'Because it acts through a pathway different from GLP-1 receptor agonists, Cagrilintide is frequently investigated alongside other metabolic compounds',
      disposition: 'supported',
      rationale: 'Confirmed — cagrilintide\'s primary clinical development pathway is specifically its combination with the GLP-1 agonist semaglutide (CagriSema).',
      evidenceQuality: 'high',
      interpretationStatus: 'supported',
      sources: [
        { sourceKey: 'pmid-33894838', relationship: 'directly_supports' },
        { sourceKey: 'pmid-40544433', relationship: 'directly_supports' },
      ],
    },
    {
      legacyClaimId: '88124776-bc20-4e1e-9da4-2a01552d2c48',
      legacyStatementExcerpt: 'Cagrilintide is designed to mimic the hormone amylin. Researchers investigate how amylin receptor activation influences appetite',
      disposition: 'supported',
      rationale: 'Confirmed mechanism, consistent with verified sources.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-34798060', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'ca68ca0e-b619-45c4-a705-c91a86b3a9b4',
      legacyStatementExcerpt: 'Q: What does Cagrilintide target? A: Cagrilintide is an amylin analogue investigated for its effects on amylin signaling',
      disposition: 'supported',
      rationale: 'Confirmed by verified sources.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-34798060', relationship: 'directly_supports' }],
    },
    policyReconciliation('f9f53bf3-0996-4873-82d3-39cbc853bf8d', 'Q: Does this page include dosage information? A: No.'),
    policyReconciliation('73ffed91-1afb-41d4-a482-779cfb5af65e', 'Q: Is this page educational? A: Yes.'),
    policyReconciliation('1aaac28e-d32e-4930-a91a-cdcbdb0da391', 'This page is provided for educational purposes only.'),
    policyReconciliation('e50c6afc-7a89-4978-b648-b5ba4d9960f8', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    policyReconciliation('5767ec34-dbb7-463c-9398-a12db3419fea', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
