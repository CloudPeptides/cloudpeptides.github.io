/**
 * Growth Hormone Fat Loss Stack (Tesamorelin + CJC-1295 No DAC) —
 * research enrichment.
 *
 * Honest coverage note: no published study of Tesamorelin
 * co-administered with CJC-1295 No DAC (the combination itself) was
 * identified. Tesamorelin itself is an FDA-approved drug (Egrifta) with
 * strong human RCT evidence (full independent research reserved for its
 * own compound page, tesamorelin.mjs, in a later batch) — CJC-1295 No
 * DAC's own evidence gap is already documented in cjc-1295-no-dac.mjs.
 * Pairing an approved drug with an unverified research-chemical product
 * is a materially different — and more consequential — situation than
 * this pipeline's other "no combination study" stacks, and is flagged
 * as such.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'growth-hormone-fat-loss-stack',
  sources: [
    {
      key: 'pmid-25038357-stack',
      sourceType: 'pubmed_article',
      title: 'Effect of tesamorelin on visceral fat and liver fat in HIV-infected patients with abdominal fat accumulation: a randomized clinical trial.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/25038357/',
      publisherOrAgency: 'JAMA',
      publicationDate: '2014-07-23',
      identifiers: { pmid: '25038357', doi: '10.1001/jama.2014.8334' },
      study: {
        studyDesign: 'rct_human',
        population: 'HIV-infected patients with abdominal fat accumulation',
        intervention: 'Tesamorelin (FDA-approved GHRH analog, brand name Egrifta), monotherapy',
        comparator: 'Placebo',
        resultsSummary: 'Tesamorelin significantly reduced visceral adipose tissue and liver fat versus placebo. See tesamorelin.mjs (forthcoming) for the fuller Tesamorelin evidence base and FDA approval record.',
        limitations: 'Studies Tesamorelin as monotherapy — no arm tested co-administration with CJC-1295 No DAC or any other GHRH analog.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'summary',
      statement:
        'No published study of Tesamorelin co-administered with CJC-1295 No DAC (the "Growth Hormone Fat Loss Stack" combination itself) was identified during this review. Tesamorelin monotherapy is FDA-approved and has strong randomized controlled human trial evidence for reducing visceral fat in a specific population (HIV-associated lipodystrophy) — but that evidence does not extend to co-administration with a second, structurally similar GHRH-pathway compound whose own evidence base (as a specific commercial "No DAC" product) is itself unverified in this review (see cjc-1295-no-dac.mjs). Combining two GHRH-receptor-pathway agonists has not been evaluated for either added benefit or added risk in the sources reviewed here.',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-25038357-stack', relationship: 'provides_context' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '6a8620ec-0343-41ee-81fe-0033a15ad476',
      legacyStatementExcerpt: 'The Growth Hormone Fat Loss Stack combines Tesamorelin and CJC-1295 no DAC, two compounds commonly investigated for their influence on growth hormone physiology',
      disposition: 'revised',
      rationale:
        'Tesamorelin itself is strongly evidenced (FDA-approved, multiple RCTs). CJC-1295 No DAC is NOT strongly evidenced as a specific commercial product (see cjc-1295-no-dac.mjs). And no source evaluates them "commonly investigated" TOGETHER — no combination study exists. This claim conflates two very differently-evidenced compounds under one description.',
      evidenceQuality: 'low',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-25038357-stack', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: 'f7a03393-f9a6-4ba9-b84b-fcd1df449860',
      legacyStatementExcerpt: 'Researchers study this pairing to better understand growth hormone signaling, IGF-1 biology, visceral adipose tissue research',
      disposition: 'unsupported',
      rationale: 'No study of "this pairing" was located; visceral-adipose-tissue evidence exists for Tesamorelin alone, not the pairing.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [{ sourceKey: 'pmid-25038357-stack', relationship: 'provides_context' }],
    },
    {
      legacyClaimId: '36892041-8f2e-49ba-a101-71c1e57ae5d0',
      legacyStatementExcerpt: 'Scientific understanding continues to evolve, and findings should always be interpreted within the context of each individual study',
      disposition: 'supported',
      rationale: 'Generic, appropriately cautious statement.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: 'f9903eb0-7370-4e4a-80e7-2dbba5dcf2f8',
      legacyStatementExcerpt: 'Researchers investigate this combination because Tesamorelin and CJC-1295 no DAC are both associated with growth hormone-related signaling',
      disposition: 'unsupported',
      rationale: 'No source investigating "this combination" was located — each compound has been investigated independently, and with very different levels of evidentiary support (see above).',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    {
      legacyClaimId: '8cf9aab6-42ef-4821-b123-fd062fc14f7f',
      legacyStatementExcerpt: 'Q: Why are these compounds researched together? A: Researchers study them together because both compounds are associated with growth hormone pathways',
      disposition: 'revised',
      rationale: 'A plausible product-design rationale, not evidence the pairing itself has been researched — and notably pairs an FDA-approved drug with an unverified research-chemical product without any studied combination data.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'insufficient',
      sources: [],
    },
    policyReconciliation('3b706de9-b875-4945-b2f3-00b4c64b628a', 'Q: Does Cloud Peptides recommend this stack? A: No.'),
    policyReconciliation('1633f034-f860-4ee3-a3df-c5f2a45e1ef8', 'Q: Does this page provide dosage information? A: No.'),
    policyReconciliation('9b556e0a-fb84-4bbf-a733-ea3c8185aaf7', 'Q: Are these products intended for human consumption? A: No.'),
    policyReconciliation('e665ebe8-287a-462b-a1b3-bc4b930a41cc', 'This page summarizes published scientific literature for educational purposes only.'),
    policyReconciliation('562c5dc2-5d1f-473a-8131-0caede94dfa2', 'Cloud Peptides does not provide medical advice, dosage recommendations, treatment advice'),
    policyReconciliation('b6c52ba1-f08e-40c8-a6a6-602d97cb73ea', 'All products offered by Cloud Peptides are intended strictly for laboratory research purposes only'),
  ],
};
