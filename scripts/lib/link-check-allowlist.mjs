/**
 * A small, exact-URL allowlist of external citation links that are
 * individually verified live and correct, but sit behind bot-detection
 * on doi.org/fda.gov that intermittently returns 403/404 to automated
 * crawlers regardless of which User-Agent is used (confirmed
 * non-deterministic: three separate scripts/check-links.mjs runs
 * against the identical build flagged three different subsets of
 * these exact URLs, and the same URL has been observed returning both
 * 403 and 404 across different runs) — see docs/planning/
 * production-readiness-audit.md §11 for the original JAMA DOI
 * investigation and the 2026-08-08 cutover-prep session for the two
 * FDA additions.
 *
 * Deliberately NOT a whole-domain skip (CLAUDE.md §6: citation health
 * still matters, and a domain-wide allowance would hide a genuinely
 * new dead link on either domain forever) and deliberately NOT a
 * blanket "don't fail the build" (internal links and every other
 * external link must keep blocking — see classifyBrokenLinks below).
 * Each entry was reached by hand in a browser and its content
 * confirmed to match this project's citation record before being
 * added — do not add another URL here without doing the same.
 */
export const FLAKY_CITATION_ALLOWLIST = new Set([
  // JAMA DOI resolver — bot-walled per production-readiness-audit.md
  // §11's original investigation; the citation's own primary link
  // (the PMC full-text mirror) is unaffected and not in this list.
  'https://doi.org/10.1001/jama.2014.8334',
  // FDA consumer update, cited by lemon-bottle — verified live,
  // content matches the citation record (production-readiness-audit.md
  // §11).
  'https://www.fda.gov/consumers/consumer-updates/fda-warns-against-unapproved-fat-dissolving-injections-spas-and-medspas',
  // FDA Warning Letter 715883, cited by retatrutide — verified live in
  // a browser 2026-08-08, title/content match the citation record.
  'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/glp-1-solution-715883-09092025',
  // FDA Pharmacy Compounding Advisory Committee meeting notice, cited
  // by both bpc-157 and semax (one shared source row) — verified live
  // in a browser 2026-08-08, title/content match the citation record.
  'https://www.fda.gov/advisory-committees/advisory-committee-calendar/july-23-24-2026-meeting-pharmacy-compounding-advisory-committee-07232026',
]);

/**
 * Splits linkinator's BROKEN results into the ones covered by the
 * allowlist above (warn only) and everything else (still fails the
 * build) — exact-URL matching only, never a prefix/domain match, so
 * a new dead link on an allowlisted domain still blocks.
 *
 * @param {Array<{url: string, state: string}>} links
 * @param {Set<string>} allowlist
 * @returns {{ allowlistedBroken: Array<object>, realBroken: Array<object> }}
 */
export function classifyBrokenLinks(links, allowlist = FLAKY_CITATION_ALLOWLIST) {
  const broken = links.filter((link) => link.state === 'BROKEN');
  return {
    allowlistedBroken: broken.filter((link) => allowlist.has(link.url)),
    realBroken: broken.filter((link) => !allowlist.has(link.url)),
  };
}
