/**
 * GHK-Cu (copper tripeptide-1) — research enrichment pilot data. Sources
 * verified via NCBI E-utilities.
 *
 * Honest coverage note: the one human RCT identified for GHK-Cu showed
 * NO statistically significant objective improvement (erythema,
 * wrinkles, overall skin quality) versus control — only a significant
 * subjective patient-satisfaction difference. This is represented as
 * conflicting evidence, not smoothed into a positive claim. No FDA (or
 * equivalent) drug regulatory record was found — GHK-Cu is commonly
 * sold as a cosmetic ingredient, which is not premarket-approved by the
 * FDA the way a prescription drug is; no regulatory_records are added
 * here rather than force-fitting a drug-style record that doesn't
 * genuinely apply.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
export default {
  slug: 'ghk-cu',
  sources: [
    {
      key: 'pmid-16847171',
      sourceType: 'pubmed_article',
      title: 'Effects of topical copper tripeptide complex on CO2 laser-resurfaced skin.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/16847171/',
      publisherOrAgency: 'Archives of Facial Plastic Surgery',
      publicationDate: '2006-07-01',
      identifiers: { pmid: '16847171', doi: '10.1001/archfaci.8.4.252' },
      study: {
        studyDesign: 'rct_human',
        population: 'Adult patients undergoing CO2 laser skin resurfacing',
        sampleSize: 13,
        intervention: 'Topical copper tripeptide (GHK-Cu) complex, post-resurfacing skincare regimen',
        comparator: 'Standard post-resurfacing regimen without copper tripeptide',
        route: 'Topical',
        primaryOutcomes: 'Erythema resolution, wrinkle improvement, overall skin quality (objective, computer-analyzed and blinded-evaluator-assessed) and patient-reported satisfaction',
        resultsSummary:
          'No statistically significant between-group differences were found for objective measures (erythema resolution, wrinkle reduction, overall skin quality). Patient-reported satisfaction with overall skin quality was significantly higher in the GHK-Cu group (P=.04).',
        limitations: 'Very small sample (n=13 completers); objective outcomes were null; only the subjective/patient-reported outcome reached significance.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-11045606',
      sourceType: 'pubmed_article',
      title:
        'The tripeptide-copper complex glycyl-L-histidyl-L-lysine-Cu2+ stimulates matrix metalloproteinase-2 expression by fibroblast cultures.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/11045606/',
      publisherOrAgency: 'Life Sciences',
      publicationDate: '2000-09-22',
      identifiers: { pmid: '11045606', doi: '10.1016/s0024-3205(00)00803-1' },
      study: {
        studyDesign: 'in_vitro_study',
        population: 'Cultured human fibroblasts',
        intervention: 'GHK-Cu complex applied to fibroblast cultures',
        resultsSummary:
          'GHK-Cu increased matrix metalloproteinase-2 (MMP-2) protein and mRNA levels; this effect was reproduced by copper ions alone but not by the GHK peptide alone, and GHK-Cu also increased secretion of TIMP-1 and TIMP-2 (tissue inhibitors of metalloproteinases).',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-15655171',
      sourceType: 'pubmed_article',
      title: 'Effects of copper tripeptide on the growth and expression of growth factors by normal and irradiated fibroblasts.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/15655171/',
      publisherOrAgency: 'Archives of Facial Plastic Surgery',
      publicationDate: '2005-01-01',
      identifiers: { pmid: '15655171', doi: '10.1001/archfaci.7.1.27' },
      study: {
        studyDesign: 'in_vitro_study',
        population: 'Cultured normal and irradiated human fibroblasts',
        intervention: 'Copper tripeptide (GHK-Cu) applied to fibroblast cultures',
        resultsSummary:
          'Copper tripeptide accelerated growth of normal and irradiated fibroblasts and increased early production of basic fibroblast growth factor and vascular endothelial growth factor in irradiated fibroblasts.',
        limitations: 'In-vitro only; irradiated-fibroblast findings are not evidence of an effect in irradiated human tissue.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-18644225',
      sourceType: 'pubmed_article',
      title: 'The human tri-peptide GHK and tissue remodeling.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/18644225/',
      publisherOrAgency: 'Journal of Biomaterials Science, Polymer Edition',
      publicationDate: '2008-01-01',
      identifiers: { pmid: '18644225', doi: '10.1163/156856208784909435' },
      study: {
        studyDesign: 'narrative_review',
        resultsSummary:
          'Narrative review (single-author) summarizing preclinical/mechanistic literature on GHK and tissue remodeling — does not itself present new primary data.',
        limitations: 'Single-author narrative review, not a systematic review; author (Pickart) has a long publication history specifically on GHK and holds related patents, a potential conflict of interest not disclosed in the abstract reviewed.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'nct07437586',
      sourceType: 'clinicaltrials_gov',
      title: 'Topical GHK-Cu Gel for Acute Skin Wound Healing',
      url: 'https://clinicaltrials.gov/study/NCT07437586',
      identifiers: { nctNumber: 'NCT07437586' },
      study: {
        studyDesign: 'rct_human',
        population: 'Human adults with acute skin wounds',
        intervention: 'Topical GHK-Cu gel',
        resultsSummary: 'Status: active/recruiting as of retrieval date (this pilot did not re-verify current status via the ClinicalTrials.gov API). No results posted.',
        limitations: 'Trial in progress — no results available.',
        registrationNumber: 'NCT07437586',
        peerReviewStatus: 'unknown',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'In a small randomized controlled trial (n=13) of patients recovering from CO2 laser skin resurfacing, topical GHK-Cu produced no statistically significant objective improvement in erythema resolution, wrinkle reduction, or evaluator-assessed skin quality compared to standard post-procedure care — but patient-reported satisfaction with skin quality was significantly higher.',
      evidenceQuality: 'low',
      qualityRationale: 'Very small randomized trial; the only statistically significant result was a subjective patient-reported outcome, not an objective clinical measure.',
      interpretationStatus: 'conflicting',
      sources: [{ sourceKey: 'pmid-16847171', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'mechanism',
      statement:
        'In cultured human fibroblasts, GHK-Cu increases matrix metalloproteinase-2 (MMP-2) expression and secretion of its tissue inhibitors (TIMP-1, TIMP-2) — an effect driven by the copper component specifically, not the GHK peptide alone.',
      evidenceQuality: 'moderate',
      qualityRationale: 'Peer-reviewed in-vitro mechanistic study with an informative negative control (GHK alone, no effect).',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-11045606', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'mechanism',
      statement:
        'In cultured normal and irradiated human fibroblasts, copper tripeptide (GHK-Cu) accelerated fibroblast growth and increased early production of basic fibroblast growth factor and vascular endothelial growth factor.',
      evidenceQuality: 'low',
      qualityRationale: 'In-vitro only; irradiated-fibroblast findings do not establish an effect in irradiated human tissue in vivo.',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-15655171', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'summary',
      statement:
        'A registered human trial of topical GHK-Cu gel for acute skin wound healing (NCT07437586) exists; no results have been reported.',
      interpretationStatus: 'unknown',
      sources: [{ sourceKey: 'nct07437586', relationship: 'provides_context' }],
    },
  ],
  regulatoryRecords: [],
};
