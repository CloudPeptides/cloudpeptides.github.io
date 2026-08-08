/**
 * KPV — research enrichment. Sources verified via NCBI E-utilities.
 *
 * @type {import('../schema.mjs').CompoundEnrichment}
 */
import { policyReconciliation } from '../legacy-boilerplate.mjs';

export default {
  slug: 'kpv',
  sources: [
    {
      key: 'pmid-12750433',
      sourceType: 'pubmed_article',
      title:
        'Dissection of the anti-inflammatory effect of the core and C-terminal (KPV) alpha-melanocyte-stimulating hormone peptides.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/12750433/',
      publisherOrAgency: 'The Journal of Pharmacology and Experimental Therapeutics',
      publicationDate: '2003-08',
      identifiers: { pmid: '12750433', doi: '10.1124/jpet.103.051623' },
      study: {
        studyDesign: 'animal_study',
        intervention: 'KPV (C-terminal alpha-MSH tripeptide, Lys-Pro-Val)',
        resultsSummary:
          "Demonstrated that most of alpha-MSH's anti-inflammatory activity is attributable specifically to its C-terminal tripeptide KPV; KPV likely does not act through classical melanocortin receptors.",
        peerReviewStatus: 'peer_reviewed',
      },
    },
    {
      key: 'pmid-18061177',
      sourceType: 'pubmed_article',
      title: 'PepT1-mediated tripeptide KPV uptake reduces intestinal inflammation.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/18061177/',
      publisherOrAgency: 'Gastroenterology',
      publicationDate: '2008-01',
      identifiers: { pmid: '18061177', doi: '10.1053/j.gastro.2007.10.026' },
      study: {
        studyDesign: 'animal_study',
        population: 'Mouse models of DSS- and TNBS-induced colitis',
        intervention: 'Oral KPV',
        resultsSummary:
          'Oral KPV, taken up via the intestinal peptide transporter PepT1, reduced the incidence and severity of chemically-induced colitis in mice, with reduced pro-inflammatory cytokine expression. Nanomolar KPV concentrations inhibited NF-kappaB and MAP kinase inflammatory signaling in vitro.',
        limitations: 'Animal (mouse) model only; no human trial identified in this review.',
        peerReviewStatus: 'peer_reviewed',
      },
    },
  ],
  claims: [
    {
      contentSection: 'mechanism',
      statement:
        "KPV (Lys-Pro-Val), the C-terminal tripeptide of alpha-melanocyte-stimulating hormone (alpha-MSH), carries most of alpha-MSH's anti-inflammatory activity independent of classical melanocortin receptor binding — likely acting via inhibition of IL-1beta-related signaling and, when taken orally, via uptake through the intestinal peptide transporter PepT1.",
      evidenceQuality: 'moderate',
      qualityRationale:
        'Peer-reviewed mechanistic and animal-model studies from independent research groups with a consistent direction of effect.',
      interpretationStatus: 'supported',
      sources: [
        { sourceKey: 'pmid-12750433', relationship: 'directly_supports' },
        { sourceKey: 'pmid-18061177', relationship: 'directly_supports' },
      ],
    },
    {
      contentSection: 'summary',
      statement:
        "In mouse models of chemically-induced colitis, oral KPV reduced disease incidence and severity, with reduced pro-inflammatory cytokine expression — the primary evidence base for KPV's anti-inflammatory/gastrointestinal research use.",
      evidenceQuality: 'moderate',
      qualityRationale:
        'Peer-reviewed animal study in a top gastroenterology journal, but animal-only — no human trial identified.',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-18061177', relationship: 'directly_supports' }],
    },
  ],
  regulatoryRecords: [],
  legacyReconciliations: [
    {
      legacyClaimId: '6d551a28-103e-47d5-a5c7-f60782491dd5',
      legacyStatementExcerpt:
        'KPV is a short peptide sequence derived from alpha-melanocyte-stimulating hormone research',
      disposition: 'supported',
      rationale: 'Directly confirmed.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [{ sourceKey: 'pmid-12750433', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'b10a6001-918c-4a16-af2b-f1a1b847b2c9',
      legacyStatementExcerpt:
        'Researchers continue to study KPV in relation to skin barrier function, gastrointestinal tissue, recovery biology, and cellular inflammatory pathways',
      disposition: 'revised',
      rationale:
        'Gastrointestinal/colitis and inflammatory-pathway evidence is directly confirmed (animal only). No skin-barrier-specific or "recovery biology" study of KPV specifically was located in this review — those sub-claims are not independently verified here.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-18061177', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'a7ed3eb2-9d60-4541-8adc-7aceeb7044d4',
      legacyStatementExcerpt:
        'KPV is studied for interactions with inflammatory and immune-related pathways',
      disposition: 'supported',
      rationale: 'Directly confirmed by both verified sources.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'supported',
      sources: [
        { sourceKey: 'pmid-12750433', relationship: 'directly_supports' },
        { sourceKey: 'pmid-18061177', relationship: 'directly_supports' },
      ],
    },
    {
      legacyClaimId: 'f5593c46-3c5a-40eb-9152-e8a252b54efa',
      legacyStatementExcerpt:
        'Q: What is KPV commonly researched for? A: KPV is commonly researched for inflammation-related pathways, immune signaling, epithelial tissue biology, skin barrier research, and gastrointestinal models',
      disposition: 'revised',
      rationale:
        'Inflammation, immune signaling, and gastrointestinal models are directly confirmed. "Skin barrier research" specifically was not located as a KPV-specific source in this review.',
      evidenceQuality: 'moderate',
      interpretationStatus: 'preliminary',
      sources: [{ sourceKey: 'pmid-18061177', relationship: 'directly_supports' }],
    },
    {
      legacyClaimId: 'ec1348fc-fb86-42dd-833a-d998395a4deb',
      legacyStatementExcerpt:
        'Q: Is KPV a large peptide? A: No. KPV is a short tripeptide sequence',
      disposition: 'supported',
      rationale: 'Accurate — confirmed by both sources (Lys-Pro-Val, a tripeptide).',
      evidenceQuality: 'not_assessed',
      interpretationStatus: 'established',
      sources: [{ sourceKey: 'pmid-12750433', relationship: 'directly_supports' }],
    },
    policyReconciliation(
      'a917ed0a-b30c-4203-9d67-278bccd196bb',
      'Q: Does Cloud Peptides provide dosage information? A: No.',
    ),
    policyReconciliation(
      'a6391fe7-20c1-4577-b052-a641cc12c688',
      'This page summarizes publicly available scientific literature for educational purposes only.',
    ),
    policyReconciliation(
      'b886ce65-ac49-4aca-9098-bf439c255527',
      'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
    ),
    policyReconciliation(
      '1024cebc-8fc4-4b2f-a5af-6f1749cf961d',
      'All products are intended strictly for laboratory research purposes only',
    ),
  ],
};
