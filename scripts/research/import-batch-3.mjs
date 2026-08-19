#!/usr/bin/env node
/**
 * Research DB expansion — Batch 3: repair / immune / vascular.
 * LL-37, Adipotide, ACE-031, HMG.
 *
 * Run manually, locally: node scripts/research/import-batch-3.mjs
 * Idempotent — see scripts/research/lib/import-helpers.mjs.
 */
import {
  getServiceClient,
  importCompound,
  standardBoilerplateClaims,
} from './lib/import-helpers.mjs';

const SEARCH_DATE = '2026-08-19';
const DATABASES = [
  'PubMed/MEDLINE (via NCBI eutils)',
  'PMC',
  'Science Translational Medicine',
  'FDA (Drugs@FDA)',
];
const BATCH = 'batch-3-repair-immune-vascular';

const compounds = [
  // -----------------------------------------------------------------
  // LL-37
  // -----------------------------------------------------------------
  {
    slug: 'll-37',
    name: 'LL-37',
    entityKind: 'peptide',
    category: 'Immune & Antimicrobial',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: ['LL-37 cathelicidin human clinical trial wound healing PubMed'],
    batch: BATCH,
    overviewWhatItIs:
      'LL-37 is the only human cathelicidin antimicrobial peptide, produced by immune cells and skin, with both direct antimicrobial and wound-healing/immunomodulatory activity.',
    overviewWhyPeopleUseIt:
      'It is most often discussed in the context of wound healing and antimicrobial research. Commonly claimed or investigated uses include topical treatment of chronic/infected wounds. These are investigated uses studied in academic clinical trials, not an FDA-approved drug product.',
    overviewResearchSummary:
      'Human research: a randomized, placebo-controlled trial in chronic venous leg ulcers, plus laboratory/in-vitro and in-vivo wound-healing and antimicrobial mechanism studies. No FDA approval was located for any LL-37 product as of this research pass.',
    overviewBottomLine:
      'A genuinely endogenous human peptide with real, positive, placebo-controlled human trial data for one specific topical application (chronic venous leg ulcers), alongside a substantial mechanistic/antimicrobial literature — but no approved drug product exists.',
    administrationContext:
      'The located human trial used topical application (twice weekly) to chronic wounds at defined concentrations (0.5-3.2 mg/mL) — this profile summarizes that trial design context only, not a usage recommendation, and does not address injectable or systemic administration, which was not studied in the sources reviewed.',
    aliases: [
      {
        alias: 'Cathelicidin',
        type: 'scientific_name',
        note: 'LL-37 is the active, cleaved form of the human cathelicidin precursor protein hCAP-18/CAMP.',
      },
      {
        alias: 'CAMP',
        type: 'abbreviation',
        note: 'Gene symbol for the cathelicidin antimicrobial peptide precursor.',
      },
    ],
    sources: {
      ulcerRCT: {
        sourceType: 'pubmed_article',
        title:
          'Treatment with LL-37 is safe and effective in enhancing healing of hard-to-heal venous leg ulcers: a randomized, placebo-controlled clinical trial',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25041740/',
        publisherOrAgency: 'Wound Repair and Regeneration',
        publicationDate: '2014-01-01',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '25041740' },
      },
      infectedWoundsReview: {
        sourceType: 'pubmed_article',
        title:
          'The Human Cathelicidin Antimicrobial Peptide LL-37 as a Potential Treatment for Polymicrobial Infected Wounds',
        url: 'https://pubmed.ncbi.nlm.nih.gov/23840194/',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '23840194' },
      },
      inVitroInVivo: {
        sourceType: 'pubmed_article',
        title:
          'In vitro and in vivo wound healing-promoting activities of human cathelicidin LL-37',
        url: 'https://pubmed.ncbi.nlm.nih.gov/17805349/',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '17805349' },
      },
    },
    studies: [
      {
        sourceKey: 'ulcerRCT',
        studyDesign: 'rct_human',
        population: '34 adults with hard-to-heal venous leg ulcers',
        sampleSize: 34,
        comparator: 'Placebo',
        intervention:
          'Topical LL-37 at 0.5, 1.6, or 3.2 mg/mL, applied twice weekly, after a 3-week open-label placebo run-in',
        route: 'Topical',
        publishedResearchDose:
          '0.5-3.2 mg/mL topical, twice weekly (published trial dose, not a usage recommendation)',
        duration: '11 weeks total (3-week run-in, 4-week double-blind treatment, 4-week follow-up)',
        primaryOutcomes: 'Ulcer area reduction, healing rate constant',
        resultsSummary:
          'Healing rate constants for the 0.5 and 1.6 mg/mL doses were approximately six- and three-fold higher than placebo; mean ulcer area reduction was 68% (0.5 mg/mL) and 50% (1.6 mg/mL). The highest dose (3.2 mg/mL) showed no advantage over placebo. No local or systemic safety concerns were reported.',
        limitations:
          'Small trial (n=34), single specific wound type (venous leg ulcers), single academic-sponsored trial — not yet replicated at larger scale or for other wound types.',
        peerReviewStatus: 'peer_reviewed',
      },
    ],
    claims: [
      {
        section: 'summary',
        statement:
          'LL-37 is the only human cathelicidin antimicrobial peptide, cleaved from the precursor protein hCAP-18 (gene CAMP), with direct antimicrobial activity against Gram-positive and Gram-negative bacteria and separate wound-healing/immunomodulatory effects.',
        evidenceQuality: 'high',
        qualityRationale:
          'Well-established, extensively characterized endogenous human immune peptide.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'infectedWoundsReview' }],
      },
      {
        section: 'mechanism',
        statement:
          'LL-37 has demonstrated antimicrobial and anti-biofilm activity against multiple bacterial pathogens in laboratory studies, alongside separate effects promoting keratinocyte migration and wound closure in in-vitro and animal wound models.',
        evidenceQuality: 'moderate',
        qualityRationale: 'Multiple peer-reviewed in-vitro/in-vivo mechanistic studies.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'inVitroInVivo' }, { key: 'infectedWoundsReview' }],
      },
      {
        section: 'summary',
        statement:
          'In a randomized, placebo-controlled trial of 34 adults with chronic venous leg ulcers, topical LL-37 (0.5 or 1.6 mg/mL, twice weekly) produced significantly faster healing than placebo (68% and 50% mean ulcer-area reduction respectively), with no local or systemic safety concerns reported; the highest tested dose (3.2 mg/mL) showed no benefit over placebo.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Peer-reviewed, randomized, placebo-controlled human trial; small sample size (n=34), single wound type, not yet replicated.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'ulcerRCT' }],
      },
      {
        section: 'regulatory',
        statement:
          'No FDA-approved drug product containing LL-37 was located in the databases searched as of 2026-08-19.',
        interpretationStatus: 'insufficient',
      },
      ...standardBoilerplateClaims('LL-37'),
    ],
    regulatoryRecords: [
      {
        agency: 'FDA',
        jurisdiction: 'United States',
        regulatoryStatus: 'not_approved',
        notes: 'No approved LL-37 drug product located; academic clinical trials only.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'ulcerRCT',
      },
    ],
  },

  // -----------------------------------------------------------------
  // Adipotide
  // -----------------------------------------------------------------
  {
    slug: 'adipotide',
    name: 'Adipotide',
    entityKind: 'peptide',
    category: 'Metabolic & Investigational Oncology-Adjacent',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: [
      'Adipotide FTPP prohibitin peptide MD Anderson primate obesity study PubMed safety human trial',
      'Barnhart peptidomimetic targeting white fat weight loss obese monkeys Science Translational Medicine 2011',
      'adipotide phase 1 clinical trial prostate cancer nephrotoxicity discontinued MD Anderson',
    ],
    batch: BATCH,
    overviewWhatItIs:
      'Adipotide (FTPP, also called Prohibitin-Targeting Peptide 1) is a synthetic chimeric peptide developed at the University of Texas MD Anderson Cancer Center, combining a vascular-homing sequence (CKGGRAKDC) that binds prohibitin on blood vessels feeding white adipose tissue with a proapoptotic sequence (D(KLAKLAK)2) that triggers programmed cell death in those targeted blood-vessel cells.',
    overviewWhyPeopleUseIt:
      'It is discussed in the context of targeted fat loss research. Its only credible evidence is preclinical (rodent and non-human-primate) — this profile exists specifically to document that its one human trial was discontinued for safety reasons, not to describe an established human use.',
    overviewResearchSummary:
      'Animal research: a peer-reviewed, placebo-controlled study in obese rhesus monkeys showing real weight loss and improved insulin resistance. Human research: a Phase 1 trial (Arrowhead Pharmaceuticals, in partnership with MD Anderson) was terminated in January 2019 after enrolling only 4 participants, due to dose-limiting kidney toxicity not predicted by the animal data. No FDA approval exists or was ever sought to completion.',
    overviewBottomLine:
      'This is a compound whose own human trial was stopped for a serious, dose-limiting safety signal (kidney injury) that had not been apparent in animal studies — a genuine, documented cautionary case, not merely an unproven one.',
    administrationContext:
      'The animal studies used injectable (subcutaneous/intraperitoneal, per the primate study design) administration; the terminated human Phase 1 trial also used injectable dosing before being stopped for safety. No published data support any route as safe in humans.',
    aliases: [
      { alias: 'FTPP', type: 'abbreviation', note: 'Fat-Targeted Proapoptotic Peptide.' },
      { alias: 'Prohibitin-Targeting Peptide 1', type: 'scientific_name' },
    ],
    sources: {
      primateStudy: {
        sourceType: 'doi_article',
        title:
          'A Peptidomimetic Targeting White Fat Causes Weight Loss and Improved Insulin Resistance in Obese Monkeys',
        url: 'https://www.science.org/doi/10.1126/scitranslmed.3002621',
        publisherOrAgency: 'Science Translational Medicine',
        publicationDate: '2011-11-09',
        retrievedDate: SEARCH_DATE,
        identifiers: { doi: '10.1126/scitranslmed.3002621' },
      },
      trialTerminationNews: {
        sourceType: 'other',
        title:
          'Arrowhead Announces Dosing of First Patient with Anti-Obesity Treatment Adipotide (R) in a Phase 1 Clinical Trial',
        url: 'https://arrowheadpharma.com/en-us/newsroom/arrowhead-announces-dosing-first-patient-anti-obesity-treatment',
        publisherOrAgency: 'Arrowhead Pharmaceuticals (company announcement)',
        retrievedDate: SEARCH_DATE,
      },
    },
    studies: [
      {
        sourceKey: 'primateStudy',
        studyDesign: 'animal_study',
        population: 'Spontaneously obese rhesus monkeys',
        intervention: 'Adipotide (CKGGRAKDC-GG-D(KLAKLAK)2), placebo-controlled',
        duration: '28 days',
        resultsSummary:
          'Treated monkeys lost approximately 7-15% body weight over 28 days, with improved insulin resistance; MRI and DEXA imaging confirmed reduced white adipose tissue. Mechanism: targeted apoptosis of endothelial cells in blood vessels supplying white fat, via prohibitin binding.',
        limitations:
          'Non-human primate model only; short (28-day) duration; a later, real human Phase 1 trial found dose-limiting kidney toxicity not predicted by this or other animal work — see the safety claim below.',
        peerReviewStatus: 'peer_reviewed',
      },
    ],
    claims: [
      {
        section: 'summary',
        statement:
          'Adipotide (FTPP) is a synthetic peptide combining a vascular-homing sequence with a proapoptotic sequence, designed to selectively destroy the blood vessels supplying white adipose tissue.',
        evidenceQuality: 'high',
        qualityRationale: 'Directly described in the peer-reviewed primary research publication.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'primateStudy' }],
      },
      {
        section: 'summary',
        statement:
          'In a placebo-controlled study in obese rhesus monkeys, 28 days of adipotide treatment produced approximately 7-15% body weight loss and improved insulin resistance, with imaging-confirmed reduction in white adipose tissue.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Peer-reviewed, placebo-controlled non-human-primate study; a single 28-day study, not replicated at longer duration.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'primateStudy' }],
      },
      {
        section: 'safety',
        statement:
          "Adipotide's only human clinical trial (a Phase 1 study in obese prostate-cancer patients, sponsored by Arrowhead Pharmaceuticals in partnership with MD Anderson Cancer Center, begun in 2012) was terminated in January 2019 at the principal investigator's request after enrolling only 4 participants, due to dose-limiting kidney toxicity (proximal tubular injury, elevated creatinine) — a safety signal the preceding animal studies had not predicted at a comparable severity. The program was permanently discontinued; adipotide has never completed a human clinical trial.",
        evidenceQuality: 'moderate',
        qualityRationale:
          'Based on company trial-status announcements and secondary reporting of the trial termination; the primary clinical-trial safety report/publication was not independently located in this pass.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'trialTerminationNews' }],
      },
      {
        section: 'regulatory',
        statement:
          'No FDA approval exists for adipotide, and its only human clinical trial was discontinued before completion.',
        interpretationStatus: 'established',
        evidenceQuality: 'high',
        qualityRationale: 'Directly follows from the documented trial termination.',
        sourceKeys: [{ key: 'trialTerminationNews' }],
      },
      ...standardBoilerplateClaims('Adipotide'),
    ],
    regulatoryRecords: [
      {
        agency: 'FDA',
        jurisdiction: 'United States',
        regulatoryStatus: 'not_approved',
        notes:
          'Sole Phase 1 human trial was terminated in January 2019 for dose-limiting nephrotoxicity after enrolling 4 participants; program permanently discontinued.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'trialTerminationNews',
      },
    ],
  },

  // -----------------------------------------------------------------
  // ACE-031
  // -----------------------------------------------------------------
  {
    slug: 'ace-031',
    name: 'ACE-031',
    entityKind: 'biologic',
    category: 'Muscle & Tissue Repair',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: [
      'ACE-031 ActRIIB-Fc myostatin Duchenne muscular dystrophy trial safety discontinued',
    ],
    batch: BATCH,
    overviewWhatItIs:
      'ACE-031 is a recombinant fusion protein combining the extracellular domain of human activin receptor type IIB (ActRIIB) with the Fc portion of human IgG1, developed by Acceleron Pharma as a myostatin/activin-A "ligand trap" to increase muscle mass.',
    overviewWhyPeopleUseIt:
      'It was investigated as a potential treatment for Duchenne muscular dystrophy (DMD) and other muscle-wasting conditions. Its clinical development was discontinued after a randomized trial found a specific vascular safety signal — this profile documents that outcome rather than describing an established use.',
    overviewResearchSummary:
      'Animal research: increased muscle mass and strength in a non-human-primate (marmoset) study. Human research: a randomized, placebo-controlled Phase 2 trial in boys with DMD found dose-dependent increases in lean body mass and 6-minute-walk-test performance, but was stopped after vascular adverse events (epistaxis, telangiectasias, gum bleeding) attributed to off-target inhibition of BMP9. Acceleron Pharma and Shire discontinued the entire ACE-031 program in 2013.',
    overviewBottomLine:
      'A real efficacy signal (increased muscle mass/strength) was documented in a controlled human trial, but the program was discontinued after a specific, mechanistically explained vascular safety signal — another genuine, documented cautionary case, not merely an unproven compound.',
    administrationContext:
      'The human DMD trial used subcutaneous injection every 2-4 weeks in an ascending-dose design (published trial dose, not a usage recommendation). No ongoing human research program exists.',
    aliases: [
      { alias: 'ActRIIB-Fc', type: 'scientific_name' },
      { alias: 'Activin Receptor Type IIB-Fc Fusion Protein', type: 'scientific_name' },
    ],
    sources: {
      dmdTrial: {
        sourceType: 'pubmed_article',
        title:
          'Myostatin inhibitor ACE-031 treatment of ambulatory boys with Duchenne muscular dystrophy: Results of a randomized, placebo-controlled clinical trial',
        url: 'https://onlinelibrary.wiley.com/doi/abs/10.1002/mus.25268',
        publisherOrAgency: 'Muscle & Nerve',
        publicationDate: '2017-04-01',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '27462804', doi: '10.1002/mus.25268' },
      },
      marmosetStudy: {
        sourceType: 'other',
        title:
          'ACE-031, a soluble activin type IIB receptor, increases muscle mass and strength in the common marmoset (Callithrix jacchus)',
        url: 'https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0342666',
        publisherOrAgency: 'PLOS ONE',
        retrievedDate: SEARCH_DATE,
      },
      discontinuationReview: {
        sourceType: 'other',
        title:
          'Lessons Learned from Discontinued Clinical Developments in Duchenne Muscular Dystrophy',
        url: 'https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2021.735912/full',
        publisherOrAgency: 'Frontiers in Pharmacology',
        publicationDate: '2021-01-01',
        retrievedDate: SEARCH_DATE,
        identifiers: { doi: '10.3389/fphar.2021.735912' },
      },
    },
    studies: [
      {
        sourceKey: 'dmdTrial',
        studyDesign: 'rct_human',
        population: 'Ambulatory boys (age >=4) with Duchenne muscular dystrophy',
        sampleSize: 24,
        comparator: 'Placebo',
        intervention: 'ACE-031 subcutaneous injection every 2-4 weeks, ascending-dose design',
        route: 'Subcutaneous injection',
        duration: 'Stopped after the second dosing regimen',
        primaryOutcomes: 'Safety; secondary: lean body mass, 6-minute-walk-test (6MWT) distance',
        resultsSummary:
          'Dose-dependent increases in lean body mass and improved 6MWT performance were observed. The trial was stopped after vascular adverse events (epistaxis, telangiectasias, gum bleeding) emerged, later attributed to off-target inhibition of BMP9 (a ligand involved in vascular homeostasis) rather than myostatin/activin A specifically.',
        limitations:
          'Small trial (n=24), stopped early for safety before its planned endpoints could be fully assessed; DMD-specific population, not generalizable to other muscle-wasting conditions without further study.',
        peerReviewStatus: 'peer_reviewed',
      },
      {
        sourceKey: 'marmosetStudy',
        studyDesign: 'animal_study',
        population: 'Common marmoset (Callithrix jacchus)',
        intervention: 'ACE-031 (soluble ActRIIB receptor)',
        resultsSummary: 'Increased muscle mass and strength.',
        limitations:
          'Non-human-primate model; did not predict the vascular safety signal later found in the human DMD trial.',
        peerReviewStatus: 'peer_reviewed',
      },
    ],
    claims: [
      {
        section: 'summary',
        statement:
          'ACE-031 is a recombinant ActRIIB-Fc fusion protein that acts as a myostatin/activin-A "ligand trap," developed by Acceleron Pharma to increase muscle mass in wasting conditions including Duchenne muscular dystrophy.',
        evidenceQuality: 'high',
        qualityRationale: 'Directly described in the peer-reviewed clinical trial publication.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'dmdTrial' }],
      },
      {
        section: 'summary',
        statement: 'In a marmoset study, ACE-031 increased muscle mass and strength.',
        evidenceQuality: 'moderate',
        qualityRationale: 'Single peer-reviewed non-human-primate study.',
        interpretationStatus: 'preliminary',
        sourceKeys: [{ key: 'marmosetStudy' }],
      },
      {
        section: 'summary',
        statement:
          'In a randomized, placebo-controlled Phase 2 trial of ambulatory boys with Duchenne muscular dystrophy, ACE-031 produced dose-dependent increases in lean body mass and improved 6-minute-walk-test performance.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Peer-reviewed randomized controlled trial, but small (n=24) and stopped early.',
        interpretationStatus: 'preliminary',
        sourceKeys: [{ key: 'dmdTrial' }],
      },
      {
        section: 'safety',
        statement:
          'The same DMD trial was stopped after the second dosing regimen due to vascular adverse events — epistaxis (nosebleeds), telangiectasias (dilated small blood vessels), and gum bleeding — later mechanistically attributed to off-target inhibition of BMP9, a ligand involved in vascular homeostasis, rather than myostatin/activin A specifically. Acceleron Pharma and Shire announced discontinuation of the entire ACE-031 program in May 2013.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Peer-reviewed trial publication plus an independent peer-reviewed review of discontinued DMD drug programs.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'dmdTrial' }, { key: 'discontinuationReview' }],
      },
      {
        section: 'regulatory',
        statement:
          'ACE-031 has no FDA approval and no active clinical development program; its development was permanently discontinued in 2013.',
        interpretationStatus: 'established',
        evidenceQuality: 'high',
        qualityRationale: 'Directly follows from the documented program discontinuation.',
        sourceKeys: [{ key: 'discontinuationReview' }],
      },
      ...standardBoilerplateClaims('ACE-031'),
    ],
    regulatoryRecords: [
      {
        agency: 'FDA',
        jurisdiction: 'United States',
        indication: 'Duchenne muscular dystrophy (investigational)',
        regulatoryStatus: 'discontinued',
        statusChangeDate: '2013-05-01',
        notes:
          'Phase 2 trial stopped for vascular adverse events (epistaxis, telangiectasias, gum bleeding); program permanently discontinued by Acceleron Pharma and Shire.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'discontinuationReview',
      },
    ],
  },

  // -----------------------------------------------------------------
  // HMG (Human Menopausal Gonadotropin) — a gonadotropin MIXTURE, not
  // a single peptide. Classified 'biologic', explicitly not 'peptide'.
  // -----------------------------------------------------------------
  {
    slug: 'hmg',
    name: 'HMG (Human Menopausal Gonadotropin)',
    entityKind: 'biologic',
    category: 'Reproductive & Endocrine',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: ['human menopausal gonadotropin HMG FSH LH fertility FDA approved Menopur PubMed'],
    batch: BATCH,
    identityConfidence: 'verified',
    overviewWhatItIs:
      'Human Menopausal Gonadotropin (HMG) is not a single peptide — it is a purified mixture of two naturally occurring pituitary hormones, follicle-stimulating hormone (FSH) and luteinizing hormone (LH) activity, extracted and purified from the urine of postmenopausal women. Branded, FDA-approved products (e.g. Menopur) are highly purified formulations of this mixture.',
    overviewWhyPeopleUseIt:
      'It is an established fertility medication, used clinically for controlled ovarian stimulation in assisted reproductive technology (ART/IVF) and ovulation induction. This is one of the few compounds on this site with genuine, current FDA-approved indications — stated plainly here because it is directly documented, not because this site endorses any specific use.',
    overviewResearchSummary:
      'Human research: an FDA-approved product with a real FDA prescribing label, and peer-reviewed clinical-profile and comparative-efficacy publications in the IVF literature.',
    overviewBottomLine:
      'Unlike most compounds on this site, HMG (as the branded product Menopur) has a real, current FDA approval and an established clinical evidence base for its approved fertility indication — this profile still does not provide dosing or usage guidance.',
    administrationContext:
      'The FDA-approved product is administered by injection as part of a physician-supervised ART/ovulation-induction protocol; this profile summarizes that regulatory/clinical context only and provides no dosing or protocol guidance.',
    aliases: [
      { alias: 'hMG', type: 'abbreviation' },
      {
        alias: 'Menotropins',
        type: 'generic_name',
        note: 'The USP generic name for this class of product.',
      },
      { alias: 'Human Menopausal Gonadotropin', type: 'scientific_name' },
    ],
    sources: {
      fdaLabel: {
        sourceType: 'fda_document',
        title: 'Menopur (menotropins for injection) — FDA-approved prescribing information',
        url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2004/21663lbl.pdf',
        publisherOrAgency: 'U.S. Food and Drug Administration',
        publicationDate: '2004-01-01',
        retrievedDate: SEARCH_DATE,
      },
      clinicalProfile: {
        sourceType: 'pubmed_article',
        title:
          'Highly Purified Human Menopausal Gonadotropin (Menopur (R)): A Profile of Its Use in Infertility',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30264288/',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '30264288' },
      },
    },
    claims: [
      {
        section: 'summary',
        statement:
          'Human Menopausal Gonadotropin (HMG) is a purified mixture of follicle-stimulating hormone (FSH) and luteinizing hormone (LH) activity, not a single defined peptide — branded FDA-approved products contain both activities extracted and purified from postmenopausal urine.',
        evidenceQuality: 'high',
        qualityRationale: 'Directly stated in the FDA-approved prescribing information.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'fdaLabel' }],
      },
      {
        section: 'mechanism',
        statement:
          'FSH drives ovarian follicle growth, while LH supports steroid hormone production within the follicle and supports egg maturation.',
        evidenceQuality: 'high',
        qualityRationale:
          'Well-established reproductive endocrinology, described in the FDA label and clinical-profile review.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'clinicalProfile' }],
      },
      {
        section: 'regulatory',
        statement:
          'A highly purified HMG product (Menopur, menotropins for injection) is FDA-approved for development of multiple follicles and pregnancy in ovulatory women in an assisted reproductive technology (ART) program.',
        evidenceQuality: 'high',
        qualityRationale: 'Directly verified against the FDA-approved prescribing information.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'fdaLabel' }],
      },
      {
        section: 'summary',
        statement:
          'In comparative clinical use for IVF/ICSI ovarian stimulation, highly purified HMG has shown pregnancy rates comparable to recombinant FSH, despite an association with lower oocyte yield in some comparisons, and has been reported to improve some measures of embryo quality.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Based on a peer-reviewed clinical-profile review summarizing multiple comparative studies; individual trial-level detail was not independently extracted in this pass.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'clinicalProfile' }],
      },
      ...standardBoilerplateClaims('HMG (Human Menopausal Gonadotropin)'),
    ],
    regulatoryRecords: [
      {
        agency: 'FDA',
        jurisdiction: 'United States',
        formulation: 'Highly purified menotropins for injection (Menopur)',
        indication:
          'Development of multiple follicles and pregnancy in ART programs; ovulation induction',
        regulatoryStatus: 'approved',
        notes: 'Directly verified against the FDA-approved prescribing information (NDA 21-663).',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'fdaLabel',
      },
    ],
  },
];

async function main() {
  const client = getServiceClient();
  console.log(`Importing batch 3 (${compounds.length} compounds)...\n`);
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
