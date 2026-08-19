#!/usr/bin/env node
/**
 * Research DB expansion — Batch 4: miscellaneous.
 * SNAP-8, VIP, Vitamin B12, EPO, FOXO4-DRI, Lipo-C.
 *
 * Run manually, locally: node scripts/research/import-batch-4.mjs
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
  'FDA (Drugs@FDA)',
  'DailyMed (NIH)',
  'WADA Prohibited List',
];
const BATCH = 'batch-4-misc';

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
  // SNAP-8
  // -----------------------------------------------------------------
  {
    slug: 'snap-8',
    name: 'SNAP-8',
    entityKind: 'peptide',
    category: 'Cosmetic Peptides',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: [
      'SNAP-8 acetyl octapeptide-3 SNARE wrinkle cosmetic study',
      '"acetyl octapeptide-3" PubMed peer-reviewed cosmetic peptide efficacy',
    ],
    batch: BATCH,
    overviewWhatItIs:
      'SNAP-8 (Acetyl Octapeptide-3, its INCI/cosmetic-industry name) is a synthetic octapeptide developed as a topical cosmetic ingredient. It mimics part of the SNAP-25 protein to competitively inhibit SNARE-complex formation, reducing neurotransmitter release at the neuromuscular junction — the same general mechanism class as botulinum toxin, though acting by a different, non-toxin means.',
    overviewWhyPeopleUseIt:
      'It is marketed for reducing the appearance of expression wrinkles when applied topically. This is a cosmetic-industry marketing claim, not an FDA-approved or independently peer-reviewed clinical claim — see the evidence limitations below.',
    overviewResearchSummary:
      "A PubMed search for SNAP-8/acetyl octapeptide-3 returns very little dedicated peer-reviewed efficacy literature. The widely circulated wrinkle-reduction percentages (commonly cited figures in the 27-63% range) trace back to the manufacturer's (Lipotec/Lubrizol) own in-house technical/marketing testing, not an independent, peer-reviewed randomized controlled trial — this profile does not treat those figures as established scientific evidence.",
    overviewBottomLine:
      "SNAP-8's SNARE-inhibition mechanism is chemically well described, but independent, peer-reviewed clinical efficacy evidence specific to SNAP-8 is essentially absent; the commonly quoted efficacy numbers are manufacturer-sourced, not independently verified.",
    administrationContext:
      'All available information concerns topical cosmetic application — no other route is documented in any source reviewed.',
    aliases: [
      {
        alias: 'Acetyl Octapeptide-3',
        type: 'generic_name',
        note: 'The INCI (cosmetic-industry) name for this compound.',
      },
    ],
    sources: {
      mechanismContext: {
        sourceType: 'other',
        title:
          'Acetyl Hexapeptide-8 in Cosmeceuticals — A Review of Skin Permeability and Efficacy',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12193160/',
        publisherOrAgency: 'PMC (peer-reviewed review)',
        retrievedDate: SEARCH_DATE,
      },
    },
    claims: [
      {
        section: 'mechanism',
        statement:
          'SNAP-8 is designed to mimic part of the SNAP-25 protein, competitively inhibiting SNARE-complex formation and thereby reducing acetylcholine release at the neuromuscular junction — the same general mechanistic class as the shorter, more extensively studied cosmetic peptide Acetyl Hexapeptide-8 (Argireline), though SNAP-8 is a distinct, longer (8 amino acid) peptide, not the same compound.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Mechanism is chemically well described in peer-reviewed reviews of the SNARE-inhibiting cosmetic-peptide class generally; SNAP-8-specific mechanistic data is more limited than for its shorter analogue.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'mechanismContext' }],
      },
      {
        section: 'faq',
        statement:
          "Q: Do the wrinkle-reduction percentages commonly cited for SNAP-8 (often 27-63%) come from independent research? A: No. A PubMed search located very little dedicated peer-reviewed efficacy literature specific to SNAP-8; the widely circulated figures trace back to the ingredient manufacturer's own in-house testing, which this profile treats as a commercial claim, not independently verified scientific evidence.",
        interpretationStatus: 'insufficient',
      },
      {
        section: 'summary',
        statement:
          'No independent, peer-reviewed randomized controlled trial of SNAP-8 in humans was located in the databases searched as of 2026-08-19.',
        interpretationStatus: 'insufficient',
      },
      ...standardBoilerplateClaims('SNAP-8'),
    ],
    regulatoryRecords: [],
  },

  // -----------------------------------------------------------------
  // VIP (Vasoactive Intestinal Peptide) — standalone peptide, not a
  // blend (see reconciliation manifest for the reasoning).
  // -----------------------------------------------------------------
  {
    slug: 'vip',
    name: 'VIP (Vasoactive Intestinal Peptide)',
    entityKind: 'peptide',
    category: 'Neuropeptides',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: [
      'vasoactive intestinal peptide VIP human physiology clinical PubMed FDA approved drug',
    ],
    batch: BATCH,
    overviewWhatItIs:
      'VIP (Vasoactive Intestinal Peptide) is a 28-amino-acid neuropeptide, naturally present throughout the peripheral and central nervous systems, that acts as a nonadrenergic, noncholinergic neurotransmitter/neuromodulator. This profile covers the standalone peptide — no internal product specification or COA evidence of a documented "VIP blend" product was found anywhere in this codebase during the reconciliation pass, so this profile does not describe or assume any blend composition.',
    overviewWhyPeopleUseIt:
      'It is studied for vasodilation, anti-inflammatory, and smooth-muscle-relaxation effects across multiple organ systems. A synthetic VIP analogue (aviptadil) has been investigated in specific serious respiratory conditions (ARDS, including COVID-19-related ARDS); this is investigational, not an FDA-approved use.',
    overviewResearchSummary:
      'Human research: multiple peer-reviewed reviews and mechanistic studies of VIP physiology, including a direct human-skin vasodilation study. No FDA-approved VIP-based drug product was located; aviptadil (synthetic VIP) has registered investigational trials but no approval identified.',
    overviewBottomLine:
      'VIP is a genuine, well-characterized endogenous human neuropeptide with an extensive physiological literature, but no FDA-approved VIP-based drug exists, and clinical development of synthetic analogues has been limited by poor metabolic stability and tissue penetration.',
    administrationContext:
      'Human mechanistic studies located used intradermal/local administration for vasodilation research; no data address subcutaneous self-administration for other proposed uses.',
    aliases: [{ alias: 'Vasoactive Intestinal Polypeptide', type: 'scientific_name' }],
    sources: {
      structureActivity: {
        sourceType: 'pubmed_article',
        title:
          'Structure-activity relationship of vasoactive intestinal peptide (VIP): potent agonists and potential clinical applications',
        url: 'https://pubmed.ncbi.nlm.nih.gov/18172612/',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '18172612' },
      },
      cardiovascularReview: {
        sourceType: 'pubmed_article',
        title: 'Vasoactive intestinal peptide: cardiovascular effects',
        url: 'https://pubmed.ncbi.nlm.nih.gov/11121793/',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '11121793' },
      },
      humanSkinStudy: {
        sourceType: 'pubmed_article',
        title: 'Mechanisms of vasoactive intestinal peptide-mediated vasodilation in human skin',
        url: 'https://pubmed.ncbi.nlm.nih.gov/15155712/',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '15155712' },
      },
    },
    studies: [
      {
        sourceKey: 'humanSkinStudy',
        studyDesign: 'human_observational',
        population: 'Human skin (in vivo local administration study)',
        intervention: 'Local VIP administration',
        resultsSummary:
          'VIP produced measurable vasodilation in human skin via a defined mechanism, on a molar basis approximately 50-100 times more potent than acetylcholine as a vasodilator.',
        limitations: 'Local/mechanistic vasodilation study, not a systemic therapeutic trial.',
        peerReviewStatus: 'peer_reviewed',
      },
    ],
    claims: [
      {
        section: 'summary',
        statement:
          'VIP is a 28-amino-acid neuropeptide present throughout the peripheral and central nervous systems, gastrointestinal tract, heart, lungs, and other organs, acting as a nonadrenergic, noncholinergic neurotransmitter/neuromodulator.',
        evidenceQuality: 'high',
        qualityRationale:
          'Well-established, extensively characterized endogenous human neuropeptide.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'cardiovascularReview' }],
      },
      {
        section: 'mechanism',
        statement:
          'General physiologic effects of VIP include vasodilation, anti-inflammatory action, hormonal secretion, gastric motility regulation, and smooth muscle relaxation; in human skin, VIP is approximately 50-100 times more potent than acetylcholine as a vasodilator on a molar basis.',
        evidenceQuality: 'high',
        qualityRationale:
          'Established across multiple peer-reviewed physiology reviews and a direct human mechanistic study.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'humanSkinStudy' }, { key: 'structureActivity' }],
      },
      {
        section: 'regulatory',
        statement:
          'No FDA-approved VIP-based drug product was located in the databases searched as of 2026-08-19. A synthetic VIP analogue (aviptadil) has registered investigational trials for severe respiratory conditions but was not found to have any regulatory approval; clinical development of VIP-based drugs generally has been limited by poor metabolic stability and poor tissue penetration.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Based on a peer-reviewed structure-activity review discussing clinical translation barriers.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'structureActivity' }],
      },
      {
        section: 'faq',
        statement:
          'Q: Is the "VIP" discussed here a blend of multiple ingredients? A: No. This profile describes the single, well-defined 28-amino-acid peptide hormone. No evidence of a documented "VIP blend" product was found anywhere in the research reviewed for this profile; if a specific commercial VIP product is later confirmed to be a blend, this profile would need review before being associated with that product.',
        interpretationStatus: 'established',
      },
      ...standardBoilerplateClaims('VIP (Vasoactive Intestinal Peptide)'),
    ],
    regulatoryRecords: [
      {
        agency: 'FDA',
        jurisdiction: 'United States',
        regulatoryStatus: 'not_approved',
        notes:
          'No approved VIP-based drug product located. Synthetic analogue aviptadil has registered investigational trials for severe respiratory conditions (e.g. ARDS) without located approval.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'structureActivity',
      },
    ],
  },

  // -----------------------------------------------------------------
  // Vitamin B12
  // -----------------------------------------------------------------
  {
    slug: 'vitamin-b12',
    name: 'Vitamin B12',
    entityKind: 'non_peptide_research_compound',
    category: 'Vitamins & Cofactors',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: [
      'vitamin B12 cobalamin FDA approved cyanocobalamin injection deficiency treatment PubMed',
    ],
    batch: BATCH,
    identityConfidence: 'verified',
    overviewWhatItIs:
      'Vitamin B12 (cobalamin) is an essential water-soluble vitamin required for red blood cell formation, neurological function, and DNA synthesis. Multiple chemical forms exist (cyanocobalamin, methylcobalamin, hydroxocobalamin, adenosylcobalamin) with somewhat different pharmacology — this profile covers the vitamin generally and does not assert a specific form, since no specific form is confirmed for any Cloud Peptides product in this research pass.',
    overviewWhyPeopleUseIt:
      'It has genuine, FDA-approved uses for treating and preventing vitamin B12 deficiency (e.g. pernicious anemia, malabsorption conditions). It is also discussed in general wellness/energy contexts; those uses are not FDA-approved indications.',
    overviewResearchSummary:
      "Human research: an FDA-approved product class (cyanocobalamin injection) with real FDA prescribing information, plus peer-reviewed clinical studies confirming efficacy for deficiency treatment in specific populations (Crohn's disease, atrophic gastritis).",
    overviewBottomLine:
      'Unlike most compounds on this site, Vitamin B12 has a well-established, genuinely FDA-approved use for a real medical condition (B12 deficiency) — this profile still does not provide dosing or usage guidance, and does not assert a specific chemical form.',
    administrationContext:
      'FDA-approved use is via intramuscular injection or, per some published studies, oral administration for deficiency correction — both administered under medical supervision for a diagnosed deficiency; this profile summarizes that regulatory/clinical context only.',
    aliases: [
      { alias: 'Cobalamin', type: 'scientific_name' },
      {
        alias: 'Cyanocobalamin',
        type: 'scientific_name',
        note: 'One specific chemical form, used in the FDA-approved injectable product cited in this profile — not asserted as the only or default form.',
      },
    ],
    sources: {
      fdaLabel: {
        sourceType: 'fda_document',
        title: 'Cyanocobalamin Injection, USP — FDA-approved prescribing information',
        url: 'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=a66eb3c4-3e1d-4d49-b963-4fa2334cc9b6',
        publisherOrAgency: 'U.S. Food and Drug Administration / DailyMed (NIH)',
        retrievedDate: SEARCH_DATE,
      },
      crohnsStudy: {
        sourceType: 'pubmed_article',
        title:
          "Oral Cyanocobalamin is Effective in the Treatment of Vitamin B12 Deficiency in Crohn's Disease",
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5372971/',
        retrievedDate: SEARCH_DATE,
      },
      gastritisStudy: {
        sourceType: 'pubmed_article',
        title:
          'Intramuscular Cyanocobalamin Treatment in Patients with Corpus Atrophic Gastritis and Vitamin B12 Deficiency: Efficacy and Predictors of Increased Requirement',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12845104/',
        retrievedDate: SEARCH_DATE,
      },
    },
    claims: [
      {
        section: 'summary',
        statement:
          'Vitamin B12 (cobalamin) is an essential water-soluble vitamin required for red blood cell formation, neurological function, and DNA synthesis; several chemically distinct forms exist (cyanocobalamin, methylcobalamin, hydroxocobalamin, adenosylcobalamin).',
        evidenceQuality: 'high',
        qualityRationale: 'Well-established, foundational human nutritional biochemistry.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'fdaLabel' }],
      },
      {
        section: 'regulatory',
        statement:
          'Cyanocobalamin injection is FDA-approved for treatment of vitamin B12 deficiency, including pernicious anemia and malabsorption-related deficiency.',
        evidenceQuality: 'high',
        qualityRationale: 'Directly verified against FDA-approved prescribing information.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'fdaLabel' }],
      },
      {
        section: 'summary',
        statement:
          "In a study of patients with Crohn's disease, oral cyanocobalamin was effective for both acute and maintenance treatment of vitamin B12 deficiency.",
        evidenceQuality: 'moderate',
        qualityRationale: 'Peer-reviewed human study in a specific patient population.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'crohnsStudy' }],
      },
      {
        section: 'summary',
        statement:
          'In patients with corpus atrophic gastritis and B12 deficiency, intramuscular cyanocobalamin corrected the deficiency in the majority of patients, with efficacy maintained at longest follow-up.',
        evidenceQuality: 'moderate',
        qualityRationale: 'Peer-reviewed real-world longitudinal cohort study.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'gastritisStudy' }],
      },
      {
        section: 'safety',
        statement:
          'Untreated vitamin B12 deficiency that progresses for more than approximately 3 months may produce permanent degenerative spinal-cord lesions.',
        evidenceQuality: 'high',
        qualityRationale: 'Well-established clinical fact, stated in FDA prescribing information.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'fdaLabel' }],
      },
      ...standardBoilerplateClaims('Vitamin B12'),
    ],
    regulatoryRecords: [
      {
        agency: 'FDA',
        jurisdiction: 'United States',
        formulation: 'Cyanocobalamin injection, USP',
        indication:
          'Vitamin B12 deficiency (pernicious anemia, malabsorption, and related conditions)',
        regulatoryStatus: 'approved',
        notes: 'Directly verified against the FDA-approved prescribing information via DailyMed.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'fdaLabel',
      },
    ],
  },

  // -----------------------------------------------------------------
  // EPO (Erythropoietin) — endogenous hormone, distinct from specific
  // recombinant drug products (per reconciliation manifest rule).
  // -----------------------------------------------------------------
  {
    slug: 'epo',
    name: 'EPO (Erythropoietin)',
    entityKind: 'biologic',
    category: 'Hematologic',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: [
      'erythropoietin EPO recombinant epoetin alfa FDA approved WADA prohibited PubMed',
    ],
    batch: BATCH,
    identityConfidence: 'verified',
    overviewWhatItIs:
      'Erythropoietin (EPO) is an endogenous glycoprotein hormone, produced primarily by the kidneys, that stimulates red blood cell production in bone marrow. This profile covers the endogenous hormone and its physiology first; distinct, specific recombinant drug products (e.g. epoetin alfa, marketed as Epogen/Procrit) are separately identified below rather than treated as one undifferentiated "EPO" entity.',
    overviewWhyPeopleUseIt:
      'Recombinant EPO products have real, FDA-approved medical uses for specific anemias (chronic kidney disease, chemotherapy-induced anemia). EPO and its analogues are also well known for prohibited, performance-enhancing use in sport (blood doping) — this is illegal/prohibited use, not a legitimate research or medical application, and is documented here as a regulatory fact, not a use this site endorses in any way.',
    overviewResearchSummary:
      'A specific recombinant product (epoetin alfa) has real, FDA-approved prescribing information for defined anemia indications. EPO/epoetin is separately and specifically listed on the WADA Prohibited List.',
    overviewBottomLine:
      'EPO is both a well-characterized endogenous hormone with real FDA-approved recombinant drug products for legitimate medical anemia treatment, and a substance with well-documented, specifically prohibited non-medical (doping) use — both facts are recorded here without conflating the two.',
    administrationContext:
      'FDA-approved recombinant EPO products are administered by injection (intravenous or subcutaneous) under medical supervision for a diagnosed anemia; this profile summarizes that regulatory/clinical context only.',
    aliases: [
      { alias: 'Erythropoietin', type: 'scientific_name' },
      {
        alias: 'Epoetin Alfa',
        type: 'generic_name',
        note: 'A specific recombinant EPO drug product (e.g. Epogen, Procrit) — not identical to endogenous EPO or to other recombinant products (e.g. epoetin beta, darbepoetin alfa).',
      },
    ],
    sources: {
      fdaLabel: {
        sourceType: 'fda_document',
        title: 'EPOGEN (Epoetin alfa) for Injection — FDA-approved prescribing information',
        url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2007/103234s5163lbl.pdf',
        publisherOrAgency: 'U.S. Food and Drug Administration',
        publicationDate: '2007-12-17',
        retrievedDate: SEARCH_DATE,
      },
      wadaList: WADA_SOURCE,
    },
    claims: [
      {
        section: 'summary',
        statement:
          'Erythropoietin (EPO) is an endogenous glycoprotein hormone, produced primarily by the kidneys, that stimulates red blood cell production in bone marrow. Epoetin alfa is a specific recombinant DNA-technology product with the same biological effects as endogenous EPO — it is one of several distinct recombinant EPO-class products (others include epoetin beta and darbepoetin alfa), not a synonym for "EPO" generally.',
        evidenceQuality: 'high',
        qualityRationale: 'Directly described in the FDA-approved prescribing information.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'fdaLabel' }],
      },
      {
        section: 'regulatory',
        statement:
          'Epoetin alfa (Epogen/Procrit) is FDA-approved to treat anemia associated with chronic kidney disease, certain chemotherapy regimens, and certain surgical settings.',
        evidenceQuality: 'high',
        qualityRationale: 'Directly verified against the FDA-approved prescribing information.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'fdaLabel' }],
      },
      {
        section: 'regulatory',
        statement:
          "Erythropoietin and its analogues are listed under the World Anti-Doping Agency's S2 category (Peptide Hormones, Growth Factors, Related Substances and Mimetics) and have been prohibited in competitive sport since the early 1990s.",
        evidenceQuality: 'high',
        qualityRationale: "Directly verified against WADA's own published Prohibited List.",
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'wadaList' }],
      },
      ...standardBoilerplateClaims('EPO (Erythropoietin)'),
    ],
    regulatoryRecords: [
      {
        agency: 'FDA',
        jurisdiction: 'United States',
        formulation: 'Epoetin alfa (Epogen/Procrit)',
        indication:
          'Anemia associated with chronic kidney disease, certain chemotherapy, and certain surgical settings',
        regulatoryStatus: 'approved',
        notes: 'Directly verified against the FDA-approved prescribing information (BLA 103234).',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'fdaLabel',
      },
      {
        agency: 'World Anti-Doping Agency',
        jurisdiction: 'International (sport)',
        regulatoryStatus: 'banned_in_sport',
        notes:
          'Listed under S2, prohibited at all times; a primary target of anti-doping testing since the early 1990s.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'wadaList',
      },
    ],
  },

  // -----------------------------------------------------------------
  // FOXO4-DRI — explicitly distinguished from the native FOXO4
  // transcription factor.
  // -----------------------------------------------------------------
  {
    slug: 'foxo4-dri',
    name: 'FOXO4-DRI',
    entityKind: 'peptide',
    category: 'Senescence & Aging Research',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: ['Baar FOXO4-DRI senescent cells Cell 2017 DOI PMID'],
    batch: BATCH,
    overviewWhatItIs:
      'FOXO4-DRI is a synthetic D-retro-inverso peptide designed to disrupt the interaction between the FOXO4 transcription factor and p53 inside senescent cells, triggering their selective apoptosis (a "senolytic" mechanism). IMPORTANT IDENTITY NOTE: FOXO4-DRI is a distinct, synthetic, designed peptide — it is NOT the same thing as native FOXO4, which is a naturally occurring human transcription-factor protein, not a peptide product. This profile covers FOXO4-DRI specifically, based on this codebase\'s peptide-research-vendor context (this candidate appeared in the same list as GHRP-2, SNAP-8, and similar research peptides, where FOXO4-DRI — not the native transcription factor — is the substance actually discussed/sold).',
    overviewWhyPeopleUseIt:
      'It is investigated in preclinical (animal and cell-culture) senescence/aging research for selectively clearing senescent ("zombie") cells. No human clinical trials exist — this is an active preclinical research area, not an established or approved use.',
    overviewResearchSummary:
      'Animal research: the original 2017 Cell paper (mouse models of accelerated and natural aging) plus multiple follow-up peer-reviewed animal studies (e.g. aged-mouse Leydig cells, endothelial senescence). Laboratory research: human-cell-culture studies (e.g. chondrocytes). No human clinical trials were located in the databases searched as of 2026-08-19.',
    overviewBottomLine:
      'A real, influential, peer-reviewed foundational discovery (Baar et al. 2017, Cell) with a growing preclinical follow-up literature — but entirely preclinical: no human trial of any kind was located.',
    administrationContext:
      'The original and follow-up animal studies used systemic (intraperitoneal) injection in mice; human-cell studies applied the peptide directly to cultured cells. No published human dosing data exist in any form.',
    aliases: [],
    sources: {
      originalCellPaper: {
        sourceType: 'pubmed_article',
        title:
          'Targeted Apoptosis of Senescent Cells Restores Tissue Homeostasis in Response to Chemotoxicity and Aging',
        url: 'https://www.cell.com/cell/fulltext/S0092-8674(17)30293-3',
        publisherOrAgency: 'Cell',
        publicationDate: '2017-03-23',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '28340339' },
      },
      chondrocyteStudy: {
        sourceType: 'pubmed_article',
        title:
          'Senolytic Peptide FOXO4-DRI Selectively Removes Senescent Cells From in vitro Expanded Human Chondrocytes',
        url: 'https://www.frontiersin.org/journals/bioengineering-and-biotechnology/articles/10.3389/fbioe.2021.677576/full',
        publisherOrAgency: 'Frontiers in Bioengineering and Biotechnology',
        publicationDate: '2021-01-01',
        retrievedDate: SEARCH_DATE,
        identifiers: { doi: '10.3389/fbioe.2021.677576' },
      },
      leydigCellStudy: {
        sourceType: 'pubmed_article',
        title:
          'FOXO4-DRI alleviates age-related testosterone secretion insufficiency by targeting senescent Leydig cells in aged mice',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7053614/',
        retrievedDate: SEARCH_DATE,
      },
    },
    studies: [
      {
        sourceKey: 'originalCellPaper',
        studyDesign: 'animal_study',
        population: 'XpdTTD/TTD accelerated-aging mice and naturally aged mice',
        intervention: 'FOXO4-DRI peptide, systemic administration',
        resultsSummary:
          'FOXO4-DRI disrupted the FOXO4-p53 interaction, triggering p53 nuclear exclusion and apoptosis specifically in senescent cells; treated mice showed counteracted doxorubicin (chemotoxicity) damage and improved fitness, fur density, and renal function.',
        limitations: 'Mouse models only; no human data of any kind in this foundational paper.',
        peerReviewStatus: 'peer_reviewed',
      },
      {
        sourceKey: 'chondrocyteStudy',
        studyDesign: 'in_vitro_study',
        population: 'In-vitro expanded human chondrocytes (cell culture)',
        intervention: 'FOXO4-DRI applied to cultured cells',
        resultsSummary:
          'Selectively removed senescent cells from expanded human chondrocyte cultures.',
        limitations: 'In-vitro human-cell-culture study, not a clinical trial.',
        peerReviewStatus: 'peer_reviewed',
      },
    ],
    claims: [
      {
        section: 'summary',
        statement:
          'FOXO4-DRI is a synthetic D-retro-inverso peptide, distinct from the native FOXO4 transcription factor, designed to disrupt the FOXO4-p53 protein interaction inside senescent cells and trigger their selective apoptosis.',
        evidenceQuality: 'high',
        qualityRationale: 'Directly described in the foundational peer-reviewed publication.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'originalCellPaper' }],
      },
      {
        section: 'mechanism',
        statement:
          'In mouse models, FOXO4-DRI disrupted the FOXO4-p53 interaction that protects senescent cells from apoptosis, triggering p53 nuclear exclusion and cell-intrinsic apoptosis specifically in senescent cells, sparing normal cells that do not depend on this interaction.',
        evidenceQuality: 'moderate',
        qualityRationale: 'Peer-reviewed, but animal-model evidence only.',
        interpretationStatus: 'preliminary',
        sourceKeys: [{ key: 'originalCellPaper' }],
      },
      {
        section: 'summary',
        statement:
          'In naturally aged and accelerated-aging mouse models, FOXO4-DRI treatment counteracted chemotoxicity (doxorubicin) damage and improved fitness, fur density, and renal function measures.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Single foundational peer-reviewed animal study; not yet replicated in humans.',
        interpretationStatus: 'preliminary',
        sourceKeys: [{ key: 'originalCellPaper' }],
      },
      {
        section: 'summary',
        statement:
          'Follow-up peer-reviewed animal and cell-culture studies have extended this finding — for example, FOXO4-DRI reduced senescent Leydig cells and alleviated age-related testosterone insufficiency in aged mice, and selectively removed senescent cells from cultured human chondrocytes.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Multiple peer-reviewed follow-up studies, still entirely preclinical (animal/cell-culture).',
        interpretationStatus: 'preliminary',
        sourceKeys: [{ key: 'leydigCellStudy' }, { key: 'chondrocyteStudy' }],
      },
      {
        section: 'safety',
        statement:
          'No human clinical trials of FOXO4-DRI, and therefore no human safety data, were located in the databases searched as of 2026-08-19.',
        interpretationStatus: 'insufficient',
      },
      ...standardBoilerplateClaims('FOXO4-DRI'),
    ],
    regulatoryRecords: [],
  },

  // -----------------------------------------------------------------
  // Lipo-C — formulation-dependent, no single "the" formula asserted.
  // -----------------------------------------------------------------
  {
    slug: 'lipo-c',
    name: 'Lipo-C',
    entityKind: 'supplement',
    category: 'Compounded Formulations',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: [
      'lipotropic injection MIC methionine inositol choline B12 evidence review PubMed',
    ],
    batch: BATCH,
    overviewWhatItIs:
      '"Lipo-C" is a commercial/compounding-industry name for a "lipotropic" injectable formulation. Composition genuinely varies by manufacturer/compounding pharmacy — commonly reported combinations include methionine, inositol, and choline (the "MIC" combination), sometimes with added vitamin B12 and/or L-carnitine. This profile does NOT assert a single universal formula, and does not confirm which specific formulation, if any, corresponds to a Cloud Peptides product — no internal product specification or COA evidence was found to confirm this during the reconciliation pass.',
    overviewWhyPeopleUseIt:
      'It is marketed for weight-loss-adjacent "fat burning" and metabolic-support claims by wellness clinics and compounding pharmacies. These are commercial/marketing claims, not established, peer-reviewed clinical findings for the combined formulation.',
    overviewResearchSummary:
      'No controlled human trials evaluating the combined MIC (or similar lipotropic) formulation for weight loss were located in the databases searched as of 2026-08-19. The individual component ingredients (methionine, inositol, choline, and — when included — vitamin B12) each have their own separate, better-established biochemical/nutritional literature, which this profile does not extend to the combined product.',
    overviewBottomLine:
      "Evidence for the combined lipotropic/MIC formulation itself is weak to absent in controlled human trials; individual components have real, separate roles in metabolism, but that does not establish the combined product's own claimed weight-loss effect.",
    administrationContext:
      'Commercial lipotropic products are administered by injection at compounding pharmacies/wellness clinics; this profile provides no dosing or formulation guidance and does not confirm any specific formulation.',
    aliases: [
      {
        alias: 'MIC Injection',
        type: 'brand_name',
        note: 'Common alternate/generic commercial name for methionine-inositol-choline lipotropic formulations.',
      },
      { alias: 'Lipotropic Injection', type: 'generic_name' },
    ],
    sources: {
      evidenceReview: {
        sourceType: 'other',
        title: 'Lipotropic Injections (MIC): Evidence, Protocol & GLP-1 Era Role',
        url: 'https://www.empiremedicaltraining.com/blog/what-are-mic-lipotropic-injections/',
        publisherOrAgency:
          'Empire Medical Training (clinician-training/continuing-education provider — not a peer-reviewed source; cited here only for its own explicit acknowledgment of the evidence gap, not as scientific evidence of any effect)',
        retrievedDate: SEARCH_DATE,
      },
    },
    claims: [
      {
        section: 'summary',
        statement:
          '"Lipo-C" / "MIC" injections are compounded blends commonly containing methionine, inositol, and choline, often combined with vitamin B12; the exact formulation varies by manufacturer or compounding pharmacy, and no single universal formula exists.',
        evidenceQuality: 'low',
        qualityRationale:
          'Based on general compounding-industry/wellness-clinic descriptions, not a peer-reviewed formulation standard; genuinely variable by source.',
        interpretationStatus: 'unknown',
        sourceKeys: [{ key: 'evidenceReview' }],
      },
      {
        section: 'summary',
        statement:
          'No controlled human clinical trials evaluating the combined lipotropic/MIC formulation for weight loss were located in the databases searched as of 2026-08-19; supplementing individuals who are not deficient in these nutrients has not been shown to produce weight loss.',
        interpretationStatus: 'insufficient',
      },
      {
        section: 'faq',
        statement:
          "Q: Do the individual ingredients (methionine, inositol, choline, B12) have their own research? A: Yes — each has a real, separate biochemical/nutritional literature (e.g. choline and methionine in liver lipid metabolism, B12 in the deficiency-treatment literature covered in this site's separate Vitamin B12 profile). That existing evidence for the individual ingredients does not, by itself, establish a specific clinical effect for any particular combined lipotropic product.",
        interpretationStatus: 'insufficient',
      },
      {
        section: 'regulatory',
        statement:
          'Lipotropic/MIC injections are not FDA-approved for any weight-loss indication; they are typically compounded products, not manufactured under an FDA-approved drug application.',
        interpretationStatus: 'established',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Consistent with the general regulatory status of compounded (vs. FDA-approved) pharmacy products.',
        sourceKeys: [{ key: 'evidenceReview', relationship: 'provides_context' }],
      },
      ...standardBoilerplateClaims('Lipo-C'),
    ],
    regulatoryRecords: [],
  },
];

async function main() {
  const client = getServiceClient();
  console.log(`Importing batch 4 (${compounds.length} compounds)...\n`);
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
