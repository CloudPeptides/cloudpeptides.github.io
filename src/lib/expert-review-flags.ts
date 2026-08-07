/**
 * Compounds flagged for expert/editorial review before their content
 * should be taken at face value — carried over verbatim from
 * docs/enrichment/full-coverage-report.md §6 ("Compounds requiring
 * expert/editorial review before any publication"). This is a
 * presentation-layer flag (like reconciliation.ts's disposition
 * parsing), not a new schema column: the underlying reason for each flag
 * is already fully documented in that compound's own data
 * (scripts/enrichment/data/*.mjs) and this report — this module only
 * surfaces it prominently on the public pages rather than leaving it
 * buried in an internal document a site visitor would never see.
 *
 * Deliberately a fixed, hand-maintained list (not derived from a query)
 * — the reasons are qualitative editorial judgments made during the
 * enrichment audit, not a mechanically-computable property of the data.
 */
export interface ExpertReviewFlag {
  slug: string;
  reason: string;
}

export const EXPERT_REVIEW_FLAGS: ExpertReviewFlag[] = [
  {
    slug: 'lemon-bottle',
    reason:
      'Not a peptide. Named in an FDA Warning Letter (March 2025) as an unapproved new drug; independent Swissmedic laboratory testing found tested product samples did not match their declared ingredients. This is a product-safety/integrity concern, not only an evidence gap.',
  },
  {
    slug: 'adamax',
    reason:
      'No independently verifiable peer-reviewed literature was located for this compound under this name during research review — only commercial vendor pages describe it. The claimed structural relationship to Semax is unverified.',
  },
  {
    slug: 'pe-22-29',
    reason:
      'No independently verifiable literature was located under this name. Every search surfaced only the separately-documented PE-22-28 or vendor pages — this may be a naming variant or vendor error rather than a distinct, real compound.',
  },
  {
    slug: 'cartalax',
    reason:
      'No PubMed-indexed primary source was located for this compound during research review, despite it plausibly belonging to a real family of short-chain peptide bioregulators (the Khavinson-institute research program).',
  },
  {
    slug: 'pinealon',
    reason:
      "The available literature is small and predominantly self-authored by the compound's own developers (Khavinson research group), with minimal independent outside replication identified.",
  },
  {
    slug: 'thymalin-thymulin',
    reason:
      "This page covers two peptides with materially different evidence strength. Thymulin has a broad, independently replicated literature; Thymalin's available literature is small and predominantly self-authored by its developers, the same limitation as Pinealon.",
  },
];

const FLAG_MAP = new Map(EXPERT_REVIEW_FLAGS.map((f) => [f.slug, f]));

export function getExpertReviewFlag(slug: string): ExpertReviewFlag | undefined {
  return FLAG_MAP.get(slug);
}
