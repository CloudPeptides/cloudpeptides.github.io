/**
 * A small, exact-URL allowlist of external citation links that are
 * individually verified live and correct, but sit behind bot-detection
 * on doi.org/fda.gov that intermittently returns 403/404 to automated
 * crawlers regardless of which User-Agent is used (confirmed
 * non-deterministic: separate scripts/check-links.mjs runs against the
 * identical build have each flagged a different subset of these exact
 * URLs, and the same URL has been observed returning both 403 and 404
 * across different runs) — see docs/planning/production-readiness-
 * audit.md §11 for the original JAMA DOI investigation and the
 * 2026-08-08 cutover-prep session for every entry added since.
 * scripts/enrichment/fix-broken-citations-2026-08-08-b.mjs's own
 * header documents the one entry from that same pass that turned out
 * to be genuinely dead (not bot-walled) and was repaired instead of
 * allowlisted — the BOTOX/onabotulinumtoxinA labeling citation.
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
  // Four DOI resolver links, independently verified 2026-08-08 as
  // valid DOIs matching their PubMed records — same doi.org bot-wall
  // pattern as the JAMA entry above, not a content problem. Each
  // citation's own primary link is its PubMed page, not doi.org; the
  // DOI only appears as a secondary identifier chip.
  'https://doi.org/10.3390/molecules26010159', // pinealon
  'https://doi.org/10.3390/ijms22126179', // semax
  'https://doi.org/10.3390/ijms26062691', // epithalon-compound
  'https://doi.org/10.3390/molecules191119066', // bpc-157
  // WADA statement on AOD-9604, cited by aod-9604 — verified live via
  // real browser rendering 2026-08-08 (curl alone gets an empty 202
  // challenge response with no wait; Playwright with a longer settle
  // time gets the real page, title/content confirmed matching). Same
  // bot-wall pattern as the entries above, not a content problem.
  'https://www.wada-ama.org/en/news/wada-statement-substance-aod-9604',
  // Federal Register determination notice for GEREF (sermorelin
  // acetate), cited by sermorelin — verified live 2026-08-08;
  // federalregister.gov returns an explicit anti-scraping notice
  // ("Due to aggressive automated scraping... programmatic access is
  // limited") to automated crawlers, confirmed distinct from a dead
  // link.
  'https://www.federalregister.gov/documents/2013/03/04/2013-04827/determination-that-geref-sermorelin-acetate-injection-05-milligrams-basevial-and-10-milligrams',
  // Janoshik's own COA-verification page, linked as batch_coas.
  // verification_url on all 26 imported COAs (/coas) — this is the
  // exact URL every one of those reports itself prints as its
  // official verification instruction ("Verify this test at
  // www.janoshik.com/verify/ with the following unique key"), not a
  // guessed or malformed link. Confirmed 2026-08-10 via a direct curl
  // with a real browser User-Agent: Cloudflare returns 403 with a
  // "Just a moment..." challenge page and a __cf_bm cookie — the same
  // bot-management signature as the WADA/Federal Register entries
  // above, not a dead link or wrong URL.
  'https://www.janoshik.com/verify/',
]);

/**
 * Splits linkinator's BROKEN results into the ones covered by the
 * allowlist above (warn only) and everything else (still fails the
 * build) — exact-URL matching only, never a prefix/domain match, so
 * a new dead link on an allowlisted domain still blocks.
 *
 * @typedef {{ url: string, state: string, status?: number, parent?: string }} LinkResult
 * @param {Array<LinkResult>} links
 * @param {Set<string>} allowlist
 * @returns {{ allowlistedBroken: Array<LinkResult>, realBroken: Array<LinkResult> }}
 */
export function classifyBrokenLinks(links, allowlist = FLAKY_CITATION_ALLOWLIST) {
  const broken = links.filter((link) => link.state === 'BROKEN');
  return {
    allowlistedBroken: broken.filter((link) => allowlist.has(link.url)),
    realBroken: broken.filter((link) => !allowlist.has(link.url)),
  };
}
