/**
 * BPC-157 — research enrichment pilot data.
 * Every source below was verified directly (NCBI E-utilities for PubMed
 * metadata/abstracts, ClinicalTrials.gov API v2, and the FDA/USADA's own
 * pages) before being added here — none were taken from vendor/peptide-
 * store/affiliate/blog pages or generated from memory alone. See
 * docs/enrichment/pilot-report.md for the full research log.
 *
 * Honest coverage note: BPC-157 has essentially no completed human
 * efficacy evidence — only one currently-recruiting Phase 2 RCT (no
 * results yet) and one n=2 human pilot safety study. This is
 * represented as-is, not inflated; the tendon/ligament/muscle-healing
 * evidence base is entirely animal/in-vitro.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'bpc-157',
  sources: [
    {
      key: 'pmid-21030672',
      sourceType: 'pubmed_article',
      title:
        'The promoting effect of pentadecapeptide BPC 157 on tendon healing involves tendon outgrowth, cell survival, and cell migration.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/21030672/',
      publisherOrAgency: 'Journal of Applied Physiology',
      publicationDate: '2011-03-01',
      identifiers: { pmid: '21030672', doi: '10.1152/japplphysiol.00945.2010' },
      study: {
        studyDesign: 'in_vitro_study',
        population: 'Rat tendon fibroblast explant culture',
        intervention: 'BPC 157 applied to cultured rat tendon explants/fibroblasts',
        resultsSummary:
          'BPC 157 significantly accelerated tendon explant outgrowth, increased fibroblast survival under oxidative (H2O2) stress, and increased dose-dependent fibroblast migration.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-25415472',
      sourceType: 'pubmed_article',
      title:
        'Pentadecapeptide BPC 157 enhances the growth hormone receptor expression in tendon fibroblasts.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/25415472/',
      publisherOrAgency: 'Molecules',
      publicationDate: '2014-11-19',
      identifiers: { pmid: '25415472', doi: '10.3390/molecules191119066' },
      study: {
        studyDesign: 'in_vitro_study',
        population: 'Cultured rat tendon fibroblasts',
        intervention: 'BPC 157 applied to cultured tendon fibroblasts',
        resultsSummary:
          'Growth hormone receptor was identified as one of the most up-regulated genes in BPC-157-treated tendon fibroblasts; BPC 157 increased GH receptor expression dose- and time-dependently.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-20225319',
      sourceType: 'pubmed_article',
      title: 'Pentadecapeptide BPC 157 (PL 14736) improves ligament healing in the rat.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/20225319/',
      publisherOrAgency: 'Journal of Orthopaedic Research',
      publicationDate: '2010-09-01',
      identifiers: { pmid: '20225319', doi: '10.1002/jor.21107' },
      study: {
        studyDesign: 'animal_study',
        population: 'Rat, surgical medial collateral ligament (MCL) transection model',
        intervention:
          'BPC 157 — intraperitoneal (10 microg or 10 ng/kg), topical cream (1.0 microg/g), or oral (in drinking water)',
        route: 'Intraperitoneal, oral, and topical (three arms tested)',
        duration: 'Assessed over 90 days post-transection',
        resultsSummary:
          'BPC 157 produced consistent functional, biomechanical, macroscopic, and histological improvements in MCL healing across all three administration routes tested.',
        limitations: 'Animal model only; sample size per group not stated in the abstract.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-16609979',
      sourceType: 'pubmed_article',
      title:
        'Effective therapy of transected quadriceps muscle in rat: Gastric pentadecapeptide BPC 157.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/16609979/',
      publisherOrAgency: 'Journal of Orthopaedic Research',
      publicationDate: '2006-05-01',
      identifiers: { pmid: '16609979', doi: '10.1002/jor.20089' },
      study: {
        studyDesign: 'animal_study',
        population: 'Rat, surgical quadriceps muscle transection model',
        intervention: 'BPC 157, intraperitoneal',
        route: 'Intraperitoneal',
        resultsSummary:
          'BPC 157 improved functional recovery and healing of surgically transected quadriceps muscle.',
        limitations: 'Animal model only; sample size not stated in the abstract summary reviewed.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-16583442',
      sourceType: 'pubmed_article',
      title:
        'Achilles detachment in rat and stable gastric pentadecapeptide BPC 157: Promoted tendon-to-bone healing and opposed corticosteroid aggravation.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/16583442/',
      publisherOrAgency: 'Journal of Orthopaedic Research',
      publicationDate: '2006-01-01',
      identifiers: { pmid: '16583442', doi: '10.1002/jor.20096' },
      study: {
        studyDesign: 'animal_study',
        population: 'Male Wistar rats, surgical Achilles tendon detachment from calcaneal bone',
        intervention:
          'BPC 157 (10 microg, 10 ng, or 10 pg/kg) alone or combined with 6alpha-methylprednisolone (1 mg/kg)',
        comparator: '6alpha-methylprednisolone alone; 0.9% NaCl control',
        route: 'Intraperitoneal, once daily for 30 days',
        duration: '30 days, assessed at days 1, 4, 7, 10, 14, and 21',
        resultsSummary:
          'BPC 157 improved tendon-to-bone healing functionally, biomechanically, and microscopically (better collagen organization, improved vascular appearance) and substantially counteracted the healing-impairing effect of corticosteroid co-administration.',
        limitations:
          'Animal model only; exact per-group sample size not stated in the abstract reviewed.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-32334036',
      sourceType: 'pubmed_article',
      title:
        'Preclinical safety evaluation of body protective compound-157, a potential drug for treating various wounds.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/32334036/',
      publisherOrAgency: 'Regulatory Toxicology and Pharmacology',
      publicationDate: '2020-07-01',
      identifiers: { pmid: '32334036', doi: '10.1016/j.yrtph.2020.104665' },
      study: {
        studyDesign: 'animal_study',
        population: 'Mice, rats, rabbits, and dogs (multi-species preclinical toxicology panel)',
        intervention: 'BPC-157, single-dose and repeated-dose toxicity protocols',
        resultsSummary:
          'Single-dose toxicity testing showed no test-related effects. Repeated-dose testing in dogs found BPC-157 well tolerated versus solvent control, with one exception: decreased creatinine at 2 mg/kg (not seen at lower doses).',
        limitations: 'Preclinical/animal only — not a substitute for human safety data.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-40131143',
      sourceType: 'pubmed_article',
      title: 'Safety of Intravenous Infusion of BPC157 in Humans: A Pilot Study.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/40131143/',
      publisherOrAgency: 'Alternative Therapies in Health and Medicine',
      publicationDate: '2025-09-01',
      identifiers: { pmid: '40131143' },
      study: {
        studyDesign: 'case_report_or_series',
        population: '2 healthy human adults (58-year-old male, 68-year-old female)',
        sampleSize: 2,
        intervention:
          'Intravenous BPC-157: 10 mg on day 1, 20 mg on day 2, in 250cc normal saline over 1 hour',
        route: 'Intravenous',
        primaryOutcomes:
          'Cardiac, hepatic, renal, thyroid biomarkers; blood glucose; adverse events',
        resultsSummary:
          'No measurable adverse effects on tested cardiac, hepatic, renal, thyroid, or blood-glucose biomarkers in either participant; infusion was well-tolerated at doses up to 20 mg.',
        limitations:
          'Extremely small, uncontrolled pilot (n=2); authors explicitly state larger studies are needed to confirm safety.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'nct07437547',
      sourceType: 'clinicaltrials_gov',
      title:
        'A Randomized, Double-Blind, Placebo-Controlled Phase 2 Trial of Pentadecapeptide BPC 157 for Accelerated Repair of Acute Grade II Hamstring Strain Confirmed by MRI',
      url: 'https://clinicaltrials.gov/study/NCT07437547',
      publisherOrAgency: 'Hudson Biotech (industry sponsor)',
      identifiers: { nctNumber: 'NCT07437547' },
      study: {
        studyDesign: 'rct_human',
        population: 'Human adults with acute Grade II hamstring strain, MRI-confirmed',
        sampleSize: 120,
        intervention: 'BPC-157, subcutaneous injection once daily for 14 days',
        comparator: 'Placebo',
        route: 'Subcutaneous',
        resultsSummary: 'Status: Recruiting as of retrieval date. No results posted.',
        limitations:
          'Trial in progress — recruiting status only, no efficacy or safety results available yet.',
        registrationNumber: 'NCT07437547',
        peerReviewStatus: 'unknown',
      },
    },
    {
      key: 'usada-wada-s0',
      sourceType: 'other',
      title: 'BPC-157: Experimental Peptide Creates Risk for Athletes',
      url: 'https://www.usada.org/spirit-of-sport/bpc-157-peptide-prohibited/',
      publisherOrAgency: 'U.S. Anti-Doping Agency (USADA)',
    },
    {
      key: 'fda-pcac-2026',
      sourceType: 'fda_document',
      title: 'July 23-24, 2026: Meeting of the Pharmacy Compounding Advisory Committee',
      url: 'https://www.fda.gov/advisory-committees/advisory-committee-calendar/july-23-24-2026-meeting-pharmacy-compounding-advisory-committee-07232026',
      publisherOrAgency: 'U.S. Food and Drug Administration',
      publicationDate: '2026-07-23',
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        'In cultured rat tendon explants and fibroblasts, BPC-157 accelerated tendon outgrowth, increased fibroblast survival under oxidative stress, and increased dose-dependent fibroblast migration.',
      evidenceQuality: 'moderate',
      qualityRationale:
        'Peer-reviewed in-vitro mechanistic study; not independently replicated in this review.',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-21030672', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'mechanism',
      statement:
        'BPC-157 up-regulates growth hormone receptor expression in cultured rat tendon fibroblasts in a dose- and time-dependent manner.',
      evidenceQuality: 'moderate',
      qualityRationale:
        'Peer-reviewed in-vitro mechanistic study from the same research group as related tendon-healing studies.',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-25415472', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'summary',
      statement:
        'In rat models of surgically transected ligament, muscle, and tendon-to-bone attachments, BPC-157 administration was consistently associated with improved functional, biomechanical, and histological healing compared to untreated/vehicle controls.',
      evidenceQuality: 'moderate',
      qualityRationale:
        'Consistent findings across three independent peer-reviewed animal studies from the same research group; no independent replication outside that group identified in this review, and per-group sample sizes were not stated in the abstracts reviewed.',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-20225319', relationship: 'directly_supports' },
        { sourceKey: 'pmid-16609979', relationship: 'directly_supports' },
        { sourceKey: 'pmid-16583442', relationship: 'directly_supports' },
      ],
    },
    {
      contentSection: 'summary',
      statement:
        'A Phase 2, randomized, double-blind, placebo-controlled human trial of BPC-157 for acute Grade II hamstring strain (NCT07437547, n=120 estimated) is currently recruiting; no results have been posted.',
      interpretationStatus: 'unknown',
      sources: [{ sourceKey: 'nct07437547', relationship: 'provides_context' }],
    },
    {
      contentSection: 'safety',
      statement:
        'In multi-species preclinical toxicology testing (mice, rats, rabbits, dogs), single-dose BPC-157 showed no test-related toxic effects; repeated-dose testing in dogs was well tolerated except for a decreased creatinine level at the highest dose tested (2 mg/kg).',
      evidenceQuality: 'moderate',
      qualityRationale: 'Peer-reviewed regulatory toxicology study spanning four species.',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-32334036', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'safety',
      statement:
        'In a pilot study of 2 healthy human adults, intravenous BPC-157 (up to 20 mg) produced no measurable adverse effects on tested cardiac, hepatic, renal, thyroid, or blood-glucose biomarkers.',
      evidenceQuality: 'very_low',
      qualityRationale:
        'Extremely small, uncontrolled human pilot (n=2) — the only published human safety data identified for this compound; authors themselves state larger studies are needed.',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-40131143', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'safety',
      statement:
        'No published human efficacy trials, and no published case reports of human toxicity or adverse events, were identified for BPC-157 as of this review — human evidence is limited to one n=2 safety pilot and one currently-recruiting, not-yet-reported Phase 2 trial.',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-40131143', relationship: 'provides_context' },
        { sourceKey: 'nct07437547', relationship: 'provides_context' },
      ],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'World Anti-Doping Agency (WADA)',
      jurisdiction: 'International (competitive sport)',
      regulatoryStatus: 'banned_in_sport',
      sourceKey: 'usada-wada-s0',
      notes:
        'Listed under S0 (Non-Approved Substances) on the WADA Prohibited List, per USADA guidance to athletes. S0 substances are prohibited at all times (in and out of competition) by the structure of the WADA List; this page did not itself restate that timing explicitly.',
    },
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      indication: 'Nominated bulk drug substance for 503A pharmacy compounding',
      regulatoryStatus: 'no_determination',
      effectiveDate: '2026-07-23',
      sourceKey: 'fda-pcac-2026',
      notes:
        "BPC-157 (free base and acetate) was discussed by FDA's Pharmacy Compounding Advisory Committee (PCAC) on July 23-24, 2026 as a nominee for the 503A Bulks List (docket FDA-2026-N-2979). PCAC recommendations are advisory only; no final FDA determination was identified as of this review. Not an approval, and not evidence of safety or effectiveness for any use.",
    },
  ],
  // Closeout pass (2026-08-07): reconciles the 9 pre-existing legacy
  // claims that predate this pipeline's legacy-claim-reconciliation
  // feature (built after the 5-compound pilot ran). BPC-157 has NO
  // FDA-approved drug product of any kind (confirmed above: WADA S0
  // banned, FDA PCAC 'no_determination' only) — so unlike the molecule-
  // vs-approved-product correction needed for Semaglutide and several
  // batch compounds, no such nuance applies here; the "research
  // purposes only" disclaimer is simply and fully accurate as written.
  legacyReconciliations: [
    {
      legacyClaimId: '5cfe77a0-16f8-4a46-9c47-84ff716a3109',
      legacyStatementExcerpt:
        'BPC-157 is a synthetic peptide that has generated significant scientific interest for its potential role in tissue repair',
      disposition: 'supported',
      rationale:
        'Accurate, generic framing consistent with the verified animal/in-vitro tendon, ligament, and muscle-healing literature.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-20225319', relationship: 'directly_supports' },
        { sourceKey: 'pmid-16609979', relationship: 'directly_supports' },
      ],
    },
    {
      legacyClaimId: '82438c93-8922-4c88-8424-520e514860b5',
      legacyStatementExcerpt:
        'Published studies have explored BPC-157 in relation to connective tissue, vascular biology, wound healing, tendon physiology, ligament repair, muscle',
      disposition: 'supported',
      rationale:
        'Connective tissue, wound healing, tendon, ligament, and muscle findings are all directly confirmed by the verified animal studies.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-20225319', relationship: 'directly_supports' },
        { sourceKey: 'pmid-16583442', relationship: 'directly_supports' },
      ],
    },
    {
      legacyClaimId: '689eb7a7-0a23-4b6d-89c5-66d90ec97377',
      legacyStatementExcerpt:
        'Although research is ongoing, scientists investigate BPC-157 for its influence on angiogenesis, cellular signaling, collagen organization, nitric oxid',
      disposition: 'unsupported',
      rationale:
        "BPC-157's angiogenesis and nitric-oxide-pathway mechanisms are discussed in the wider published literature (this is a genuinely real, commonly cited research area for this compound), but no source specifically verifying an angiogenesis or nitric-oxide finding for BPC-157 was included among the sources independently verified in this review — the verified sources cover tendon/ligament/muscle outgrowth and healing, not angiogenesis or NO signaling directly. Not established as false; flagged as currently unverified in this specific review rather than cited to a source that wasn't actually checked.",
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '4a4ab2ad-0731-450f-b84b-59e651215ffc',
      legacyStatementExcerpt:
        'Q: What is BPC-157 primarily researched for? A: Most published research investigates tissue repair, connective tissue biology, angiogenesis, and gastr',
      disposition: 'revised',
      rationale:
        'Tissue repair and connective tissue biology are directly confirmed by the verified tendon/ligament/muscle literature. "Angiogenesis" and the gastrointestinal-protection framing (BPC-157 was originally isolated as a "gastric pentadecapeptide" and is widely discussed for GI protection in the broader literature) were not independently verified against a specific source in this review — represented as an open sub-claim rather than confirmed.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-20225319', relationship: 'directly_supports' },
        { sourceKey: 'pmid-16609979', relationship: 'directly_supports' },
        { sourceKey: 'pmid-16583442', relationship: 'directly_supports' },
      ],
    },
    {
      legacyClaimId: 'd5e60d76-65ba-44bf-b586-93ec89086d11',
      legacyStatementExcerpt:
        'Q: Is BPC-157 approved for medical use? A: This page summarizes scientific literature only. Cloud Peptides does not make claims regarding medical use',
      disposition: 'supported',
      rationale:
        'Accurate and appropriately hedged. Directly consistent with the verified regulatory findings: BPC-157 has no FDA approval, no determination from the PCAC 503A review (advisory only, no final action), and is WADA-banned — there is no approved medical use of any kind to conflict with this claim.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-pcac-2026', relationship: 'directly_supports' }],
    },
    policyReconciliation(
      '6e31469a-272f-42c6-a8a9-e537de764e8b',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      'a3fdffc0-31c9-4dea-b6e4-25e39a85a563',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      '0faa79dc-d16a-4fd5-b3cc-97f2b737bdba',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    {
      legacyClaimId: '21e98fea-5a7c-4f3c-87cf-9030ab6ffd19',
      legacyStatementExcerpt:
        'All products are intended strictly for laboratory research purposes only and are not for human consumption',
      disposition: 'supported',
      rationale:
        'BPC-157 has no FDA-approved drug product of any kind (confirmed by the verified WADA S0 and FDA PCAC "no_determination" regulatory findings above) — unlike several other compounds in this database where an approved drug product containing the same active ingredient exists, there is no molecule-vs-product distinction to draw here. The disclaimer is simply and fully accurate.',
      evidenceQuality: 'high',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-pcac-2026', relationship: 'directly_supports' }],
    },
  ],
};
