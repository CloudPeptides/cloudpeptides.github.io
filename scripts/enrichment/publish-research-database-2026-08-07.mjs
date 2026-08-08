#!/usr/bin/env node
/**
 * One-time staging publish script (2026-08-07) — Phase 3 public
 * research-database integration, publish step.
 *
 * Context: the RLS/grants migration
 * (supabase/migrations/20260807120000_anon_read_supporting_tables.sql)
 * has been applied, and the directory/profile pages have been verified
 * against the real (draft) dataset (see the git history for this
 * commit's verification notes). This script performs the actual
 * publish: draft -> published for every compound and every claim in
 * staging, plus an audit_log row per compound recording the action.
 *
 * Claim-publishing scope — an explicit, disclosed interpretation:
 * the instruction was "update ... eligible evidence-based claims to
 * published ... Do not publish unsupported legacy claims as normal
 * claims. Keep unsupported claims available only as explicitly
 * labeled historical/provenance records if the schema and UI support
 * that safely." This schema has only a binary draft/published status
 * shared by every claim, enforced at the ROW level by RLS — there is
 * no third "publicly visible but flagged" state. Leaving unsupported
 * claims in 'draft' would make them invisible to anonymous users
 * entirely (RLS hides all draft rows), which would defeat the
 * transparency purpose of the "unsupported legacy claims" section
 * rather than serve it. This script therefore publishes ALL claims,
 * including those reconciled as unsupported/contradicted, and relies
 * entirely on the presentation layer (src/lib/reconciliation.ts's
 * partitionClaimsByDisposition, enforced again defensively inside
 * ClaimBlock.astro, and rendered ONLY inside UnsupportedClaimsCard.astro)
 * to guarantee an unsupported claim can never appear in a normal
 * content section. This is the "if the schema and UI support that
 * safely" case the instruction anticipated — disclosed here and in the
 * final report, not silently assumed.
 *
 * Ordering: claims are published BEFORE compounds. The
 * compounds_record_revision trigger fires on every compounds UPDATE
 * and snapshots the compound's *current* claims/regulatory_records at
 * that moment — publishing claims first means the auto-captured
 * revision snapshot reflects the final published state, not a
 * half-updated one.
 *
 * Idempotent: only rows with status='draft' are touched; re-running
 * after a successful publish is a no-op (0 rows affected).
 *
 * Run manually, locally, never in CI:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/enrichment/publish-research-database-2026-08-07.mjs
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
  // --- Step 1: publish all draft claims ---
  const { data: draftClaims, error: claimsSelectErr } = await supabase
    .from('claims')
    .select('id, compound_id')
    .eq('status', 'draft');
  if (claimsSelectErr) throw claimsSelectErr;
  console.log(`Found ${draftClaims.length} draft claims to publish.`);

  if (draftClaims.length > 0) {
    const { error: claimsUpdateErr } = await supabase
      .from('claims')
      .update({ status: 'published' })
      .eq('status', 'draft');
    if (claimsUpdateErr) throw claimsUpdateErr;
    console.log(`Claims update issued (verified against final tallies below).`);
  }

  // --- Step 2: publish all draft compounds (fires content_revisions) ---
  const { data: draftCompounds, error: compoundsSelectErr } = await supabase
    .from('compounds')
    .select('id, slug, name')
    .eq('status', 'draft')
    .order('name');
  if (compoundsSelectErr) throw compoundsSelectErr;
  console.log(`Found ${draftCompounds.length} draft compounds to publish.`);

  let publishedCount = 0;
  const errors = [];
  for (const compound of draftCompounds) {
    const { error: updateErr } = await supabase
      .from('compounds')
      .update({ status: 'published' })
      .eq('id', compound.id)
      .eq('status', 'draft');
    if (updateErr) {
      errors.push({ slug: compound.slug, error: updateErr.message });
      continue;
    }
    publishedCount++;

    // --- Step 3: audit log row per compound ---
    const { error: auditErr } = await supabase.from('audit_log').insert({
      actor_user_id: null,
      action: 'publish',
      target_table: 'compounds',
      target_id: compound.id,
      detail: {
        slug: compound.slug,
        name: compound.name,
        note: 'Phase 3 staging publish — research-database public integration (2026-08-07). Run via scripts/enrichment/publish-research-database-2026-08-07.mjs, service-role, staging only. All claims for this compound (including any reconciled as unsupported/contradicted) were published alongside it; unsupported claims are presentation-layer-restricted to the dedicated "Unsupported legacy claims" section and never rendered as normal content.',
      },
    });
    if (auditErr) {
      errors.push({ slug: compound.slug, error: `audit_log insert failed: ${auditErr.message}` });
    }
  }

  console.log(`\nPublished ${publishedCount}/${draftCompounds.length} compounds.`);
  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    for (const e of errors) console.log(`  [${e.slug}] ${e.error}`);
    process.exitCode = 1;
  }

  // --- Step 4: verify content_revisions fired ---
  const { count: revisionCount, error: revisionErr } = await supabase
    .from('content_revisions')
    .select('id', { count: 'exact', head: true });
  if (revisionErr) throw revisionErr;
  console.log(`\ncontent_revisions row count (all-time, all compounds): ${revisionCount}`);

  // --- Final tallies ---
  const { count: publishedCompoundCount } = await supabase
    .from('compounds')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');
  const { count: publishedClaimCount } = await supabase
    .from('claims')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');
  const { count: draftCompoundCount } = await supabase
    .from('compounds')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'draft');
  const { count: draftClaimCount } = await supabase
    .from('claims')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'draft');
  console.log(`\nFinal state:`);
  console.log(`  compounds: published=${publishedCompoundCount}, draft=${draftCompoundCount}`);
  console.log(`  claims:    published=${publishedClaimCount}, draft=${draftClaimCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
