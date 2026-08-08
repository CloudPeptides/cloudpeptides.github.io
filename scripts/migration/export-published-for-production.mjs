#!/usr/bin/env node
/**
 * PREPARED, NOT RUN. Staging → production data migration
 * (production-cutover-plan.md §2) — copies only reviewed, approved
 * rows into a brand-new production Supabase project. Cannot be
 * executed yet: no production Supabase project exists (creating one,
 * and activating its paid tier, both require your explicit approval
 * per CLAUDE.md §9 — production-cutover-plan.md §1).
 *
 * Explicitly does NOT copy: content_revisions, audit_log,
 * link_health_checks (production starts its own history from a clean
 * slate, not staging's build-process noise), user_roles (production
 * roles are assigned fresh to real accounts), or any commerce table
 * (currently unused — the shop is still the static-catalog rebuild).
 *
 * Only `status = 'published'` compounds/claims are copied — re-filters
 * at run time, not hardcoded to "56," in case new drafts exist by the
 * time this actually runs.
 *
 * Preserves every row's original `id` on insert (no re-mapping) so
 * foreign keys carry over directly and staging/production ids stay
 * cross-referenceable for debugging — safe, since these are UUIDs.
 *
 * Run manually, locally, never in CI, once a production project
 * exists and its schema migrations have already been applied
 * (`supabase db push` against the production project ref):
 *
 *   STAGING_SUPABASE_URL=... STAGING_SERVICE_ROLE_KEY=... \
 *   PROD_SUPABASE_URL=... PROD_SERVICE_ROLE_KEY=... \
 *     node scripts/migration/export-published-for-production.mjs
 *
 * Idempotent: skips any row whose id already exists on the production
 * side, so a partial/interrupted run can simply be re-run.
 */
import { createClient } from '@supabase/supabase-js';

const STAGING_URL = process.env.STAGING_SUPABASE_URL;
const STAGING_KEY = process.env.STAGING_SERVICE_ROLE_KEY;
const PROD_URL = process.env.PROD_SUPABASE_URL;
const PROD_KEY = process.env.PROD_SERVICE_ROLE_KEY;

if (!STAGING_URL || !STAGING_KEY || !PROD_URL || !PROD_KEY) {
  console.error(
    'Missing one of STAGING_SUPABASE_URL, STAGING_SERVICE_ROLE_KEY, PROD_SUPABASE_URL, PROD_SERVICE_ROLE_KEY.',
  );
  process.exit(1);
}
if (STAGING_URL === PROD_URL) {
  console.error('STAGING_SUPABASE_URL and PROD_SUPABASE_URL are identical — refusing to run.');
  process.exit(1);
}

const staging = createClient(STAGING_URL, STAGING_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const prod = createClient(PROD_URL, PROD_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const summary = [];
function record(table, inserted, skipped) {
  summary.push({ table, inserted, skipped });
  console.log(`${table}: ${inserted} inserted, ${skipped} already present`);
}

/** Inserts rows one at a time (small dataset — clarity and per-row
 * error visibility matter more here than batch throughput), skipping
 * any id that already exists on the production side. */
async function copyTable(table, rows, { keyColumns = ['id'] } = {}) {
  let inserted = 0;
  let skipped = 0;
  for (const row of rows) {
    const match = {};
    for (const col of keyColumns) match[col] = row[col];
    const { data: existing } = await prod
      .from(table)
      .select(keyColumns.join(','))
      .match(match)
      .maybeSingle();
    if (existing) {
      skipped++;
      continue;
    }
    const { error } = await prod.from(table).insert(row);
    if (error) {
      console.error(
        `  FAILED inserting into ${table} (${JSON.stringify(match)}): ${error.message}`,
      );
      continue;
    }
    inserted++;
  }
  record(table, inserted, skipped);
}

async function main() {
  console.log(`Exporting published content: ${STAGING_URL} -> ${PROD_URL}\n`);

  const { data: compounds, error: compoundsErr } = await staging
    .from('compounds')
    .select('*')
    .eq('status', 'published');
  if (compoundsErr) throw compoundsErr;
  const compoundIds = compounds.map((c) => c.id);
  await copyTable('compounds', compounds);

  const { data: aliases } = await staging
    .from('compound_aliases')
    .select('*')
    .in('compound_id', compoundIds);
  await copyTable('compound_aliases', aliases ?? []);

  const { data: claims, error: claimsErr } = await staging
    .from('claims')
    .select('*')
    .in('compound_id', compoundIds)
    .eq('status', 'published');
  if (claimsErr) throw claimsErr;
  const claimIds = claims.map((c) => c.id);

  const { data: claimSources } = await staging
    .from('claim_sources')
    .select('*')
    .in('claim_id', claimIds);
  const sourceIds = [...new Set((claimSources ?? []).map((cs) => cs.source_id))];

  const { data: regRecords } = await staging
    .from('regulatory_records')
    .select('*')
    .in('compound_id', compoundIds);
  for (const r of regRecords ?? []) sourceIds.push(r.source_id);
  const uniqueSourceIds = [...new Set(sourceIds)];

  const { data: sources } = await staging.from('sources').select('*').in('id', uniqueSourceIds);
  const studyIds = [...new Set((sources ?? []).map((s) => s.study_id).filter(Boolean))];

  // Parent tables first — studies/sources before anything that
  // references them via a foreign key.
  const { data: studies } = await staging.from('studies').select('*').in('id', studyIds);
  await copyTable('studies', studies ?? []);

  await copyTable('sources', sources ?? []);

  const { data: sourceIdentifiers } = await staging
    .from('source_identifiers')
    .select('*')
    .in('source_id', uniqueSourceIds);
  await copyTable('source_identifiers', sourceIdentifiers ?? [], {
    keyColumns: ['source_id', 'identifier_type', 'identifier_value'],
  });

  await copyTable('claims', claims);

  const filteredClaimSources = (claimSources ?? []).filter((cs) => claimIds.includes(cs.claim_id));
  await copyTable('claim_sources', filteredClaimSources, { keyColumns: ['claim_id', 'source_id'] });

  await copyTable('regulatory_records', regRecords ?? []);

  const { data: stackComponents } = await staging
    .from('stack_components')
    .select('*')
    .in('stack_id', compoundIds);
  // A stack's component must ALSO be in the published set being copied
  // — never link to a component compound that doesn't exist yet on
  // the production side.
  const filteredStackComponents = (stackComponents ?? []).filter((sc) =>
    compoundIds.includes(sc.component_compound_id),
  );
  await copyTable('stack_components', filteredStackComponents, {
    keyColumns: ['stack_id', 'component_compound_id'],
  });

  console.log(
    '\nDone. Re-run this script any time — already-present rows are skipped, not duplicated.',
  );
  console.log(
    'Next: run scripts/migration/verify-security.mjs against the production project before any traffic reaches it (production-cutover-plan.md §2 step 4).',
  );
}

main().catch((err) => {
  console.error('Export crashed:', err.message);
  process.exit(1);
});
