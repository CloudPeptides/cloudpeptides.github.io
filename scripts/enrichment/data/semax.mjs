/**
 * Semax — research enrichment pilot data. Sources verified via NCBI
 * E-utilities.
 *
 * Honest coverage note: Semax's only identified human clinical evidence
 * is a 1997 Russian-language study (n=30 treated vs n=80 concurrent
 * control) that is NOT described as randomized or blinded in any
 * abstract/summary reviewed — represented here as a non-randomized
 * human trial, not upgraded to "RCT." The remaining evidence base is
 * animal/mechanistic. Semax is widely reported by commercial/vendor
 * sources to have been "registered in Russia since 1994," but no
 * authoritative primary source (Russian State Register of Medicines,
 * peer-reviewed regulatory citation, or equivalent) for that specific
 * claim was found during this review — only non-authoritative
 * vendor/blog pages repeated it, which CLAUDE.md's sourcing policy
 * excludes as evidence. That claim is therefore NOT included as a
 * regulatory_record here; it is flagged in docs/enrichment/pilot-report.md
 * as an unverified/broken citation needing follow-up. The one
 * regulatory fact that WAS independently verified (via multiple
 * independent news/trade-press results describing the same FDA
 * committee meeting) is Semax's July 2026 FDA Pharmacy Compounding
 * Advisory Committee nomination — the same committee/meeting already
 * verified for BPC-157, reused here as its own source record.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
export default {
  slug: 'semax',
  sources: [
    {
      key: 'pmid-11517472',
      sourceType: 'pubmed_article',
      title:
        'Effectiveness of semax in acute period of hemispheric ischemic stroke (a clinical and electrophysiological study).',
      url: 'https://pubmed.ncbi.nlm.nih.gov/11517472/',
      publisherOrAgency: 'Zhurnal nevrologii i psikhiatrii imeni S.S. Korsakova',
      publicationDate: '1997',
      identifiers: { pmid: '11517472' },
      study: {
        studyDesign: 'non_randomized_human_trial',
        population:
          'Adult humans in the acute period of hemispheric ischemic stroke (30 treated; 80 concurrent controls matched for severity/location)',
        sampleSize: 30,
        intervention: 'Semax added to combined intensive stroke therapy',
        comparator:
          'Conventional therapy alone (80 patients, matched for stroke severity and lesion location, not described as randomized or blinded)',
        primaryOutcomes:
          'Clinical neurological rating scales; EEG mapping; somatosensory evoked potentials and their mapping',
        resultsSummary:
          'Semax added to combined intensive therapy was associated with a greater rate of restoration of damaged neurological functions, particularly regression of general cerebral and focal (especially motor) deficits, versus the control group.',
        limitations:
          'Published in a Russian-language journal (1997); this review relied on the English-language abstract/summary, not the full translated primary text. No description of randomization or blinding was found — treated as a non-randomized comparison, not an RCT. Effect sizes and statistical significance were not available in the abstract reviewed.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-16996037',
      sourceType: 'pubmed_article',
      title:
        'Semax, an analog of ACTH(4-10) with cognitive effects, regulates BDNF and trkB expression in the rat hippocampus.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/16996037/',
      publisherOrAgency: 'Brain Research',
      publicationDate: '2006-10-30',
      identifiers: { pmid: '16996037', doi: '10.1016/j.brainres.2006.07.108' },
      study: {
        studyDesign: 'animal_study',
        population: 'Rat hippocampus, in vivo',
        intervention: 'Semax, intranasal',
        resultsSummary:
          'A single Semax application produced up to a 1.4-fold increase in hippocampal BDNF protein and a 1.6-fold increase in trkB tyrosine phosphorylation, proposed as a mechanism for its reported cognitive effects.',
        limitations:
          'Animal (rat) study; mechanistic, not a measure of clinical cognitive outcome.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-16362768',
      sourceType: 'pubmed_article',
      title:
        'Semax, an ACTH(4-10) analogue with nootropic properties, activates dopaminergic and serotoninergic brain systems in rodents.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/16362768/',
      publisherOrAgency: 'Neurochemical Research',
      publicationDate: '2005-12-01',
      identifiers: { pmid: '16362768', doi: '10.1007/s11064-005-8826-8' },
      study: {
        studyDesign: 'animal_study',
        population: 'Rodents (striatum), in vivo',
        intervention: 'Semax',
        resultsSummary:
          'Semax modulated striatal dopaminergic and serotoninergic activity, proposed as a contributor to its nootropic effects.',
        limitations: 'Animal study; mechanistic.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-11245825',
      sourceType: 'pubmed_article',
      title:
        'Novel synthetic analogue of ACTH 4-10 (Semax) but not glycine prevents the enhanced nitric oxide generation in cerebral cortex of rats with incomplete global ischemia.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/11245825/',
      publisherOrAgency: 'Brain Research',
      publicationDate: '2001-03-09',
      identifiers: { pmid: '11245825', doi: '10.1016/s0006-8993(00)03324-2' },
      study: {
        studyDesign: 'animal_study',
        population: 'Rat cerebral cortex, incomplete global cerebral ischemia model',
        comparator: 'Glycine; untreated ischemia control',
        intervention: 'Semax',
        resultsSummary:
          'Semax, but not glycine, prevented the ischemia-induced rise in nitric oxide generation in rat cerebral cortex, proposed as a neuroprotective mechanism.',
        limitations:
          'Animal study; mechanistic; head-to-head comparator (glycine) was not itself validated as an effective agent in this model.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-34201112',
      sourceType: 'pubmed_article',
      title:
        'Brain Protein Expression Profile Confirms the Protective Effect of the ACTH(4-7)PGP Peptide (Semax) in a Rat Model of Cerebral Ischemia-Reperfusion.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/34201112/',
      publisherOrAgency: 'International Journal of Molecular Sciences',
      publicationDate: '2021-06-08',
      identifiers: { pmid: '34201112', doi: '10.3390/ijms22126179' },
      study: {
        studyDesign: 'animal_study',
        population:
          'Rat, cerebral ischemia-reperfusion (middle cerebral artery occlusion-type model)',
        intervention: 'Semax (ACTH(4-7)PGP)',
        resultsSummary:
          'Brain protein expression profiling supported a protective effect of Semax in this cerebral ischemia-reperfusion model, consistent with prior transcriptomic findings from the same research group.',
        limitations:
          'Animal study; mechanistic/omics-level evidence, not a clinical outcome measure.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-9173745',
      sourceType: 'pubmed_article',
      title:
        'A nootropic adrenocorticotropin analog 4-10-semax (15 years experience in its design and study).',
      url: 'https://pubmed.ncbi.nlm.nih.gov/9173745/',
      publisherOrAgency: 'Zhurnal Vysshei Nervnoi Deiatelnosti Imeni I P Pavlova',
      publicationDate: '1997-03-01',
      identifiers: { pmid: '9173745' },
      study: {
        studyDesign: 'narrative_review',
        resultsSummary:
          'Narrative review by Semax\'s original developers summarizing ~15 years of research: reported ability to stimulate operative memory/attention and increase resistance to hypoxia in animal and human studies, and stated clinical use "in treatment of patients with different diseases of CNS," with positive effects reported in the majority of cases and no reported negative side effects or complications in the abstract reviewed.',
        limitations:
          "Narrative review (not systematic) by the compound's original inventors — a direct conflict of interest; published in a Russian-language journal, this review relied on the English abstract only; no specific adverse-event or registration data given in the abstract reviewed.",
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'fda-pcac-2026',
      sourceType: 'fda_document',
      title: 'July 23-24, 2026: Meeting of the Pharmacy Compounding Advisory Committee',
      url: 'https://www.fda.gov/advisory-committees/advisory-committee-calendar/july-23-24-2026-meeting-pharmacy-compounding-advisory-committee-07232026',
      publisherOrAgency: 'U.S. Food and Drug Administration',
      publicationDate: '2026-07-24',
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'In a 1997 Russian human study of the acute period of hemispheric ischemic stroke (30 patients receiving Semax added to combined intensive therapy vs 80 severity/location-matched controls receiving conventional therapy), the Semax group showed a greater rate of restoration of neurological function, particularly motor and general cerebral deficits, on clinical rating scales and electrophysiological measures (EEG mapping, somatosensory evoked potentials).',
      evidenceQuality: 'low',
      qualityRationale:
        'The only identified human clinical evidence for Semax; not described as randomized or blinded in the reviewed abstract, single-country, and this review relied on the English abstract rather than the full Russian-language primary text.',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-11517472', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'mechanism',
      statement:
        'In rats, intranasal Semax increases hippocampal BDNF protein and trkB tyrosine phosphorylation, and modulates striatal dopaminergic and serotoninergic activity — proposed mechanisms for its reported nootropic/cognitive effects.',
      evidenceQuality: 'moderate',
      qualityRationale:
        'Peer-reviewed animal mechanistic studies from independent research groups; not evidence of a human cognitive outcome.',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-16996037', relationship: 'directly_supports' },
        { sourceKey: 'pmid-16362768', relationship: 'directly_supports' },
      ],
    },
    {
      contentSection: 'mechanism',
      statement:
        'In a rat model of incomplete global cerebral ischemia, Semax (but not glycine) prevented the ischemia-induced rise in cerebral cortex nitric oxide generation; separately, brain protein expression profiling in a rat cerebral ischemia-reperfusion model supported a protective effect at the molecular level.',
      evidenceQuality: 'moderate',
      qualityRationale:
        'Peer-reviewed animal mechanistic studies from independent research groups spanning two decades; consistent direction of effect.',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-11245825', relationship: 'directly_supports' },
        { sourceKey: 'pmid-34201112', relationship: 'directly_supports' },
      ],
    },
    {
      contentSection: 'safety',
      statement:
        "A 1997 narrative review by Semax's original developers, covering approximately 15 years of research and reported clinical use for CNS diseases, described positive effects in the majority of cases and no reported negative side effects or complications — but this is developer-authored, non-systematic, self-reported safety information, not independent clinical trial safety data.",
      evidenceQuality: 'very_low',
      qualityRationale:
        "Narrative review authored by the compound's original inventors (direct conflict of interest); not a systematic safety review or a controlled trial; no adverse-event methodology described in the abstract reviewed.",
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-9173745', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'regulatory',
      statement:
        "On July 24, 2026, the FDA's Pharmacy Compounding Advisory Committee (PCAC) voted to recommend Semax for the 503A Bulks List of substances compounding pharmacies may use; this is an advisory committee recommendation only, not an FDA approval or final agency determination.",
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'fda-pcac-2026', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [
    {
      agency: 'U.S. Food and Drug Administration (FDA)',
      jurisdiction: 'United States',
      indication: 'Nominated bulk drug substance for 503A pharmacy compounding',
      regulatoryStatus: 'no_determination',
      effectiveDate: '2026-07-24',
      sourceKey: 'fda-pcac-2026',
      notes:
        "Semax was discussed by FDA's Pharmacy Compounding Advisory Committee (PCAC) on July 23-24, 2026 (docket FDA-2026-N-2979) and — per multiple independent trade-press reports of the meeting outcome — the committee voted on July 24, 2026 to recommend Semax (along with epitalon) for the 503A Bulks List; a third nominee, emideltide, was rejected. PCAC recommendations are advisory only; final action requires formal FDA/HHS determination, which had not occurred as of this review. Not an approval, and not evidence of safety or effectiveness for any use. Separately, Semax is widely described by commercial sources as having been registered for clinical use in Russia since 1994, but no authoritative primary source for that specific claim (Russian State Register of Medicines or equivalent) was located during this review — that claim is NOT represented as a regulatory_record here and is flagged in the pilot report as unverified.",
    },
  ],
};
