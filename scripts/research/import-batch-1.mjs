#!/usr/bin/env node
/**
 * Research DB expansion — Batch 1: GH-axis secretagogues.
 * GHRP-2, GHRP-6, Hexarelin, Gonadorelin, PEG-MGF.
 *
 * Run manually, locally, from the repo root:
 *   node scripts/research/import-batch-1.mjs
 *
 * Idempotent — see scripts/research/lib/import-helpers.mjs. Every
 * compound is inserted as status='draft'; nothing here is ever
 * auto-published. Every citation below was independently verified via
 * WebSearch/WebFetch against PubMed (eutils), Europe PMC/PMC, or the
 * cited agency's own site during this research pass — see each
 * compound's raw_import_metadata.research_provenance for search date/
 * terms/databases.
 */
import {
  getServiceClient,
  importCompound,
  standardBoilerplateClaims,
} from './lib/import-helpers.mjs';

const SEARCH_DATE = '2026-08-19';
const DATABASES = ['PubMed/MEDLINE (via NCBI eutils)', 'WADA Prohibited List', 'DailyMed (NIH)'];
const BATCH = 'batch-1-gh-secretagogues';

const WADA_SOURCE = {
  sourceType: 'wada_list',
  title:
    'The Prohibited List — S2. Peptide Hormones, Growth Factors, Related Substances and Mimetics',
  url: 'https://www.wada-ama.org/en/prohibited-list',
  publisherOrAgency: 'World Anti-Doping Agency',
  retrievedDate: SEARCH_DATE,
};

