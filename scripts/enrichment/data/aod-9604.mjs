/**
 * AOD-9604 — research enrichment. Sources verified via NCBI E-utilities,
 * ClinicalTrials.gov-equivalent registry corroboration, and USADA/WADA
 * guidance.
 *
 * Honest coverage note: AOD-9604 has an unusually complete human
 * clinical record among the compounds in this database — six Phase
 * I/IIa/IIb trials (~893 subjects) confirming safety/tolerability, but
 * its pivotal Phase IIb obesity efficacy trial FAILED to show a
 * statistically significant weight-loss difference versus placebo,
 * and its sponsor (Metabolic Pharmaceuticals) discontinued development
 * in 2007. This is a real, negative human efficacy result — represented
 * as such, not omitted or softened.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'aod-9604',
  sources: [
    {
      key: 'pmid-11146367',
      sourceType: 'pubmed_article',
      title: 'Metabolic studies of a synthetic lipolytic domain (AOD9604) of human growth hormone.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/11146367/',
      publisherOrAgency: 'Hormone Research',
      publicationDate: '2000',
      identifiers: { pmid: '11146367', doi: '10.1159/000053183' },
      study: {
        studyDesign: 'animal_study',
        population: 'Mice',
        intervention: 'AOD9604, oral, 500 microg/kg/day for 19 days',
        comparator: 'Untreated controls',
        resultsSummary:
          'Reduced body-weight gain by over 50% versus control, without adversely affecting insulin sensitivity (assessed by euglycemic clamp).',
        limitations: 'Mouse study only.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-11713213',
      sourceType: 'pubmed_article',
      title:
        'The effects of human GH and its lipolytic fragment (AOD9604) on lipid metabolism following chronic treatment in obese mice and beta(3)-AR knock-out mice.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/11713213/',
      publisherOrAgency: 'Endocrinology',
      publicationDate: '2001-12',
      identifiers: { pmid: '11713213', doi: '10.1210/endo.142.12.8522' },
      study: {
        studyDesign: 'animal_study',
        population: 'Obese mice and beta(3)-adrenergic-receptor knock-out mice',
        intervention: 'AOD9604 versus full-length human growth hormone',
        resultsSummary:
          "Both hGH and AOD9604 increased repressed beta(3)-AR mRNA levels in obese mice toward lean-control levels, a proposed mechanism for AOD9604's lipolytic effect without hGH's growth-promoting activity.",
        limitations: 'Mouse study only.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'stier-2013-safety',
      sourceType: 'doi_article',
      title: 'Safety and Tolerability of the Hexadecapeptide AOD9604 in Humans.',
      url: 'https://doi.org/10.4021/jem157w',
      publisherOrAgency: 'Journal of Endocrinology and Metabolism',
      publicationDate: '2013-04',
      identifiers: { doi: '10.4021/jem157w' },
      study: {
        studyDesign: 'rct_human',
        population:
          'Healthy adults, primarily obese (BMI 30-35), ages 18-65, both sexes; pooled across 6 trials',
        sampleSize: 893,
        intervention:
          'AOD9604, IV infusion (25-400 microg/kg) or oral (0.25-54 mg/day) across six Phase I/IIa/IIb randomized, double-blind, placebo-controlled trials',
        comparator: 'Placebo',
        route: 'Intravenous and oral',
        primaryOutcomes:
          'Safety, tolerability, adverse events, IGF-1 levels, glucose tolerance, anti-AOD9604 antibody formation',
        resultsSummary:
          'AOD9604 showed a safety and tolerability profile indistinguishable from placebo across ~893 subjects: no treatment-related serious adverse events, no elevation of IGF-1 (i.e., no growth-hormone-like systemic effect), and no adverse effect on glucose metabolism.',
        limitations:
          'Safety/tolerability pooled analysis, not an efficacy trial; company-sponsor-affiliated authors (former Metabolic Pharmaceuticals personnel).',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'wada-aod9604-statement',
      sourceType: 'wada_list',
      title: 'WADA statement on substance AOD-9604',
      url: 'https://www.wada-ama.org/en/news/wada-statement-substance-aod-9604',
      publisherOrAgency: 'World Anti-Doping Agency (WADA)',
      publicationDate: '2013-04-22',
      identifiers: {},
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        "AOD9604 (a synthetic fragment corresponding to the C-terminal lipolytic domain of human growth hormone, amino acids 176-191) reduced body-weight gain in mice without adversely affecting insulin sensitivity, and shares with full-length hGH the ability to increase beta(3)-adrenergic-receptor expression in obese mice — proposed as its lipolytic mechanism, distinct from hGH's growth-promoting/IGF-1-elevating activity.",
      evidenceQuality: 'moderate',
      qualityRationale:
        'Peer-reviewed animal mechanistic and metabolic studies; consistent across two independent groups.',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-11146367', relationship: 'directly_supports' },
        { sourceKey: 'pmid-11713213', relationship: 'directly_supports' },
      ],
    },
    {
      contentSection: 'safety',
      statement:
        'Across six Phase I/IIa/IIb randomized, double-blind, placebo-controlled human trials (pooled n≈893), AOD9604 was well tolerated with a safety profile indistinguishable from placebo — no serious treatment-related adverse events, no IGF-1 elevation, and no adverse effect on glucose metabolism.',
      evidenceQuality: 'high',
      qualityRationale:
        'Large, multi-trial, randomized, placebo-controlled human safety dataset — one of the more complete human safety records among compounds reviewed in this pipeline, though sponsor-affiliated.',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'stier-2013-safety', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'summary',
      statement:
        "Despite a favorable safety profile, AOD9604's pivotal Phase IIb efficacy trial for obesity (approximately 536 subjects, 24 weeks) FAILED to demonstrate a statistically significant weight-loss difference versus placebo at its primary endpoint. Its sponsor, Metabolic Pharmaceuticals, discontinued clinical development in 2007, and AOD9604 has never received FDA or equivalent regulatory approval for any indication.",
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'stier-2013-safety', relationship: 'provides_context' }],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'World Anti-Doping Agency (WADA)',
      jurisdiction: 'International (competitive sport)',
      regulatoryStatus: 'banned_in_sport',
      sourceKey: 'wada-aod9604-statement',
      notes:
        'WADA clarified via official statement (2013-04-22) that AOD-9604 has been a prohibited substance since 2011. Reported as falling under the S0 (Non-Approved Substances) / S2 (Peptide Hormones, Growth Factors and Related Substances) categories depending on source — prohibited at all times in and out of competition either way.',
    },
    {
      agency:
        'U.S. Food and Drug Administration (FDA) / Australian Therapeutic Goods Administration (TGA)',
      jurisdiction: 'United States / Australia',
      indication: 'Obesity / weight management',
      regulatoryStatus: 'not_approved',
      statusChangeDate: '2007-01-01',
      sourceKey: 'stier-2013-safety',
      notes:
        "AOD9604 has never received FDA approval for any indication (no NDA has been filed to date, per this review). Its Phase IIb obesity efficacy trial failed its primary endpoint in 2007 and its sole clinical-stage sponsor, Metabolic Pharmaceuticals, discontinued the drug-development program the same year. Australia's TGA separately granted it a food/GRAS-equivalent ingredient status in 2012 — a food-ingredient classification, not a therapeutic drug approval; this review did not independently verify the TGA food-ingredient record via TGA's own database and flags it as needing direct TGA-source confirmation before being asserted as fact in published content.",
    },
  ],
  legacyReconciliations: [
    {
      legacyClaimId: 'af298b86-b37f-4e8f-8b4b-be8f65093cfe',
      legacyStatementExcerpt:
        'AOD-9604 is a modified fragment of human growth hormone investigated primarily for metabolic and adipose tissue research',
      disposition: 'supported',
      rationale:
        'Accurately describes AOD9604 as a metabolic/adipose research fragment rather than a growth-promoting hGH product; consistent with the verified mechanistic literature.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-11146367', relationship: 'directly_supports' },
        { sourceKey: 'pmid-11713213', relationship: 'directly_supports' },
      ],
    },
    {
      legacyClaimId: '0be92c94-89d4-41b9-b4fa-604e9826681b',
      legacyStatementExcerpt:
        'Research continues to explore its role in body composition, energy balance, and metabolic physiology',
      disposition: 'revised',
      rationale:
        'Framed as ongoing/open research, but the compound\'s actual clinical development program concluded in 2007 after a failed Phase IIb efficacy trial and has not resumed since, per verified sources. "Continues to explore" should be understood as referring only to earlier (pre-2008) mechanistic/animal research, not an active or ongoing human efficacy program.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'stier-2013-safety', relationship: 'contradicts' }],
    },
    {
      legacyClaimId: 'ae24a651-9466-42c9-acef-9ef3896f3a66',
      legacyStatementExcerpt:
        'Researchers investigate AOD-9604 for its potential interactions with pathways involved in fat metabolism',
      disposition: 'supported',
      rationale: 'Confirmed by the verified beta(3)-AR mechanistic study.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-11713213', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'bffa15cf-4593-4c42-b039-2a5c6ccddf61',
      legacyStatementExcerpt:
        'Q: Is AOD-9604 full-length growth hormone? A: No. It is a peptide fragment derived from human growth hormone',
      disposition: 'supported',
      rationale: 'Accurate structural description, confirmed by the verified literature.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-11146367', relationship: 'directly_supports' }],
    },
    policyReconciliation(
      '05492841-cfb3-4e90-9fc1-310117349944',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      'a9dee20e-3a1c-44bf-afb4-b862775725db',
      'Q: What is this page for? A: This page summarizes publicly available scientific literature',
    ),
    policyReconciliation(
      '9e203bd9-d2f6-403c-8a5f-2d670686586a',
      'This page is provided for educational purposes only.',
    ),
    policyReconciliation(
      'ee11ec23-2cde-44ff-a524-0dfbffb2e2be',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    policyReconciliation(
      'b6004b1c-01fe-4f3c-8b8f-625fdb392c23',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
