#!/usr/bin/env node
/**
 * Phase 2 migration — actually inserts the dry-run extraction
 * (docs/migration/legacy-extraction.json) into Supabase as draft
 * content. Run manually, locally, never in CI:
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migration/import-to-supabase.mjs
 *
 * The service-role key is read from the environment only — never
 * hardcoded, never committed, never logged. Every compound/claim is
 * inserted with status='draft'; nothing here ever sets 'published'.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error(
    "This script must be run manually, locally, with the staging project's service-role key.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EXTRACTION_PATH = new URL('../../docs/migration/legacy-extraction.json', import.meta.url);
const REPORT_PATH = new URL('../../docs/migration/legacy-import-result.md', import.meta.url);

async function main() {
  const { compounds } = JSON.parse(readFileSync(EXTRACTION_PATH, 'utf8'));
  const importable = compounds.filter((c) => c.importable);

  const results = [];
  const slugToId = new Map();

  console.log(`Importing ${importable.length} compounds as drafts...`);

  // Pass 1 — compounds (status forced to 'draft' regardless of anything
  // in the extraction — never trust upstream data for this).
  for (const c of importable) {
    const { data: existing } = await supabase
      .from('compounds')
      .select('id')
      .eq('slug', c.slug)
      .maybeSingle();
    if (existing) {
      slugToId.set(c.slug, existing.id);
      results.push({ slug: c.slug, status: 'skipped_existing', compound_id: existing.id });
      continue;
    }

    const { data, error } = await supabase
      .from('compounds')
      .insert({
        slug: c.slug,
        name: c.name,
        entity_kind: c.entity_kind,
        category: c.category,
        status: 'draft',
        legacy_source_path: `legacy-site/${c.filename}`,
        // Extraction warnings (e.g. "stub page, zero claims", "entity_kind
        // assigned via human review") ride along in the DB record itself,
        // not just the markdown report, so editors querying the table
        // directly still see the caveats.
        raw_import_metadata: { ...c.raw_import_metadata, import_warnings: c.warnings },
      })
      .select('id')
      .single();

    if (error) {
      results.push({ slug: c.slug, status: 'error', error: error.message });
      continue;
    }
    slugToId.set(c.slug, data.id);
    results.push({ slug: c.slug, status: 'inserted', compound_id: data.id });
  }

  // Pass 2 — one provenance source per compound, its claims, and the
  // claim_sources links. relationship='provides_context' because this
  // documents *where the text came from* (the legacy page), not a
  // scientific citation supporting the statement.
  let totalClaimsInserted = 0;
  for (const c of importable) {
    const compoundId = slugToId.get(c.slug);
    if (!compoundId) continue;
    const resultEntry = results.find((r) => r.slug === c.slug);
    if (resultEntry.status === 'skipped_existing') continue; // don't duplicate claims on re-run

    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        source_type: c.source.source_type,
        title: c.source.title,
        url: c.source.url,
        retrieved_date: new Date().toISOString().slice(0, 10),
      })
      .select('id')
      .single();

    if (sourceError) {
      resultEntry.claimsError = sourceError.message;
      continue;
    }

    let claimsInserted = 0;
    for (const claim of c.claims) {
      const { data: claimRow, error: claimError } = await supabase
        .from('claims')
        .insert({
          compound_id: compoundId,
          content_section: claim.content_section,
          statement: claim.statement,
          evidence_quality: null,
          interpretation_status: 'unknown',
          display_order: claim.display_order,
          status: 'draft',
        })
        .select('id')
        .single();

      if (claimError) {
        resultEntry.claimsError =
          (resultEntry.claimsError || '') + `; claim ${claim.display_order}: ${claimError.message}`;
        continue;
      }

      const { error: linkError } = await supabase.from('claim_sources').insert({
        claim_id: claimRow.id,
        source_id: source.id,
        relationship: 'provides_context',
        date_accessed: new Date().toISOString().slice(0, 10),
      });
      if (linkError) {
        resultEntry.claimsError =
          (resultEntry.claimsError || '') +
          `; claim_sources for claim ${claim.display_order}: ${linkError.message}`;
        continue;
      }
      claimsInserted++;
    }
    resultEntry.claimsInserted = claimsInserted;
    totalClaimsInserted += claimsInserted;
  }

  // Pass 3 — stack_components, resolved by matching component names
  // against already-inserted compound names (case-insensitive). Runs
  // over the *entire* importable set every time (not just newly-inserted
  // compounds) so previously-unresolved links (e.g. a stack referencing a
  // compound that only just became importable) get retried — so this
  // must be idempotent: check for an existing (stack_id,
  // component_compound_id) row before inserting, since the primary key
  // would otherwise reject a duplicate on every re-run and the error
  // would be silently swallowed below, undercounting real links.
  const nameToSlug = new Map(importable.map((c) => [c.name.toLowerCase(), c.slug]));
  let stackComponentsInserted = 0;
  let stackComponentsAlreadyLinked = 0;
  const unresolvedComponents = [];
  for (const c of importable) {
    if (!c.stack_component_names) continue;
    const stackId = slugToId.get(c.slug);
    for (const componentName of c.stack_component_names) {
      const componentSlug = nameToSlug.get(componentName.toLowerCase());
      const componentId = componentSlug ? slugToId.get(componentSlug) : null;
      if (!componentId) {
        unresolvedComponents.push({ stack: c.slug, componentName });
        continue;
      }
      const { data: existingLink } = await supabase
        .from('stack_components')
        .select('stack_id')
        .eq('stack_id', stackId)
        .eq('component_compound_id', componentId)
        .maybeSingle();
      if (existingLink) {
        stackComponentsAlreadyLinked++;
        continue;
      }
      const { error } = await supabase.from('stack_components').insert({
        stack_id: stackId,
        component_compound_id: componentId,
      });
      if (!error) {
        stackComponentsInserted++;
      } else {
        unresolvedComponents.push({ stack: c.slug, componentName, error: error.message });
      }
    }
  }

  // Verify actual row counts against what we expected to insert.
  const { count: compoundCount } = await supabase
    .from('compounds')
    .select('id', { count: 'exact', head: true });
  const { count: claimCount } = await supabase
    .from('claims')
    .select('id', { count: 'exact', head: true });
  const { count: draftCompoundCount } = await supabase
    .from('compounds')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'draft');
  const { count: nonDraftCompoundCount } = await supabase
    .from('compounds')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'draft');

  const inserted = results.filter((r) => r.status === 'inserted').length;
  const skipped = results.filter((r) => r.status === 'skipped_existing').length;
  const errored = results.filter((r) => r.status === 'error' || r.claimsError).length;

  let report = `# Legacy Import Result\n\n`;
  report += `Run at ${new Date().toISOString()} against the Supabase staging project.\n\n`;
  report += `**Compounds:** ${inserted} inserted, ${skipped} skipped (already existed), ${errored} had an error.\n`;
  report += `**Claims:** ${totalClaimsInserted} inserted.\n`;
  report += `**Stack components:** ${stackComponentsInserted} newly inserted, ${stackComponentsAlreadyLinked} already linked (idempotent re-run)${unresolvedComponents.length ? `, ${unresolvedComponents.length} unresolved` : ''}.\n\n`;
  report += `**Live DB verification:** ${compoundCount} total compounds rows, ${claimCount} total claims rows. `;
  report += `${draftCompoundCount} draft, ${nonDraftCompoundCount} non-draft (expected: 0 — every imported compound must be a draft).\n\n`;

  if (unresolvedComponents.length) {
    report += `## Unresolved stack components\n\n`;
    for (const u of unresolvedComponents)
      report += `- ${u.stack}: could not resolve "${u.componentName}" to a compound${u.error ? ` (insert error: ${u.error})` : ''}\n`;
    report += `\n`;
  }

  report += `## Per-compound results\n\n| Slug | Status | Claims inserted | Error |\n|---|---|---|---|\n`;
  for (const r of results) {
    report += `| ${r.slug} | ${r.status} | ${r.claimsInserted ?? '-'} | ${r.claimsError ?? r.error ?? ''} |\n`;
  }

  writeFileSync(REPORT_PATH, report);
  console.log(report);
  console.log(`Wrote ${REPORT_PATH.pathname}`);

  if (nonDraftCompoundCount > 0) {
    console.error(
      `FATAL: ${nonDraftCompoundCount} compound(s) are not in draft status. Investigate before proceeding.`,
    );
    process.exit(1);
  }
  if (errored > 0) {
    console.error(
      `${errored} compound(s) had errors — review the report before considering the import complete.`,
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
