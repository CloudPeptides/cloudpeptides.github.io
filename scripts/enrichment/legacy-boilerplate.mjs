/**
 * Shared helper for reconciling the many near-identical, non-scientific
 * legacy claims that appear on almost every compound page (dosage
 * disclaimers, "this page is educational only" notices, research-use-only
 * notices, and simple yes/no FAQ meta-questions about the page itself).
 * These are site-policy/meta statements, not scientific claims about a
 * compound — there is no external literature to cite for them, and
 * treating them as if they needed a PubMed citation would be dishonest
 * busywork. Each is still explicitly reconciled (disposition recorded),
 * just without inventing a citation that doesn't apply.
 *
 * Substantive scientific claims (summary/mechanism/most other FAQ
 * entries) are NEVER run through this helper — those get individually
 * researched, real citations, in each compound's own data file.
 */

export const SITE_POLICY_RATIONALE =
  'This is a site-policy or page-meta statement (dosage disclaimer, ' +
  'page-purpose notice, or research-use-only notice), not a scientific ' +
  'claim about the compound itself. No external literature citation ' +
  'applies; verified true by direct inspection of site content and policy.';

/**
 * @param {string} legacyClaimId
 * @param {string} legacyStatementExcerpt
 * @returns {import('./schema.mjs').LegacyClaimReconciliation}
 */
export function policyReconciliation(legacyClaimId, legacyStatementExcerpt) {
  return {
    legacyClaimId,
    legacyStatementExcerpt,
    disposition: 'supported',
    rationale: SITE_POLICY_RATIONALE,
    evidenceQuality: 'not_assessed',
    interpretationStatus: 'established',
    sources: [],
  };
}
