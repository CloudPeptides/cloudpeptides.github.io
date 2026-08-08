/**
 * Cerebrolysin — research enrichment. Sources verified via NCBI
 * E-utilities.
 *
 * Honest coverage note: Cerebrolysin has a genuinely large human RCT
 * literature (unlike most compounds in this database) but the evidence
 * is MIXED and indication-dependent: a Cochrane review found a
 * cognitive benefit signal in vascular dementia, while multiple
 * independent meta-analyses found NO significant functional-recovery
 * benefit in acute ischemic stroke. Both the positive and negative
 * findings are represented — this is not simplified into a single
 * "works" or "doesn't work" claim.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'cerebrolysin',
  sources: [
    {
      key: 'cochrane-cd008900',
      sourceType: 'systematic_review',
      title: 'Cerebrolysin for vascular dementia.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/23440834/',
      publisherOrAgency: 'Cochrane Database of Systematic Reviews',
      publicationDate: '2013-01-31',
      identifiers: { pmid: '23440834', doi: '10.1002/14651858.CD008900.pub2' },
      study: {
        studyDesign: 'systematic_review',
        population: 'Adults with vascular dementia (6 RCTs pooled, n=597)',
        sampleSize: 597,
        intervention: 'Cerebrolysin',
        comparator: 'Placebo',
        resultsSummary: 'Meta-analysis of 6 RCTs (n=597) found a beneficial effect of Cerebrolysin on general cognitive function (MMSE) in vascular dementia.',
        limitations: 'Cochrane review notes trial-quality concerns are common in this literature; effect size and durability beyond the trial period were not independently re-extracted in this review.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-28656143',
      sourceType: 'systematic_review',
      title: 'Efficacy and Safety of Cerebrolysin for Acute Ischemic Stroke: A Meta-Analysis of Randomized Controlled Trials.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/28656143/',
      publisherOrAgency: 'BioMed Research International',
      publicationDate: '2017-06-05',
      identifiers: { pmid: '28656143', doi: '10.1155/2017/4191670' },
      study: {
        studyDesign: 'meta_analysis',
        population: 'Adults with acute ischemic stroke (7 RCTs pooled, n=1,779)',
        sampleSize: 1779,
        intervention: 'Cerebrolysin',
        comparator: 'Placebo',
        resultsSummary: 'Meta-analysis of 7 RCTs (n=1,779) failed to demonstrate significant superiority of Cerebrolysin over placebo on modified Rankin Scale or Barthel Index functional-outcome measures.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-28458521',
      sourceType: 'systematic_review',
      title: 'Cerebrolysin for functional recovery in patients with acute ischemic stroke: a meta-analysis of randomized controlled trials.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/28458521/',
      publisherOrAgency: 'Drug Design, Development and Therapy',
      publicationDate: '2017-04-19',
      identifiers: { pmid: '28458521', doi: '10.2147/DDDT.S124273' },
      study: {
        studyDesign: 'meta_analysis',
        population: 'Adults with acute ischemic stroke (6 RCTs pooled, n=1,649)',
        sampleSize: 1649,
        intervention: 'Cerebrolysin',
        comparator: 'Placebo',
        resultsSummary: 'Meta-analysis of 6 RCTs (n=1,649) found no significant effect on functional recovery at Day 90 compared with placebo.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'In vascular dementia, a Cochrane systematic review of 6 randomized controlled trials (n=597) found a beneficial effect of Cerebrolysin on general cognitive function (MMSE) versus placebo.',
      evidenceQuality: 'moderate',
      qualityRationale: 'Cochrane systematic review — high methodological rigor — but underlying trial-quality concerns are noted by the reviewers themselves, and this is a single indication (vascular dementia), not generalizable to other uses.',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'cochrane-cd008900', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'summary',
      statement:
        'In acute ischemic stroke, two independent meta-analyses of randomized controlled trials (n=1,779 and n=1,649) found NO statistically significant benefit of Cerebrolysin over placebo on functional recovery outcomes (modified Rankin Scale, Barthel Index, or Day-90 recovery).',
      evidenceQuality: 'moderate',
      qualityRationale: 'Two independent, reasonably large meta-analyses in this specific indication both reached a null result — a genuine negative finding, not merely absence of evidence.',
      interpretationStatus: 'conflicting',
      sources: [
        { sourceKey: 'pmid-28656143', relationship: 'directly_supports' },
        { sourceKey: 'pmid-28458521', relationship: 'directly_supports' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: 'f1899e23-6217-4e5b-bee3-2647707d34d4',
      legacyStatementExcerpt: 'Cerebrolysin is a peptide-based preparation widely investigated in neurological research',
      disposition: 'supported',
      rationale: 'Confirmed — Cerebrolysin has a large human RCT literature, unusually extensive among the compounds in this database.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'cochrane-cd008900', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '836122ab-fecd-482c-840b-65220d77cfb4',
      legacyStatementExcerpt: 'Laboratory and clinical research literature frequently explores Cerebrolysin in models involving brain injury, neurodegenerative processes, cognitive function, and neuronal survival pathways',
      disposition: 'revised',
      rationale:
        'Accurate that Cerebrolysin is extensively studied clinically, but this statement omits that the clinical results are indication-dependent and MIXED — positive signal in vascular dementia, but two independent meta-analyses found no benefit in acute ischemic stroke. The unqualified framing risks implying uniformly positive findings, which is not accurate.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'conflicting',
      sources: [
        { sourceKey: 'cochrane-cd008900', relationship: 'directly_supports' },
        { sourceKey: 'pmid-28656143', relationship: 'contradicts' },
        { sourceKey: 'pmid-28458521', relationship: 'contradicts' },
      ],
    },
    {
      legacyClaimId: 'f8aa8f9f-b3fe-4e3e-b899-210102070c03',
      legacyStatementExcerpt: 'Researchers investigate Cerebrolysin for its neurotrophic-like activity and its potential influence on neuronal growth',
      disposition: 'supported',
      rationale: 'Accurate mechanistic framing, correctly hedged as investigational rather than an established mechanism-to-outcome claim.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'unknown',
      sources: [],
    },
    {
      legacyClaimId: '8004fade-e573-4ef5-b02a-7faa6feb0db8',
      legacyStatementExcerpt: 'Q: What is Cerebrolysin researched for? A: Research commonly focuses on neurotrophic signaling',
      disposition: 'supported',
      rationale: 'Accurately reflects the actual research focus, though see the mixed-results note captured in the new summary claims.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'cochrane-cd008900', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: '133f25ea-8d43-4934-8e9b-2e8aad7682ca',
      legacyStatementExcerpt: 'Q: Is Cerebrolysin a single peptide? A: No. Cerebrolysin is typically described as a peptide-based mixture',
      disposition: 'supported',
      rationale: 'Accurate — Cerebrolysin is a porcine-brain-derived peptide/protein mixture, not a single defined peptide, consistent with how it is described throughout the clinical literature reviewed.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    policyReconciliation('de1a071e-b190-4681-8c87-1ef974e8752d', 'Q: Does Cloud Peptides provide dosage information? A: No.'),
    policyReconciliation('db452e61-9319-4c16-b8af-20cb39948b59', 'This page summarizes publicly available scientific literature for educational purposes only.'),
    policyReconciliation('2890fd77-d32f-4cde-8a6d-240272755a8c', 'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.'),
    policyReconciliation('e9a18b4c-b5a4-451c-bea5-07d8ade40d51', 'All products are intended strictly for laboratory research purposes only'),
  ],
};