const compounds = [
  // -----------------------------------------------------------------
  // GHRP-2 (Pralmorelin)
  // -----------------------------------------------------------------
  {
    slug: 'ghrp-2',
    name: 'GHRP-2',
    entityKind: 'peptide',
    category: 'Growth Hormone Secretagogues',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: ['GHRP-2 pralmorelin PubMed clinical trial', 'WADA S2 GHRP'],
    batch: BATCH,
    overviewWhatItIs:
      'GHRP-2 (pralmorelin) is a synthetic hexapeptide that stimulates the release of growth hormone from the pituitary gland by acting on the ghrelin/growth hormone secretagogue receptor (GHS-R1a).',
    overviewWhyPeopleUseIt:
      'It is most often discussed in the context of growth hormone stimulation. Commonly claimed or investigated uses include diagnostic testing of pituitary growth hormone reserve and, historically, treatment of growth hormone deficiency — the latter was studied in clinical trials that did not lead to approval. These are claimed and investigated uses, not established, FDA-approved indications in the United States.',
    overviewResearchSummary:
      'Human research: a controlled critical-illness study and a regulatory/development review. No published Phase III human efficacy trials or long-term human safety studies were located in the databases searched as of 2026-08-19. Regulatory status recorded for this compound: banned in sport, not approved (US) — see the Regulatory Status section below for jurisdiction-level detail.',
    overviewBottomLine:
      'Limited evidence base: development-stage clinical data and one diagnostic-approval history exist, but no FDA-approved product exists, and long-term human safety data are lacking.',
    administrationContext:
      'Human research located for GHRP-2 used intravenous infusion (critical-illness study) and injectable administration (diagnostic-testing history); an intranasal spray formulation was evaluated in Phase II pediatric trials in Japan. No published data address subcutaneous self-administration, the form most commonly discussed by non-clinical research-chemical vendors.',
    aliases: [
      { alias: 'Pralmorelin', type: 'generic_name' },
      { alias: 'GPA 748', type: 'development_code' },
      {
        alias: 'KP-102D',
        type: 'development_code',
        note: 'Japanese diagnostic-formulation development code.',
      },
      {
        alias: 'KP-102LN',
        type: 'development_code',
        note: 'Japanese therapeutic-formulation development code.',
      },
    ],
    sources: {
      drugProfile: {
        sourceType: 'pubmed_article',
        title:
          'Pralmorelin: GHRP 2, GPA 748, growth hormone-releasing peptide 2, KP-102 D, KP-102 LN, KP-102D, KP-102LN',
        url: 'https://pubmed.ncbi.nlm.nih.gov/15230633/',
        publisherOrAgency: 'Drugs R D',
        publicationDate: '2004-01-01',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '15230633' },
      },
      criticalIllnessRCT: {
        sourceType: 'pubmed_article',
        title:
          'The combined administration of GH-releasing peptide-2 (GHRP-2), TRH and GnRH to men with prolonged critical illness evokes superior endocrine and metabolic effects compared to treatment with GHRP-2 alone',
        url: 'https://pubmed.ncbi.nlm.nih.gov/12030918/',
        publisherOrAgency: 'Clinical Endocrinology (Oxford)',
        publicationDate: '2002-05-01',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '12030918' },
      },
      wadaList: WADA_SOURCE,
    },
    studies: [
      {
        sourceKey: 'criticalIllnessRCT',
        studyDesign: 'rct_human',
        population:
          '33 men with prolonged critical illness (vs. 50 age/BMI-matched healthy controls at baseline)',
        sampleSize: 33,
        comparator:
          'Placebo vs. GHRP-2 alone vs. GHRP-2+TRH vs. GHRP-2+TRH+pulsatile GnRH (4 arms, n=7-9 each)',
        intervention:
          'GHRP-2 1 mcg/kg/h IV infusion, +/- TRH 1 mcg/kg/h IV, +/- pulsatile GnRH 0.1 mcg/kg every 90 min',
        route: 'Intravenous infusion (GHRP-2/TRH); pulsatile intravenous bolus (GnRH)',
        duration: '5 days, with 24-hour hormonal assessments',
        primaryOutcomes:
          'GH/TSH/LH axis reactivation, testosterone levels, metabolic markers (ureagenesis)',
        resultsSummary:
          'Triple combination reactivated the GH, TSH, and LH axes with testosterone increases up to 312% and reduced ureagenesis; single or dual regimens showed limited benefit. GHRP-2 alone or with TRH (without GnRH) increased lactate and white blood cell counts, an effect not seen with the triple combination.',
        limitations:
          'Small arm sizes (n=7-9 per arm); short 5-day duration; critically ill ICU population, not generalizable to healthy adults or other proposed uses.',
        peerReviewStatus: 'peer_reviewed',
      },
    ],
    claims: [
      {
        section: 'summary',
        statement:
          "GHRP-2 (pralmorelin) is a synthetic hexapeptide growth hormone secretagogue that mimics ghrelin's action at the growth hormone secretagogue receptor (GHS-R1a), stimulating pituitary growth hormone release.",
        evidenceQuality: 'moderate',
        qualityRationale:
          'Established pharmacology, described in a peer-reviewed drug-profile review.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'drugProfile' }],
      },
      {
        section: 'mechanism',
        statement:
          'GHRP-2 markedly elevates plasma growth hormone in healthy adults; the GH-releasing response is blunted in patients with growth hormone deficiency, which is the pharmacological basis of its historical use as a diagnostic stimulation test.',
        evidenceQuality: 'moderate',
        qualityRationale: 'Drug-profile review summarizing multiple pharmacology studies.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'drugProfile' }],
      },
      {
        section: 'regulatory',
        statement:
          'In Japan, a diagnostic formulation (KP-102D) has development/regulatory history for evaluating hypothalamic-pituitary growth hormone secretory capacity, and a therapeutic formulation (KP-102LN) for short stature reached Phase II trials in Japan.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Single review-article source; independent confirmation of current Japanese approval status was not obtained in this pass.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'drugProfile' }],
      },
      {
        section: 'regulatory',
        statement:
          'A Phase II program to develop GHRP-2 as a treatment for adult growth hormone deficiency was conducted in the United States (Wyeth) but was discontinued; no GHRP-2 product has received FDA approval for any indication.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Drug-profile review; primary FDA correspondence was not independently retrieved.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'drugProfile' }],
      },
      {
        section: 'summary',
        statement:
          'In a randomized, placebo-controlled study of 33 men with prolonged critical illness, combined GHRP-2 + TRH + pulsatile GnRH infusion reactivated the GH, TSH, and LH hormonal axes and increased testosterone levels, with a greater effect than GHRP-2 alone.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Peer-reviewed RCT, but small per-arm sample sizes in a critically ill population.',
        interpretationStatus: 'preliminary',
        sourceKeys: [{ key: 'criticalIllnessRCT' }],
      },
      {
        section: 'safety',
        statement:
          'In the same critical-illness study, GHRP-2 administered alone or combined with TRH (without GnRH) was associated with increased blood lactate and white blood cell counts; the clinical significance of this finding outside that specific ICU population is not established.',
        evidenceQuality: 'low',
        qualityRationale: 'Single small study, specific critically-ill population.',
        interpretationStatus: 'insufficient',
        sourceKeys: [{ key: 'criticalIllnessRCT' }],
      },
      {
        section: 'regulatory',
        statement:
          "GHRP-2 (pralmorelin) is listed under the World Anti-Doping Agency's S2 category (Peptide Hormones, Growth Factors, Related Substances and Mimetics) and is prohibited at all times in competitive sport.",
        evidenceQuality: 'high',
        qualityRationale: "Directly verified against WADA's own published Prohibited List.",
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'wadaList' }],
      },
      {
        section: 'safety',
        statement:
          'No publicly available peer-reviewed studies describing long-term human safety outcomes of GHRP-2 use were located in the databases searched as of 2026-08-19.',
        interpretationStatus: 'insufficient',
      },
      ...standardBoilerplateClaims('GHRP-2'),
    ],
    regulatoryRecords: [
      {
        agency: 'PMDA (Japan)',
        jurisdiction: 'Japan',
        formulation: 'KP-102D',
        indication: 'Diagnostic test for growth hormone secretory capacity',
        regulatoryStatus: 'investigational',
        notes:
          'Per a 2004 Drugs R.D. review, the diagnostic formulation was awaiting/receiving approval in Japan as of that date; current approval status has not been independently reconfirmed beyond this source.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'drugProfile',
      },
      {
        agency: 'FDA',
        jurisdiction: 'United States',
        regulatoryStatus: 'not_approved',
        notes:
          'Phase II development for adult GH deficiency (Wyeth) was discontinued; no FDA approval for any indication.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'drugProfile',
      },
      {
        agency: 'World Anti-Doping Agency',
        jurisdiction: 'International (sport)',
        regulatoryStatus: 'banned_in_sport',
        notes:
          'Listed under S2 (Peptide Hormones, Growth Factors, Related Substances and Mimetics), prohibited at all times.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'wadaList',
      },
    ],
  },

  // -----------------------------------------------------------------
  // GHRP-6
  // -----------------------------------------------------------------
  {
    slug: 'ghrp-6',
    name: 'GHRP-6',
    entityKind: 'peptide',
    category: 'Growth Hormone Secretagogues',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: ['GHRP-6 growth hormone releasing peptide 6 PubMed human study'],
    batch: BATCH,
    overviewWhatItIs:
      'GHRP-6 is a synthetic hexapeptide growth hormone secretagogue, structurally related to GHRP-2, that stimulates pituitary growth hormone release via the ghrelin receptor (GHS-R1a).',
    overviewWhyPeopleUseIt:
      'It is most often discussed in the context of growth hormone stimulation, and separately, wound-healing research. Commonly claimed or investigated uses include GH secretion testing/stimulation and topical wound-healing applications, based on early-stage animal research. These are investigated uses, not established, FDA-approved indications.',
    overviewResearchSummary:
      'Human research: a small (n=13) pediatric single-dose GH-response study. Animal research: rat/rabbit topical wound-healing studies. No published Phase III human efficacy trials or long-term human safety studies were located in the databases searched as of 2026-08-19.',
    overviewBottomLine:
      'Early-stage evidence base: mechanistic and small human GH-response data exist, plus promising animal wound-healing data, but no controlled human efficacy trials for any indication and no FDA approval.',
    administrationContext:
      'The located human study used oral administration (300 mcg/kg); the located animal wound-healing studies used topical gel application. No published data address subcutaneous injection, the form most commonly discussed by non-clinical research-chemical vendors.',
    aliases: [],
    sources: {
      pediatricStudy: {
        sourceType: 'pubmed_article',
        title:
          'Growth hormone-releasing effect of oral growth hormone-releasing peptide 6 (GHRP-6) administration in children with short stature',
        url: 'https://pubmed.ncbi.nlm.nih.gov/7581965/',
        publisherOrAgency: 'European Journal of Endocrinology',
        publicationDate: '1995-01-01',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '7581965' },
      },
      mechanismStudy: {
        sourceType: 'pubmed_article',
        title:
          'Growth hormone (GH)-releasing peptide-6 requires endogenous hypothalamic GH-releasing hormone for maximal GH stimulation',
        url: 'https://pubmed.ncbi.nlm.nih.gov/9543138/',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '9543138' },
      },
      woundHealingAnimal: {
        sourceType: 'doi_article',
        title:
          'Growth Hormone-Releasing Peptide 6 Enhances the Healing Process and Improves the Esthetic Outcome of the Wounds',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4854984/',
        publisherOrAgency: 'Plastic Surgery International',
        publicationDate: '2016-01-01',
        retrievedDate: SEARCH_DATE,
        identifiers: { doi: '10.1155/2016/4361702', other: 'PMCID: PMC4854984' },
      },
      wadaList: WADA_SOURCE,
    },
    studies: [
      {
        sourceKey: 'pediatricStudy',
        studyDesign: 'non_randomized_human_trial',
        population:
          '13 prepubertal children (9 boys, 4 girls, ages 6.2-10.5) with normal short stature',
        sampleSize: 13,
        comparator: 'Oral GHRP-6 vs. IV GHRH-29 vs. oral GHRP-6 + arginine',
        intervention: 'Oral GHRP-6 300 mcg/kg; IV GHRH-29 1 mcg/kg',
        route: 'Oral and intravenous',
        duration: 'Single-dose acute testing',
        primaryOutcomes: 'Peak growth hormone response',
        resultsSummary:
          'Oral GHRP-6 produced peak GH responses comparable to IV GHRH (18.8 +/- 3.0 vs. 20.8 +/- 4.5 micrograms/L respectively).',
        limitations:
          'Small sample (n=13), single-dose acute design, short-stature (not GH-deficient) pediatric population — not generalizable to adults or chronic dosing.',
        peerReviewStatus: 'peer_reviewed',
      },
      {
        sourceKey: 'woundHealingAnimal',
        studyDesign: 'animal_study',
        population:
          'Wistar rats (wound-closure model) and New Zealand rabbits (hypertrophic-scar model)',
        intervention: 'Topical GHRP-6 400 mcg/mL in carboxymethylcellulose gel vs. vehicle',
        route: 'Topical',
        resultsSummary:
          'GHRP-6 accelerated wound closure in rats (p<0.001) and reduced abnormal scarring in rabbits (90.5% of treated wounds vs. 12.5% of controls); reduced inflammatory infiltrate and fibrogenic cytokine (TGFB1, CTGF) expression without impairing angiogenesis.',
        limitations:
          'Animal models only (rat/rabbit); topical route studied, not injectable; no human wound-healing data located.',
        peerReviewStatus: 'peer_reviewed',
      },
    ],
    claims: [
      {
        section: 'summary',
        statement:
          'GHRP-6 is a synthetic hexapeptide growth hormone secretagogue that stimulates pituitary growth hormone release via the ghrelin receptor (GHS-R1a) and requires intact hypothalamic GHRH signaling for its full effect in humans.',
        evidenceQuality: 'moderate',
        qualityRationale: 'Established mechanistic pharmacology from peer-reviewed sources.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'mechanismStudy' }],
      },
      {
        section: 'mechanism',
        statement:
          'GHRP-6 stimulates the phosphatidylinositol (PI) second-messenger pathway in pituitary somatotroph cells via protein kinase C and calcium, independent of the cAMP pathway used by GHRH.',
        evidenceQuality: 'moderate',
        qualityRationale: 'In-vitro mechanistic finding, single source.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'mechanismStudy' }],
      },
      {
        section: 'summary',
        statement:
          'In 13 children with normal short stature, a single oral dose of GHRP-6 (300 mcg/kg) produced a peak growth hormone response comparable to intravenous GHRH.',
        evidenceQuality: 'moderate',
        qualityRationale: 'Small (n=13), single-dose pediatric study, not a treatment trial.',
        interpretationStatus: 'preliminary',
        sourceKeys: [{ key: 'pediatricStudy' }],
      },
      {
        section: 'summary',
        statement:
          'In separate rat and rabbit studies, topical GHRP-6 accelerated wound closure and reduced hypertrophic scarring, with reduced inflammatory and fibrogenic markers at the wound site.',
        evidenceQuality: 'moderate',
        qualityRationale: 'Peer-reviewed animal studies; no human wound-healing data exist.',
        interpretationStatus: 'preliminary',
        sourceKeys: [{ key: 'woundHealingAnimal' }],
      },
      {
        section: 'regulatory',
        statement:
          "GHRP-6 is listed under the World Anti-Doping Agency's S2 category (Peptide Hormones, Growth Factors, Related Substances and Mimetics) and is prohibited at all times in competitive sport.",
        evidenceQuality: 'high',
        qualityRationale: "Directly verified against WADA's own published Prohibited List.",
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'wadaList' }],
      },
      {
        section: 'safety',
        statement:
          'No published Phase III human efficacy trials, and no long-term human safety data, were located in the databases searched as of 2026-08-19.',
        interpretationStatus: 'insufficient',
      },
      ...standardBoilerplateClaims('GHRP-6'),
    ],
    regulatoryRecords: [
      {
        agency: 'World Anti-Doping Agency',
        jurisdiction: 'International (sport)',
        regulatoryStatus: 'banned_in_sport',
        notes: 'Listed under S2, prohibited at all times.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'wadaList',
      },
    ],
  },

  // -----------------------------------------------------------------
  // Hexarelin
  // -----------------------------------------------------------------
  {
    slug: 'hexarelin',
    name: 'Hexarelin',
    entityKind: 'peptide',
    category: 'Growth Hormone Secretagogues',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: [
      'Hexarelin human study PubMed growth hormone cardioprotective',
      'WADA S2 examorelin',
    ],
    batch: BATCH,
    overviewWhatItIs:
      'Hexarelin (examorelin) is a synthetic hexapeptide growth hormone secretagogue, related to GHRP-6, that is also studied for growth-hormone-independent cardioprotective effects.',
    overviewWhyPeopleUseIt:
      'It is most often discussed in the context of growth hormone stimulation and, in preclinical research, cardiac tissue protection. These are investigated uses studied primarily in animal models, not established, FDA-approved indications.',
    overviewResearchSummary:
      'Human research: one controlled dose-response pharmacokinetic study in healthy men. Animal research: multiple rodent studies on GH-independent cardioprotective effects (ischemia-reperfusion, myocardial infarction models). No published human efficacy trials for cardioprotection or any other indication were located in the databases searched as of 2026-08-19.',
    overviewBottomLine:
      'Mixed evidence base: GH-releasing pharmacology is well characterized in a small human study, but the more widely discussed cardioprotective effects have only been studied in animal models, not humans.',
    administrationContext:
      'The located human study used intravenous bolus injection. Animal cardioprotective studies used intravenous or intraperitoneal administration, or isolated/perfused-heart models. No published human data address subcutaneous self-administration.',
    aliases: [{ alias: 'Examorelin', type: 'generic_name' }],
    sources: {
      doseResponseHuman: {
        sourceType: 'pubmed_article',
        title: 'Growth hormone-releasing activity of hexarelin in humans. A dose-response study',
        url: 'https://pubmed.ncbi.nlm.nih.gov/7957536/',
        publisherOrAgency: 'European Journal of Clinical Pharmacology',
        publicationDate: '1994-01-01',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '7957536' },
      },
      cardioprotectionAnimal1: {
        sourceType: 'pubmed_article',
        title: 'Growth hormone-independent cardioprotective effects of hexarelin in the rat',
        url: 'https://pubmed.ncbi.nlm.nih.gov/10465272/',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '10465272' },
      },
      cardioprotectionAnimal2: {
        sourceType: 'pubmed_article',
        title:
          'The growth hormone secretagogue hexarelin improves cardiac function in rats after experimental myocardial infarction',
        url: 'https://pubmed.ncbi.nlm.nih.gov/10614623/',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '10614623' },
      },
      wadaList: WADA_SOURCE,
    },
    studies: [
      {
        sourceKey: 'doseResponseHuman',
        studyDesign: 'rct_human',
        population: '12 healthy adult male volunteers',
        sampleSize: 12,
        comparator: 'Placebo vs. three hexarelin doses',
        intervention: 'Single IV bolus hexarelin at 0.5, 1, or 2 micrograms/kg',
        route: 'Intravenous bolus',
        duration: 'Single dose, ~4-hour pharmacokinetic follow-up',
        primaryOutcomes: 'Peak plasma GH concentration, GH pharmacokinetics',
        resultsSummary:
          'Plasma GH increased dose-dependently, peaking ~30 min post-injection (range 3.9-55.0 ng/mL across placebo/doses); ED50 approximately 0.50 mcg/kg (Cmax) and 0.64 mcg/kg (AUC); elimination half-life approximately 55 minutes.',
        limitations:
          'Small (n=12), single-dose, healthy young men only — no data in women, older adults, or repeated dosing.',
        peerReviewStatus: 'peer_reviewed',
      },
      {
        sourceKey: 'cardioprotectionAnimal1',
        studyDesign: 'animal_study',
        population: 'Rats',
        intervention:
          'Hexarelin administration in ischemia-reperfusion / calcium-deprivation cardiac injury models',
        resultsSummary:
          'Hexarelin protected cardiac tissue from ischemia-reperfusion and calcium-deprivation injury independent of growth hormone release, consistent with action through a non-GHS-R1a receptor (later work implicates CD36).',
        limitations:
          'Animal (rat) models only; mechanism inferred, not directly measured via receptor knockout in this specific study.',
        peerReviewStatus: 'peer_reviewed',
      },
    ],
    claims: [
      {
        section: 'summary',
        statement:
          'Hexarelin (examorelin) is a synthetic hexapeptide growth hormone secretagogue related to GHRP-6, and is separately studied for growth-hormone-independent cardioprotective effects in animal models.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Combines a well-characterized human GH-releasing pharmacology study with animal cardioprotection literature.',
        interpretationStatus: 'preliminary',
        sourceKeys: [{ key: 'cardioprotectionAnimal1' }],
      },
      {
        section: 'summary',
        statement:
          'In a double-blind, placebo-controlled dose-response study in 12 healthy men, hexarelin produced dose-dependent increases in plasma growth hormone (peak 3.9-55.0 ng/mL) with an elimination half-life of approximately 55 minutes.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Well-conducted single-dose PK/PD study; small sample, healthy young men only.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'doseResponseHuman' }],
      },
      {
        section: 'mechanism',
        statement:
          'In multiple rodent studies, hexarelin has shown cardioprotective effects — including preserved myocardial function after ischemia-reperfusion injury and improved cardiac function after experimental myocardial infarction — that persist even when its growth-hormone-releasing activity is not the operative mechanism, suggesting action through a receptor distinct from the classical growth hormone secretagogue receptor (GHS-R1a), such as CD36.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Multiple peer-reviewed animal studies; no human cardioprotection data exist.',
        interpretationStatus: 'preliminary',
        sourceKeys: [{ key: 'cardioprotectionAnimal1' }, { key: 'cardioprotectionAnimal2' }],
      },
      {
        section: 'safety',
        statement:
          'Human safety data on hexarelin are limited to short-term, single- or short-dose pharmacology studies; the cardioprotective research described above has been conducted only in animal models (rats and mice), not in humans.',
        evidenceQuality: 'low',
        qualityRationale: 'Absence of human cardioprotection/safety trials.',
        interpretationStatus: 'insufficient',
        sourceKeys: [{ key: 'cardioprotectionAnimal1' }],
      },
      {
        section: 'regulatory',
        statement:
          "Hexarelin (examorelin) is listed under the World Anti-Doping Agency's S2 category (Peptide Hormones, Growth Factors, Related Substances and Mimetics) and is prohibited at all times in competitive sport.",
        evidenceQuality: 'high',
        qualityRationale: "Directly verified against WADA's own published Prohibited List.",
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'wadaList' }],
      },
      ...standardBoilerplateClaims('Hexarelin'),
    ],
    regulatoryRecords: [
      {
        agency: 'World Anti-Doping Agency',
        jurisdiction: 'International (sport)',
        regulatoryStatus: 'banned_in_sport',
        notes: 'Listed under S2 as "examorelin (hexarelin)", prohibited at all times.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'wadaList',
      },
    ],
  },

  // -----------------------------------------------------------------
  // Gonadorelin
  // -----------------------------------------------------------------
  {
    slug: 'gonadorelin',
    name: 'Gonadorelin',
    entityKind: 'peptide',
    category: 'Reproductive & Endocrine',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: [
      'Gonadorelin GnRH clinical use FDA approved Factrel human study',
      'gonadorelin FDA label DailyMed Factrel prescribing information',
      'Factrel gonadorelin FDA approval 1982 Ayerst human diagnostic discontinued',
    ],
    batch: BATCH,
    overviewWhatItIs:
      'Gonadorelin is a synthetic decapeptide identical in sequence to endogenous gonadotropin-releasing hormone (GnRH), which stimulates pituitary release of luteinizing hormone (LH) and follicle-stimulating hormone (FSH).',
    overviewWhyPeopleUseIt:
      'It is most often discussed in the context of reproductive-endocrine research and pituitary function testing. Its only documented FDA-approved human use was as a discontinued diagnostic agent (Factrel) for evaluating pituitary gonadotrope function. It is separately compounded and discussed for fertility-adjacent and hormone-axis research uses; these are not FDA-approved indications.',
    overviewResearchSummary:
      'One historical FDA approval record (a discontinued diagnostic product) and one directly verified veterinary regulatory record (an unrelated, same-named product) were located. No controlled human trials of gonadorelin for research uses outside its original diagnostic indication were located in the databases searched as of 2026-08-19.',
    overviewBottomLine:
      'Well-understood basic endocrinology (GnRH physiology is textbook-level established), but thin modern clinical evidence: the only FDA-approved human product was discontinued decades ago, and no current controlled human research trials were located.',
    administrationContext:
      'Historical FDA-approved human use (Factrel) was via injection for a single-dose diagnostic stimulation test, not repeated/chronic dosing. No published data address subcutaneous self-administration for other proposed uses.',
    aliases: [
      {
        alias: 'GnRH',
        type: 'abbreviation',
        note: 'Gonadotropin-releasing hormone — the endogenous hormone gonadorelin is synthetically identical to.',
      },
      {
        alias: 'LHRH',
        type: 'abbreviation',
        note: 'Luteinizing hormone-releasing hormone — an older name for the same molecule.',
      },
      {
        alias: 'Gonadorelin Acetate',
        type: 'spelling_variant',
        note: 'Salt form used in some compounded products.',
      },
      {
        alias: 'Gonadorelin Hydrochloride',
        type: 'spelling_variant',
        note: 'Salt form used in the discontinued human Factrel product and in the unrelated veterinary Factrel product.',
      },
    ],
    sources: {
      fdaHistorySecondary: {
        sourceType: 'other',
        title: 'Factrel (Gonadorelin): Side Effects, Uses, Dosage, Interactions, Warnings',
        url: 'https://www.rxlist.com/factrel-drug.htm',
        publisherOrAgency: 'RxList (secondary pharmaceutical drug-reference publisher)',
        retrievedDate: SEARCH_DATE,
      },
      dailymedVeterinary: {
        sourceType: 'official_database_record',
        title: 'FACTREL — gonadorelin hydrochloride injection (veterinary)',
        url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=1451663c-b85a-4b45-8b27-6d572d0032f9',
        publisherOrAgency: 'DailyMed / National Library of Medicine (NIH)',
        retrievedDate: SEARCH_DATE,
      },
    },
    claims: [
      {
        section: 'summary',
        statement:
          'Gonadorelin is a synthetic decapeptide identical in sequence to endogenous gonadotropin-releasing hormone (GnRH), which stimulates pituitary release of luteinizing hormone (LH) and follicle-stimulating hormone (FSH).',
        evidenceQuality: 'high',
        qualityRationale: 'Well-established basic reproductive endocrinology.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'fdaHistorySecondary', relationship: 'provides_context' }],
      },
      {
        section: 'mechanism',
        statement:
          "Continuous (non-pulsatile) GnRH/gonadorelin administration paradoxically suppresses gonadotropin release after initial stimulation, whereas pulsatile administration (mimicking endogenous secretion) sustains gonadotropin release — the basis for gonadorelin's original diagnostic-stimulation-test use.",
        evidenceQuality: 'moderate',
        qualityRationale:
          'Well-established endocrinology principle, cited to a secondary drug-reference source rather than a primary mechanistic study in this pass.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'fdaHistorySecondary', relationship: 'provides_context' }],
      },
      {
        section: 'regulatory',
        statement:
          'A human gonadorelin hydrochloride product (brand name Factrel) received FDA approval in 1982 (Ayerst Laboratories) for diagnostic evaluation of pituitary gonadotrope function; it was later voluntarily withdrawn from the US market for commercial, not safety, reasons, and no FDA-approved human gonadorelin product is currently marketed in the United States.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Based on a secondary pharmaceutical drug-reference source; the primary FDA Drugs@FDA application record was not independently retrievable in this research pass.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'fdaHistorySecondary' }],
      },
      {
        section: 'regulatory',
        statement:
          "The brand name 'Factrel' is currently used for an unrelated, FDA-approved veterinary product (gonadorelin hydrochloride injection, Zoetis Inc.) indicated for ovarian follicular cysts and estrus synchronization in cattle only — this is a name collision, not a continuation of the discontinued human diagnostic product, and this profile does not imply any connection between the two.",
        evidenceQuality: 'high',
        qualityRationale:
          'Directly verified against the DailyMed prescribing information/label for this specific product.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'dailymedVeterinary' }],
      },
      {
        section: 'safety',
        statement:
          'No controlled human trials of gonadorelin for research uses outside its original diagnostic indication were located in the databases searched as of 2026-08-19.',
        interpretationStatus: 'insufficient',
      },
      ...standardBoilerplateClaims('Gonadorelin'),
    ],
    regulatoryRecords: [
      {
        agency: 'FDA',
        jurisdiction: 'United States',
        formulation: 'Gonadorelin hydrochloride injection (Factrel, human — discontinued)',
        indication: 'Diagnostic evaluation of pituitary gonadotrope function',
        regulatoryStatus: 'discontinued',
        notes:
          'Voluntarily withdrawn by Wyeth/Ayerst for commercial reasons, not safety; per a secondary drug-reference source — primary FDA record not independently retrieved in this pass.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'fdaHistorySecondary',
      },
      {
        agency: 'FDA (Center for Veterinary Medicine)',
        jurisdiction: 'United States (veterinary)',
        formulation: 'Gonadorelin hydrochloride injection (Factrel, Zoetis Inc.)',
        indication: 'Ovarian follicular cysts and estrus synchronization in cattle',
        regulatoryStatus: 'approved',
        notes:
          'Veterinary-only; explicitly labeled "not for human use." Verified directly via the DailyMed label. Unrelated to the discontinued human diagnostic Factrel product above.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'dailymedVeterinary',
      },
    ],
  },

  // -----------------------------------------------------------------
  // PEG-MGF
  // -----------------------------------------------------------------
  {
    slug: 'peg-mgf',
    name: 'PEG-MGF',
    entityKind: 'peptide',
    category: 'Muscle & Tissue Repair',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: [
      'PEG-MGF pegylated mechano growth factor peptide research study',
      'Yang Goldspink mechano growth factor IGF-1Ec splice variant muscle PubMed',
    ],
    batch: BATCH,
    overviewWhatItIs:
      'PEG-MGF (pegylated mechano growth factor) is a synthetic, PEGylated version of the E-domain peptide derived from IGF-1Ec (mechano growth factor, MGF), a splice variant of IGF-1 expressed in skeletal muscle in response to mechanical loading.',
    overviewWhyPeopleUseIt:
      'It is most often discussed in the context of muscle repair and hypertrophy research. Commonly claimed uses include muscle-progenitor-cell activation and tissue-repair support, based on research into the native (non-pegylated) MGF E-peptide. These are investigated uses of the parent molecule, not established uses of the pegylated research-chemical product specifically.',
    overviewResearchSummary:
      'Animal research: a mouse ALS model study of native MGF. In-vitro research: human muscle-progenitor-cell culture studies of the native MGF E-peptide. No peer-reviewed studies specifically evaluating the PEGylated form (as opposed to native MGF) in any species were located in the databases searched as of 2026-08-19.',
    overviewBottomLine:
      'Important distinction: essentially all located peer-reviewed evidence concerns native, non-pegylated MGF/IGF-1Ec — not the pegylated research-chemical product sold under this name. No human clinical trials of either form were located.',
    administrationContext:
      'All located research used the native, non-pegylated MGF E-peptide, administered via direct intramuscular injection (animal studies) or applied to cultured cells (in-vitro studies). No published data address subcutaneous self-administration of the pegylated form specifically.',
    aliases: [],
    sources: {
      splicVariantReview: {
        sourceType: 'pubmed_article',
        title:
          'Insulin-Like Growth Factor I (IGF-1) Ec/Mechano Growth Factor — A Splice Variant of IGF-1 within the Growth Plate',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3795771/',
        publisherOrAgency: 'PLOS ONE',
        retrievedDate: SEARCH_DATE,
        identifiers: { other: 'PMCID: PMC3795771' },
      },
      alsMouseStudy: {
        sourceType: 'pubmed_article',
        title:
          'Mechano-growth factor, an IGF-I splice variant, rescues motoneurons and improves muscle function in SOD1(G93A) mice',
        url: 'https://pubmed.ncbi.nlm.nih.gov/19038252/',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '19038252' },
      },
      progenitorCellStudy: {
        sourceType: 'pubmed_article',
        title:
          'Mechano Growth Factor E peptide (MGF-E), derived from an isoform of IGF-1, activates human muscle progenitor cells and induces an increase in their fusion potential at different ages',
        url: 'https://pubmed.ncbi.nlm.nih.gov/21354439/',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '21354439' },
      },
    },
    studies: [
      {
        sourceKey: 'alsMouseStudy',
        studyDesign: 'animal_study',
        population: 'SOD1(G93A) transgenic mice (ALS model)',
        intervention: 'Native (non-pegylated) mechano growth factor administration',
        resultsSummary:
          'Improved motoneuron survival and muscle function markers in an ALS mouse model.',
        limitations:
          'Animal model only; native (non-pegylated) MGF, not the pegylated product; disease-specific (ALS) model, not a healthy-muscle or exercise-recovery model.',
        peerReviewStatus: 'peer_reviewed',
      },
      {
        sourceKey: 'progenitorCellStudy',
        studyDesign: 'in_vitro_study',
        population: 'Cultured human muscle progenitor (satellite) cells, donors of different ages',
        intervention: 'Native (non-pegylated) MGF E-peptide applied to cell culture',
        resultsSummary:
          'MGF E-peptide activated human muscle progenitor cells and increased their fusion potential across donor ages studied.',
        limitations:
          'In-vitro cell-culture study, not a human clinical trial; native (non-pegylated) peptide only.',
        peerReviewStatus: 'peer_reviewed',
      },
    ],
    claims: [
      {
        section: 'summary',
        statement:
          'PEG-MGF is a PEGylated version of the E-domain peptide derived from IGF-1Ec (mechano growth factor), a splice variant of IGF-1 expressed in skeletal muscle in response to mechanical loading.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Splice-variant biology is well described in the peer-reviewed literature for the native (non-pegylated) form.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'splicVariantReview' }],
      },
      {
        section: 'mechanism',
        statement:
          'The native MGF E-peptide has been shown in cell-culture studies to expand the pool of muscle progenitor (satellite) cells, a distinct action from mature IGF-1, which instead promotes their fusion into new muscle fibers; native MGF has a very short half-life in vivo, which is the stated rationale for PEGylating research-chemical versions of this peptide.',
        evidenceQuality: 'moderate',
        qualityRationale:
          "Established for native MGF in peer-reviewed in-vitro studies; the pegylated construct's own pharmacokinetics were not independently verified in this pass.",
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'progenitorCellStudy' }, { key: 'splicVariantReview' }],
      },
      {
        section: 'faq',
        statement:
          "Q: Is PEG-MGF the same as the peptide studied in the published research? A: Not exactly. Essentially all located peer-reviewed studies used the native, non-pegylated MGF E-peptide. No peer-reviewed study specifically evaluating the PEGylated form was located in the databases searched as of 2026-08-19 — this profile's evidence should be read as describing the parent molecule, not independently confirming the pegylated product's own effects, pharmacokinetics, or safety.",
        interpretationStatus: 'insufficient',
      },
      {
        section: 'summary',
        statement:
          'In a mouse model of ALS (SOD1(G93A) mice), native mechano growth factor improved motoneuron survival and muscle function markers.',
        evidenceQuality: 'moderate',
        qualityRationale: 'Peer-reviewed animal disease-model study; native peptide, single study.',
        interpretationStatus: 'preliminary',
        sourceKeys: [{ key: 'alsMouseStudy' }],
      },
      {
        section: 'summary',
        statement:
          'In cultured human muscle progenitor cells, the native MGF E-peptide activated progenitor cells and increased their fusion potential across donor ages.',
        evidenceQuality: 'moderate',
        qualityRationale: 'In-vitro human-cell study, not a clinical trial; native peptide.',
        interpretationStatus: 'preliminary',
        sourceKeys: [{ key: 'progenitorCellStudy' }],
      },
      {
        section: 'safety',
        statement:
          'No human clinical trials of either native MGF or PEG-MGF, and no published human or animal safety data specific to the pegylated form, were located in the databases searched as of 2026-08-19.',
        interpretationStatus: 'insufficient',
      },
      ...standardBoilerplateClaims('PEG-MGF'),
    ],
    regulatoryRecords: [],
  },
];

async function main() {
  const client = getServiceClient();
  console.log(`Importing batch 1 (${compounds.length} compounds)...\n`);
  const results = [];
  for (const compound of compounds) {
    try {
      const result = await importCompound(client, compound);
      results.push({ name: compound.name, ...result });
    } catch (err) {
      console.error(`FAILED: ${compound.name}:`, err.message ?? err);
      results.push({ name: compound.name, outcome: 'error', error: err.message });
    }
    console.log('');
  }
  console.log('Summary:');
  for (const r of results) console.log(`  ${r.name}: ${r.outcome}`);
}

main();
