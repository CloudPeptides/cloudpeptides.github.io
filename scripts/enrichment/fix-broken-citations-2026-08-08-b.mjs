#!/usr/bin/env node
/**
 * Second correction pass (2026-08-08), continuing from
 * fix-broken-citations-2026-08-08.mjs — five more broken-link
 * instances surfaced once scripts/check-links.mjs's new narrow
 * allowlist made the previously-known flaky URLs stop masking
 * everything else. Each was independently verified before this script
 * was written (browser/PubMed/FDA lookups, not automated re-checks):
 *
 * 1-4. Four DOI resolver links (doi.org/10.3390/molecules26010159,
 *    ijms22126179, ijms26062691, molecules191119066 — cited by
 *    pinealon, semax, epithalon-compound, and bpc-157 respectively)
 *    are genuinely correct DOIs matching their PubMed records; doi.org
 *    bot-walls automated crawlers on these paths exactly like the
 *    already-documented JAMA case. Not touched here — added to
 *    scripts/lib/link-check-allowlist.mjs instead (see that commit).
 *
 * 2. https://www.fda.gov/media/172965/download (botulinum-toxin's
 *    BOTOX/onabotulinumtoxinA approved-labeling citation) is
 *    genuinely dead — not a bot-wall, confirmed independently. FIX:
 *    replaced with the current official FDA prescribing-information
 *    URL, https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/
 *    103000s5327lbl.pdf — same document identity (BLA 103000's
 *    approved labeling), same title, same source row (updated in
 *    place, not deleted/recreated, so claim_sources/content_revisions
 *    relationships and audit trail are preserved).
 *
 * Run manually, locally, never in CI:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/enrichment/fix-broken-citations-2026-08-08-b.mjs
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

const OLD_URL = 'https://www.fda.gov/media/172965/download';
const NEW_URL = 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/103000s5327lbl.pdf';

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
}

main().catch((err) => {
  console.error('Citation fix crashed:', err.message);
  process.exit(1);
});
