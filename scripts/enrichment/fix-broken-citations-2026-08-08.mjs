#!/usr/bin/env node
/**
 * One-time correction (2026-08-08) — pre-launch broken-citation pass.
 *
 * `npm run check:links` flagged 3 broken-link instances across 2
 * distinct URLs. Both were investigated directly (redirect chains
 * followed with a real browser User-Agent, cross-corroborated against
 * independent news coverage via web search) before touching anything —
 * neither was actually dead content:
 *
 * 1. https://doi.org/10.1001/jama.2014.8334 (cited by tesamorelin AND
 *    growth-hormone-fat-loss-stack, sharing one `sources` row per the
 *    schema's global source_identifiers uniqueness constraint) — the
 *    DOI itself resolves correctly (302) to a real JAMA Network article
 *    page; JAMA Network's own bot-detection returns 403 to automated
 *    checkers regardless of User-Agent. The DOI is genuinely correct
 *    and not the fix target. FIX: the source's primary `url` already
 *    pointed at PubMed's abstract page (verified working, 200) — this
 *    script upgrades it to the PMC open-access full-text mirror of the
 *    exact same peer-reviewed article (PMCID PMC4363137, confirmed via
 *    web search: same authors/trial/journal/PMID), which is fully
 *    open-access and was independently reachable. This is a genuine
 *    same-article upgrade, not a substitution of a different source.
 *
 * 2. https://www.fda.gov/consumers/consumer-updates/fda-warns-against-
 *    unapproved-fat-dissolving-injections-spas-and-medspas (lemon-
 *    bottle's sole citation for its FDA-warning claim) — confirmed via
 *    curl that fda.gov redirects automated requests to its own
 *    `/apology_objects/abuse-detection-apology.html` page (FDA's own
 *    documented bot-wall, already noted as a systemic issue elsewhere
 *    in this project's enrichment reports), not a real 404-not-found.
 *    Independently corroborated via web search: multiple named 2025
 *    news outlets (NBC News, CBS News, Fox29, AOL, PhysiciansWeekly)
 *    report this exact FDA warning, specifically naming Lemon Bottle,
 *    dated March 2025 — matching this citation's own recorded facts
 *    exactly. No confidently-verified alternative URL was found (every
 *    candidate alternate FDA page found via search could not be
 *    directly confirmed to be the identical announcement, and
 *    CLAUDE.md forbids substituting an unrelated source on uncertain
 *    grounds). NOT changed — left as the correct, real, bot-walled
 *    citation it already was. Documented here and in
 *    docs/planning/production-readiness-audit.md rather than forced.
 *
 * Run manually, locally, never in CI:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/enrichment/fix-broken-citations-2026-08-08.mjs
 *
 * Idempotent: re-running after a successful update is a no-op (the
 * url-match WHERE clause won't find the old URL anymore).
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OLD_URL = 'https://pubmed.ncbi.nlm.nih.gov/25038357/';
const NEW_URL = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4363137/';

async function main() {
  const { data: existing, error: findErr } = await supabase
    .from('sources')
    .select('id, title, url')
    .eq('url', OLD_URL);
  if (findErr) throw findErr;

  if (!existing || existing.length === 0) {
    console.log(`No source row found with url = ${OLD_URL} — already updated, or never existed.`);
    return;
  }

  for (const row of existing) {
    const { error: updateErr } = await supabase
      .from('sources')
      .update({ url: NEW_URL })
      .eq('id', row.id);
    if (updateErr) throw updateErr;
    console.log(`Updated source ${row.id} ("${row.title}"): ${OLD_URL} -> ${NEW_URL}`);
  }

  console.log(
    "\nLemon Bottle FDA citation intentionally left unchanged — confirmed bot-walled, not dead; see this script's own header comment and docs/planning/production-readiness-audit.md for the full reasoning.",
  );
}

main().catch((err) => {
  console.error('Citation fix crashed:', err.message);
  process.exit(1);
});
