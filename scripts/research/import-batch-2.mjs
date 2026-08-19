#!/usr/bin/env node
/**
 * Research DB expansion — Batch 2: metabolic/incretin peptides.
 * Mazdutide, Survodutide (new profiles), CagriSema (combination
 * profile referencing the existing Cagrilintide and Semaglutide
 * profiles — both already published, untouched by this batch).
 *
 * Run manually, locally: node scripts/research/import-batch-2.mjs
 * Idempotent — see scripts/research/lib/import-helpers.mjs.
 */
import {
  getServiceClient,
  importCompound,
  standardBoilerplateClaims,
} from './lib/import-helpers.mjs';

const SEARCH_DATE = '2026-08-19';
const DATABASES = ['PubMed/MEDLINE (via NCBI eutils)', 'PMC', 'ClinicalTrials.gov', 'NEJM.org'];
const BATCH = 'batch-2-metabolic-incretin';

const compounds = [
  // -----------------------------------------------------------------
  // Mazdutide
  // -----------------------------------------------------------------
  {
    slug: 'mazdutide',
    name: 'Mazdutide',
    entityKind: 'peptide',
    category: 'Metabolic & Incretin Therapeutics',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: [
      'mazdutide IBI362 phase 3 trial obesity PubMed NEJM Lancet',
      'mazdutide NMPA approval China obesity 2026 official',
    ],
    batch: BATCH,
    overviewWhatItIs:
      'Mazdutide is a synthetic, fatty-acid-modified oxyntomodulin analogue engineered as a once-weekly dual GLP-1/glucagon receptor agonist, developed by Innovent Biologics.',
    overviewWhyPeopleUseIt:
      'It is investigated for chronic weight management and glycemic control in type 2 diabetes, in the same drug class as tirzepatide, semaglutide, and retatrutide. Approved uses exist in China; it is not FDA-approved. This profile does not imply approval anywhere it has not been documented.',
    overviewResearchSummary:
      'Human research: a published phase 1b dose-finding trial and a published phase 2 randomized controlled trial with real efficacy/safety data (both Chinese populations), plus ongoing phase 3 program (GLORY-1/GLORY-3, DREAMS-3). Regulatory status recorded for this compound: approved in China (weight management and type 2 diabetes), not approved in the United States.',
    overviewBottomLine:
      'Substantial industry-sponsored human trial data exist, including a completed phase 2 RCT with real weight-loss and safety numbers, and the compound is already approved in China — but no independent (non-sponsor) long-term outcomes data or FDA review were located.',
    administrationContext:
      'All located human trials used once-weekly subcutaneous injection with a gradual dose-titration schedule (published study doses, not usage instructions) — this profile summarizes that trial design context only.',
    aliases: [
      { alias: 'IBI362', type: 'development_code' },
      {
        alias: 'LY3305677',
        type: 'development_code',
        note: 'Co-development code used with Eli Lilly for markets outside China.',
      },
    ],
    sources: {
      phase2RCT: {
        sourceType: 'pubmed_article',
        title:
          'A phase 2 randomised controlled trial of mazdutide in Chinese overweight adults or adults with obesity',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10719339/',
        publisherOrAgency: 'Nature Communications',
        publicationDate: '2023-12-14',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '38092790', doi: '10.1038/s41467-023-44067-4' },
      },
      phase1bTrial: {
        sourceType: 'pubmed_article',
        title:
          'Safety and efficacy of a GLP-1 and glucagon receptor dual agonist mazdutide (IBI362) 9 mg and 10 mg in Chinese adults with overweight or obesity: A randomised, placebo-controlled, multiple-ascending-dose phase 1b trial',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9561728/',
        retrievedDate: SEARCH_DATE,
      },
      nmpaApproval: {
        sourceType: 'regulatory_announcement',
        title:
          "Innovent Announces Mazdutide, First Dual GCG/GLP-1 Receptor Agonist, Received Approval from China's NMPA for Chronic Weight Management",
        url: 'https://www.prnewswire.com/news-releases/innovent-announces-mazdutide-first-dual-gcgglp-1-receptor-agonist-received-approval-from-chinas-nmpa-for-chronic-weight-management-302493152.html',
        publisherOrAgency: 'Innovent Biologics (company press release)',
        publicationDate: '2025-06-01',
        retrievedDate: SEARCH_DATE,
      },
    },
    studies: [
      {
        sourceKey: 'phase2RCT',
        studyDesign: 'rct_human',
        population:
          '248 Chinese adults, overweight or obese (mean age 35.5, mean baseline BMI 31.8 kg/m2), 20 hospitals',
        sampleSize: 248,
        comparator: 'Placebo',
        intervention:
          'Once-weekly subcutaneous mazdutide, 3 mg, 4.5 mg, or 6 mg, with 4-8 week dose titration',
        route: 'Subcutaneous injection',
        publishedResearchDose:
          '3 mg, 4.5 mg, or 6 mg once weekly (published trial dose, not a usage recommendation)',
        duration: '24 weeks',
        primaryOutcomes: 'Percent body weight change from baseline',
        resultsSummary:
          'Weight change vs. baseline: -6.7% (3 mg), -10.4% (4.5 mg), -11.3% (6 mg), vs. +1.0% placebo (treatment difference -7.7% to -12.3%, p<0.0001). Treatment-emergent adverse events (mostly GI) occurred in 95.2% of mazdutide recipients vs. 80.6% placebo; mean heart rate increased 5.8-8.75 bpm across dose groups; one treatment-related discontinuation; no severe hypoglycemia.',
        limitations:
          'Chinese population only, 24-week duration, industry-sponsored (Innovent Biologics) — long-term and non-Chinese-population data not yet published.',
        peerReviewStatus: 'peer_reviewed',
      },
    ],
    claims: [
      {
        section: 'summary',
        statement:
          'Mazdutide is a synthetic, fatty-acid-modified oxyntomodulin analogue engineered as a once-weekly dual GLP-1/glucagon receptor agonist, in the same drug class as tirzepatide and retatrutide.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Peer-reviewed phase 1b/2 trial publications describing the drug class and mechanism.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'phase1bTrial' }],
      },
      {
        section: 'summary',
        statement:
          'In a 24-week, placebo-controlled phase 2 trial of 248 Chinese adults, mazdutide 6 mg produced an 11.3% mean weight reduction from baseline (vs. +1.0% with placebo), with a similar dose-dependent pattern at 3 mg and 4.5 mg.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Peer-reviewed, randomized, placebo-controlled trial; industry-sponsored, single-country population, 24-week duration.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'phase2RCT' }],
      },
      {
        section: 'safety',
        statement:
          'In the same phase 2 trial, treatment-emergent adverse events (predominantly gastrointestinal — diarrhea, nausea, vomiting) occurred in 95.2% of mazdutide recipients vs. 80.6% of placebo recipients; heart rate increased by 5.8-8.75 beats per minute across dose groups; no severe hypoglycemia was reported.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Peer-reviewed 24-week trial; longer-term safety data not yet published in the sources reviewed.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'phase2RCT' }],
      },
      {
        section: 'regulatory',
        statement:
          "Mazdutide received approval from China's National Medical Products Administration (NMPA) for chronic weight management in 2025, and separately for glycemic control in type 2 diabetes; it has not been submitted to or approved by the US FDA for any indication as of this research pass.",
        evidenceQuality: 'moderate',
        qualityRationale:
          "Based on the developer's own regulatory-approval press release; the primary NMPA approval record itself was not independently retrieved in this pass.",
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'nmpaApproval' }],
      },
      {
        section: 'faq',
        statement:
          'Q: Has mazdutide completed Phase 3 trials? A: A Phase 3 program (including trials referred to as GLORY-1, GLORY-3, and DREAMS-3) is registered and reported as underway/completed in China as of this research pass; this profile summarizes only the published phase 1b/2 data verified directly, and does not assert specific Phase 3 results that were not independently confirmed against a peer-reviewed publication.',
        interpretationStatus: 'insufficient',
      },
      ...standardBoilerplateClaims('Mazdutide'),
    ],
    regulatoryRecords: [
      {
        agency: "China's National Medical Products Administration (NMPA)",
        jurisdiction: 'China',
        indication: 'Chronic weight management (overweight/obesity)',
        regulatoryStatus: 'approved',
        statusChangeDate: '2025-06-01',
        notes:
          "Per the developer's (Innovent Biologics) own press release; primary NMPA record not independently retrieved in this pass.",
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'nmpaApproval',
      },
      {
        agency: 'FDA',
        jurisdiction: 'United States',
        regulatoryStatus: 'not_approved',
        notes:
          'Not submitted to or approved by the FDA for any indication as of this research pass.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'nmpaApproval',
      },
    ],
  },

  // -----------------------------------------------------------------
  // Survodutide
  // -----------------------------------------------------------------
  {
    slug: 'survodutide',
    name: 'Survodutide',
    entityKind: 'peptide',
    category: 'Metabolic & Incretin Therapeutics',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: [
      'survodutide BI 456906 phase 3 trial obesity PubMed clinical trial results',
      '"SYNCHRONIZE-1" survodutide NEJM DOI New England Journal of Medicine 2026',
    ],
    batch: BATCH,
    overviewWhatItIs:
      'Survodutide (BI 456906) is a synthetic dual glucagon receptor/GLP-1 receptor agonist peptide developed by Boehringer Ingelheim (originating from Zealand Pharma).',
    overviewWhyPeopleUseIt:
      'It is investigated for chronic weight management, MASLD/MASH (fatty liver disease), and related metabolic indications, in the same drug class as tirzepatide and retatrutide. It is investigational — not approved by any regulator identified in this research pass.',
    overviewResearchSummary:
      'Human research: a completed, published phase 3 randomized controlled trial (SYNCHRONIZE-1, NEJM 2026) with real efficacy and body-composition data. No FDA or other regulatory approval was located as of this research pass.',
    overviewBottomLine:
      'Substantial, recent, peer-reviewed phase 3 human trial data exist showing significant weight loss and visceral/liver fat reduction versus placebo, but the drug remains investigational with no regulatory approval located anywhere.',
    administrationContext:
      'The located phase 3 trial used once-weekly subcutaneous injection with dose titration up to 3.6 mg or 6.0 mg (published trial dose, not a usage recommendation).',
    aliases: [{ alias: 'BI 456906', type: 'development_code' }],
    sources: {
      synchronize1: {
        sourceType: 'pubmed_article',
        title: 'Survodutide Once Weekly for the Treatment of Adults with Obesity',
        url: 'https://pubmed.ncbi.nlm.nih.gov/42253238/',
        publisherOrAgency: 'New England Journal of Medicine',
        publicationDate: '2026-06-07',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '42253238', doi: '10.1056/NEJMoa2600751' },
      },
      baselineCharacteristics: {
        sourceType: 'pubmed_article',
        title:
          'Survodutide for treatment of obesity: Baseline characteristics of participants in a randomized, double-blind, placebo-controlled, phase 3 trial (SYNCHRONIZE-1)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/41187967/',
        retrievedDate: SEARCH_DATE,
        identifiers: { pmid: '41187967' },
      },
    },
    studies: [
      {
        sourceKey: 'synchronize1',
        studyDesign: 'rct_human',
        population:
          'Adults with BMI >30, or >27 plus at least one obesity-related complication, without diabetes; 116 sites, 14 countries',
        comparator: 'Placebo',
        intervention: 'Once-weekly subcutaneous survodutide, dose-adjusted up to 3.6 mg or 6.0 mg',
        route: 'Subcutaneous injection',
        publishedResearchDose:
          'Up to 3.6 mg or 6.0 mg once weekly (published trial dose, not a usage recommendation)',
        duration: '76 weeks (November 2023-February 2026 enrollment period)',
        primaryOutcomes:
          'Percent body weight change from baseline; co-primary endpoints on efficacy and treatment-regimen estimands',
        resultsSummary:
          'Weight loss up to 16.6% (efficacy estimand) vs. 3.2% with placebo (p<0.0001); 85.1% of survodutide participants achieved >=5% weight loss vs. 38.8% placebo. MRI substudy: up to 34.0% visceral fat reduction and up to 63.1% liver fat reduction, with lean mass accounting for <=10.8% of tissue-mass change.',
        limitations:
          'Industry-sponsored (Boehringer Ingelheim); population excluded people with diabetes; long-term (multi-year) outcomes not yet published.',
        peerReviewStatus: 'peer_reviewed',
      },
    ],
    claims: [
      {
        section: 'summary',
        statement:
          'Survodutide (BI 456906) is a synthetic dual glucagon receptor/GLP-1 receptor agonist peptide, in the same drug class as tirzepatide, retatrutide, and mazdutide.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Described in the peer-reviewed phase 3 trial publication and its baseline-characteristics companion paper.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'baselineCharacteristics' }],
      },
      {
        section: 'summary',
        statement:
          'In a 76-week, placebo-controlled phase 3 trial (SYNCHRONIZE-1), survodutide produced up to 16.6% mean body weight loss (efficacy estimand) vs. 3.2% with placebo, with 85.1% of participants achieving at least 5% weight loss vs. 38.8% on placebo.',
        evidenceQuality: 'high',
        qualityRationale:
          'Large, peer-reviewed, multinational, placebo-controlled phase 3 randomized trial published in NEJM.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'synchronize1' }],
      },
      {
        section: 'summary',
        statement:
          'An MRI substudy of the same trial found up to 34.0% visceral fat reduction and up to 63.1% liver fat reduction with survodutide, with lean tissue accounting for no more than 10.8% of the total tissue-mass change.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Substudy of the main phase 3 trial; smaller sample than the full trial population.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'synchronize1' }],
      },
      {
        section: 'regulatory',
        statement:
          'No FDA or other national regulatory approval for survodutide was located in the databases searched as of 2026-08-19; it remains an investigational compound in ongoing Phase 3 development (including a dedicated cardiovascular-outcomes trial, SYNCHRONIZE-CVOT).',
        interpretationStatus: 'insufficient',
      },
      ...standardBoilerplateClaims('Survodutide'),
    ],
    regulatoryRecords: [
      {
        agency: 'FDA',
        jurisdiction: 'United States',
        regulatoryStatus: 'investigational',
        notes:
          'Active Phase 3 program (SYNCHRONIZE-1 completed and published; SYNCHRONIZE-CVOT ongoing); no approval located as of this research pass.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'synchronize1',
      },
    ],
  },

  // -----------------------------------------------------------------
  // CagriSema — combination profile (peptide_blend), components already
  // exist as their own separate, complete, published research profiles
  // (Cagrilintide slug 'cagrilintide', Semaglutide slug 'semaglutide')
  // and are NOT re-researched or duplicated here.
  // -----------------------------------------------------------------
  {
    slug: 'cagrisema',
    name: 'CagriSema',
    entityKind: 'peptide_blend',
    category: 'Metabolic & Incretin Therapeutics',
    searchDate: SEARCH_DATE,
    databasesSearched: DATABASES,
    searchTerms: ['CagriSema REDEFINE trial cagrilintide semaglutide results phase 3'],
    batch: BATCH,
    identityConfidence: 'verified',
    overviewWhatItIs:
      "CagriSema is Novo Nordisk's fixed-ratio, once-weekly combination of two peptides that each already have their own separate, complete research profiles on this site: cagrilintide (an amylin-receptor agonist) and semaglutide (a GLP-1 receptor agonist). This profile covers the COMBINATION specifically — see the separate Cagrilintide and Semaglutide profiles for each component's own individual mechanism and evidence base.",
    overviewWhyPeopleUseIt:
      'It is investigated for chronic weight management, combining two different hormone-receptor mechanisms in one product. The 2.4 mg/2.4 mg dose studied in its pivotal trial is a specific trial dose, not separate "strengths" requiring separate profiles — lower doses studied in earlier trials are the same combination at different doses.',
    overviewResearchSummary:
      'Human research: a completed, large (n=3,417), published phase 3 randomized controlled trial (REDEFINE 1, NEJM 2026) with real efficacy and safety data, plus a published phase 3a trial in type 2 diabetes (REIMAGINE 1). No FDA or other regulatory approval was located as of this research pass.',
    overviewBottomLine:
      'Strong, recent, peer-reviewed phase 3 evidence of substantial weight loss as a combination — larger than either component alone in cross-trial comparisons reported by the sponsor — but the combination product remains investigational, with no regulatory approval located.',
    administrationContext:
      'The located phase 3 trial used once-weekly, co-administered subcutaneous injection of both peptides at a 2.4 mg/2.4 mg target dose with titration (published trial dose, not a usage recommendation).',
    aliases: [],
    sources: {
      redefine1: {
        sourceType: 'pubmed_article',
        title: 'Coadministered Cagrilintide and Semaglutide in Adults with Overweight or Obesity',
        url: 'https://www.nejm.org/doi/abs/10.1056/NEJMoa2502081',
        publisherOrAgency: 'New England Journal of Medicine',
        publicationDate: '2026-01-01',
        retrievedDate: SEARCH_DATE,
        identifiers: { doi: '10.1056/NEJMoa2502081' },
      },
      reimagine1: {
        sourceType: 'other',
        title:
          'Efficacy and safety of once-weekly cagrilintide-semaglutide (CagriSema) in adults with type 2 diabetes inadequately controlled on diet and exercise (REIMAGINE 1): a randomised, double-blind, placebo-controlled, phase 3a study',
        url: 'https://www.thelancet.com/journals/landia/article/PIIS2213-8587(26)00126-9/abstract',
        publisherOrAgency: 'The Lancet Diabetes & Endocrinology',
        retrievedDate: SEARCH_DATE,
      },
    },
    studies: [
      {
        sourceKey: 'redefine1',
        studyDesign: 'rct_human',
        population:
          '3,417 adults with obesity or overweight and >=1 comorbidity, without type 2 diabetes',
        sampleSize: 3417,
        comparator: 'Placebo; active comparator arms also included in the full trial design',
        intervention:
          'Once-weekly co-administered subcutaneous cagrilintide 2.4 mg + semaglutide 2.4 mg',
        route: 'Subcutaneous injection',
        publishedResearchDose:
          '2.4 mg cagrilintide + 2.4 mg semaglutide once weekly (published trial dose, not a usage recommendation)',
        duration: '68 weeks',
        primaryOutcomes: 'Percent body weight change from baseline',
        resultsSummary:
          'Estimated mean body-weight change at week 68: -20.4% (treatment-policy estimand) vs. -3.0% placebo; -22.7% vs. -2.3% (efficacy/full-adherence estimand). 60% of participants achieved >=20% weight loss; 23% lost >=30%. Improvements also seen in blood pressure, waist circumference, lipids, and glycemic control (88% of participants with prediabetes returned to normoglycemia). Most common adverse events were gastrointestinal, mostly mild-to-moderate and diminishing over time.',
        limitations:
          'Industry-sponsored (Novo Nordisk); excluded people with type 2 diabetes (studied separately in REIMAGINE 1); longer-term (multi-year) outcomes not yet published.',
        peerReviewStatus: 'peer_reviewed',
      },
    ],
    claims: [
      {
        section: 'summary',
        statement:
          "CagriSema is Novo Nordisk's fixed-ratio combination of cagrilintide (an amylin-receptor agonist) and semaglutide (a GLP-1 receptor agonist), co-administered once weekly. Both components already have their own separate research profiles on this site describing their individual mechanisms and evidence bases.",
        evidenceQuality: 'high',
        qualityRationale: 'Directly described in the peer-reviewed phase 3 trial publications.',
        interpretationStatus: 'established',
        sourceKeys: [{ key: 'redefine1' }],
      },
      {
        section: 'summary',
        statement:
          'In a 68-week, placebo-controlled phase 3 trial of 3,417 adults with obesity or overweight, CagriSema produced a mean 20.4% weight reduction (treatment-policy estimand; 22.7% with full adherence) vs. 3.0% with placebo (2.3% efficacy estimand); 60% of participants lost at least 20% of body weight.',
        evidenceQuality: 'high',
        qualityRationale:
          'Large, peer-reviewed, placebo-controlled phase 3 randomized trial published in NEJM.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'redefine1' }],
      },
      {
        section: 'summary',
        statement:
          'A separate phase 3a trial (REIMAGINE 1) evaluated CagriSema specifically in adults with type 2 diabetes inadequately controlled on diet and exercise.',
        evidenceQuality: 'moderate',
        qualityRationale:
          "Peer-reviewed publication; full results were not independently extracted in this pass beyond the trial's existence and population.",
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'reimagine1' }],
      },
      {
        section: 'safety',
        statement:
          'In the REDEFINE 1 trial, the most common adverse events with CagriSema were gastrointestinal, and the large majority were mild to moderate and diminished over time, consistent with the GLP-1 receptor agonist drug class generally.',
        evidenceQuality: 'moderate',
        qualityRationale:
          'Peer-reviewed 68-week trial; longer-term safety data not yet published in the sources reviewed.',
        interpretationStatus: 'supported',
        sourceKeys: [{ key: 'redefine1' }],
      },
      {
        section: 'regulatory',
        statement:
          'No FDA or other national regulatory approval for the CagriSema combination was located in the databases searched as of 2026-08-19; it remains investigational.',
        interpretationStatus: 'insufficient',
      },
      ...standardBoilerplateClaims('CagriSema'),
    ],
    regulatoryRecords: [
      {
        agency: 'FDA',
        jurisdiction: 'United States',
        formulation: 'Cagrilintide 2.4 mg + Semaglutide 2.4 mg co-administered',
        regulatoryStatus: 'investigational',
        notes:
          'Active Phase 3 program (REDEFINE, REIMAGINE); no approval located as of this research pass.',
        lastVerifiedDate: SEARCH_DATE,
        sourceKey: 'redefine1',
      },
    ],
  },
];

async function main() {
  const client = getServiceClient();
  console.log(`Importing batch 2 (${compounds.length} compounds)...\n`);
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

  // CagriSema stack_components — links the new combination compound to
  // the two existing, unmodified Cagrilintide/Semaglutide compound rows.
  const cagrisema = results.find((r) => r.name === 'CagriSema');
  if (cagrisema && (cagrisema.outcome === 'imported' || cagrisema.outcome === 'skipped')) {
    const { data: components } = await client
      .from('compounds')
      .select('id, slug')
      .in('slug', ['cagrilintide', 'semaglutide']);
    for (const component of components ?? []) {
      const { error } = await client.from('stack_components').upsert(
        {
          stack_id: cagrisema.compoundId,
          component_compound_id: component.id,
          dose_or_ratio_note: '2.4 mg + 2.4 mg (REDEFINE 1 pivotal trial dose)',
        },
        { onConflict: 'stack_id,component_compound_id' },
      );
      console.log(
        `stack_components: cagrisema -> ${component.slug}:`,
        error ? error.message : 'linked',
      );
    }
  }

  console.log('\nSummary:');
  for (const r of results) console.log(`  ${r.name}: ${r.outcome}`);
}

main();
