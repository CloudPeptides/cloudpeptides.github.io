/**
 * 5-Amino-1MQ — research enrichment. Sources verified via NCBI E-utilities.
 *
 * Honest coverage note: 5-Amino-1MQ (5-amino-1-methylquinolinium) is an
 * NNMT (nicotinamide N-methyltransferase) inhibitor studied exclusively
 * in mice as of this review — no human trial was identified. All new
 * evidence here is animal-only; no human efficacy claim is made anywhere
 * in this file.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: '5-amino-1mq',
  sources: [
    {
      key: 'pmid-29155147',
      sourceType: 'pubmed_article',
      title:
        'Selective and membrane-permeable small molecule inhibitors of nicotinamide N-methyltransferase reverse high fat diet-induced obesity in mice.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/29155147/',
      publisherOrAgency: 'Biochemical Pharmacology',
      publicationDate: '2018-01',
      identifiers: { pmid: '29155147', doi: '10.1016/j.bcp.2017.11.007' },
      study: {
        studyDesign: 'animal_study',
        population: 'Diet-induced obese (DIO) mice',
        intervention: '5-Amino-1MQ (and related small-molecule NNMT inhibitors), systemic dosing',
        comparator: 'Vehicle-treated DIO mice; lean controls',
        resultsSummary:
          'NNMT inhibition with 5-Amino-1MQ reduced body weight and adiposity in diet-induced obese mice, in some measures normalizing values toward lean-control levels, without requiring a change in food intake.',
        limitations:
          'Mouse study only; no human data. Industry-affiliated authors (compound developer).',
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-35013352',
      sourceType: 'pubmed_article',
      title:
        'Reduced calorie diet combined with NNMT inhibition establishes a distinct microbiome in DIO mice.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/35013352/',
      publisherOrAgency: 'Scientific Reports',
      publicationDate: '2022-01-10',
      identifiers: { pmid: '35013352', doi: '10.1038/s41598-021-03670-5' },
      study: {
        studyDesign: 'animal_study',
        population: 'Diet-induced obese (DIO) mice',
        intervention: '5-Amino-1MQ (NNMT inhibitor) combined with a reduced-calorie diet',
        comparator: 'High-fat-diet-maintained mice; lean controls',
        resultsSummary:
          'Combined NNMT inhibition and reduced-calorie diet shifted the gut microbiome of DIO mice toward a lean-control-like composition, distinct from high-fat-diet-maintained mice.',
        limitations:
          'Mouse study only; microbiome association, not a measure of a specific human health outcome.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        '5-Amino-1MQ is a selective, membrane-permeable small-molecule inhibitor of nicotinamide N-methyltransferase (NNMT), an enzyme involved in nicotinamide/cellular energy metabolism.',
      evidenceQuality: 'moderate',
      qualityRationale:
        "Peer-reviewed mechanistic characterization, though from the compound-developer's own research group.",
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-29155147', relationship: 'directly_supports' }],
    },
    {
      contentSection: 'safety',
      statement:
        'As of this review, no published human clinical trial of 5-Amino-1MQ was identified — all available efficacy and mechanistic evidence is from mouse studies.',
      interpretationStatus: 'insufficient',
      sources: [
        { sourceKey: 'pmid-29155147', relationship: 'provides_context' },
        { sourceKey: 'pmid-35013352', relationship: 'provides_context' },
      ],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '65f68575-77cf-4120-b4f8-a113e85a50e2',
      legacyStatementExcerpt:
        '5-Amino-1MQ is a research compound studied primarily for its ability to inhibit nicotinamide N-methyltransferase',
      disposition: 'supported',
      rationale:
        'Confirmed by peer-reviewed literature: 5-Amino-1MQ is indeed an NNMT inhibitor. The statement itself makes no efficacy claim beyond identifying the research target, so it is fully supported as written.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-29155147', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: '945e77ac-fe53-4ee1-a337-9d5008d52687',
      legacyStatementExcerpt:
        'Researchers investigate how modulation of NNMT activity may influence adipose tissue biology',
      disposition: 'supported',
      rationale:
        'Consistent with verified mouse-model findings on adiposity and body-composition changes with NNMT inhibition. Correctly hedged as laboratory-model research, not a human efficacy claim.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [
        { sourceKey: 'pmid-29155147', relationship: 'directly_supports' },
        { sourceKey: 'pmid-35013352', relationship: 'indirectly_supports' },
      ],
    },
    {
      legacyClaimId: '5492466a-5400-4c30-9a39-70dc004ef8f0',
      legacyStatementExcerpt:
        'Current research focuses on inhibition of NNMT, an enzyme associated with nicotinamide metabolism',
      disposition: 'supported',
      rationale: 'Matches the verified mechanism of action described in the peer-reviewed source.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-29155147', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'bb6fbb6e-821b-4962-95ea-2c21feeb3141',
      legacyStatementExcerpt:
        'Q: Is 5-Amino-1MQ a peptide? A: No. It is a small-molecule research compound',
      disposition: 'supported',
      rationale:
        'Chemical classification fact (5-amino-1-methylquinolinium is a small heterocyclic molecule, not an amino-acid chain/peptide), verifiable by structure rather than requiring a literature citation.',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [],
    },
    {
      legacyClaimId: 'a5d25432-7f3f-455f-b695-483fdcc00416',
      legacyStatementExcerpt:
        'Q: What is its primary research target? A: Most published research focuses on inhibition of the NNMT enzyme',
      disposition: 'supported',
      rationale: 'Confirmed — every source identified in this review targets NNMT inhibition.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-29155147', relationship: 'directly_supports' }],
    },
    policyReconciliation(
      'e93281ba-9dbe-4c26-9aa7-664f31fbe669',
      'Q: Does Cloud Peptides provide dosage recommendations? A: No.',
    ),
    policyReconciliation(
      '69f24b96-687b-4f16-81c4-77ee6c6fe742',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      'feaa03dd-2a69-419a-ab61-732df21b9e70',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    policyReconciliation(
      '24290fd7-5c75-44de-9374-4e6615ed4c8d',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
