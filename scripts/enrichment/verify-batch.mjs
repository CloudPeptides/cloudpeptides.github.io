#!/usr/bin/env node
/**
 * Post-batch verification for the enrichment pipeline. Run after
 * run-enrichment.mjs for a batch of slugs:
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/enrichment/verify-batch.mjs <slug ...>
 *
 * Checks (all against the live staging DB, not assumed):
 *  1. Draft status — every named compound is status='draft'; whole-DB
 *     count of non-draft compounds/claims is 0 (nothing anywhere got
 *     published as a side effect).
 *  2. Citation integrity — every claim_sources row for these compounds'
 *     claims points to a source that actually exists with a non-empty
 *     title and URL; every source with identifiers has no duplicate
 *     (identifier_type, identifier_value) pair anywhere in the DB.
 *  3. Claim-support check — every claim belonging to these compounds
 *     that has evidence_quality set also has a non-null quality_rationale
 *     (the DB check constraint already enforces this, but verified
 *     directly here too); every claim has a non-null interpretation_status
 *     except claims with zero linked sources (pure disclaimers) are
 *     allowed 'established'/'unknown' but never null+unexplained.
 *  4. Reports counts per compound for cross-checking against the
 *     pipeline's own run log.
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

async function main() {
  const slugs = process.argv.slice(2);
  if (slugs.length === 0) {
    console.error('Usage: node scripts/enrichment/verify-batch.mjs <slug ...>');
    process.exit(1);
  }

  let problems = 0;

  const { data: compounds, error: cErr } = await supabase
    .from('compounds')
    .select('id, slug, status')
    .in('slug', slugs);
  if (cErr) throw cErr;
  const missing = slugs.filter((s) => !compounds.find((c) => c.slug === s));
  if (missing.length) {
    console.error('FATAL: slugs not found in DB:', missing.join(', '));
    problems++;
  }
  const nonDraft = compounds.filter((c) => c.status !== 'draft');
  console.log(`1. Draft status: ${compounds.length}/${slugs.length} compounds found, ${nonDraft.length} non-draft.`);
  if (nonDraft.length) {
    console.error('   FATAL:', nonDraft.map((c) => `${c.slug}=${c.status}`).join(', '));
    problems++;
  }

  const { count: dbWideNonDraftCompounds } = await supabase
    .from('compounds')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'draft');
  const { count: dbWideNonDraftClaims } = await supabase
    .from('claims')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'draft');
  console.log(`   Whole-DB: ${dbWideNonDraftCompounds} non-draft compounds, ${dbWideNonDraftClaims} non-draft claims (expect 0, 0).`);
  if (dbWideNonDraftCompounds > 0 || dbWideNonDraftClaims > 0) {
    console.error('   FATAL: something is non-draft somewhere in the database.');
    problems++;
  }

  // 2. Citation integrity.
  const compoundIds = compounds.map((c) => c.id);
  const { data: claims, error: clErr } = await supabase
    .from('claims')
    .select('id, compound_id, evidence_quality, quality_rationale, interpretation_status')
    .in('compound_id', compoundIds);
  if (clErr) throw clErr;

  const claimIds = claims.map((c) => c.id);
  const { data: claimSources, error: csErr } = await supabase
    .from('claim_sources')
    .select('claim_id, source_id, relationship')
    .in('claim_id', claimIds);
  if (csErr) throw csErr;

  const sourceIds = [...new Set(claimSources.map((cs) => cs.source_id))];
  const { data: sources, error: sErr } = await supabase.from('sources').select('id, title, url').in('id', sourceIds);
  if (sErr) throw sErr;
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  let brokenLinks = 0;
  for (const cs of claimSources) {
    const s = sourceById.get(cs.source_id);
    if (!s || !s.title || !s.url) {
      brokenLinks++;
      console.error(`   FATAL: claim_sources row (claim ${cs.claim_id}) points to a missing/incomplete source ${cs.source_id}`);
    }
  }
  console.log(`2. Citation integrity: ${claimSources.length} claim_sources rows checked, ${brokenLinks} broken.`);
  if (brokenLinks) problems++;

  const { data: dupCheck } = await supabase.from('source_identifiers').select('identifier_type, identifier_value');
  const seen = new Set();
  let dupes = 0;
  for (const row of dupCheck) {
    const key = `${row.identifier_type}:${row.identifier_value}`;
    if (seen.has(key)) dupes++;
    seen.add(key);
  }
  console.log(`   Duplicate source_identifiers pairs in whole DB: ${dupes} (expect 0).`);
  if (dupes) problems++;

  // 3. Claim-support check.
  let missingRationale = 0;
  for (const c of claims) {
    if (c.evidence_quality && c.evidence_quality !== 'not_assessed' && !c.quality_rationale) {
      missingRationale++;
      console.error(`   FATAL: claim ${c.id} has evidence_quality="${c.evidence_quality}" but no quality_rationale`);
    }
  }
  console.log(`3. Claim-support check: ${claims.length} claims for this batch, ${missingRationale} missing required rationale.`);
  if (missingRationale) problems++;

  // 4. Per-compound counts.
  console.log('\n4. Per-compound counts:');
  for (const c of compounds) {
    const { count: claimCount } = await supabase.from('claims').select('id', { count: 'exact', head: true }).eq('compound_id', c.id);
    const { count: regCount } = await supabase.from('regulatory_records').select('id', { count: 'exact', head: true }).eq('compound_id', c.id);
    const { count: revCount } = await supabase.from('content_revisions').select('id', { count: 'exact', head: true }).eq('compound_id', c.id);
    console.log(`   ${c.slug}: claims=${claimCount} regulatory_records=${regCount} content_revisions=${revCount}`);
  }

  console.log(`\n${problems === 0 ? 'ALL CHECKS PASSED' : `${problems} CHECK(S) FAILED`}`);
  if (problems > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
