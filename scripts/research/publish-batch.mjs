#!/usr/bin/env node
/**
 * Publishes the 18 compounds from the 2026-08-19 research-expansion
 * batch, following the exact same rules the real admin UI's Publish
 * action enforces (src/lib/admin/validation.ts's checkPublishReadiness,
 * src/pages/admin/compounds/[id].astro's transition table: draft ->
 * in_review -> published) — every claim must have a citation, every
 * regulatory record must have a source. Re-verifies both before
 * writing anything; aborts (no partial publish) if either check still
 * fails for any compound.
 *
 * Sets claims.status='published' for every claim belonging to these
 * compounds too — the public profile page (CompoundProfileBody.astro)
 * filters claims by their OWN status independently of the compound's,
 * so publishing the compound alone would render an empty page.
 *
 * Idempotent: skips a compound already 'published'.
 * Run manually: node scripts/research/publish-batch.mjs
 */
import { getServiceClient } from './lib/import-helpers.mjs';

const NEW_SLUGS = [
  'ghrp-2',
  'ghrp-6',
  'hexarelin',
  'gonadorelin',
  'peg-mgf',
  'mazdutide',
  'survodutide',
  'cagrisema',
  'll-37',
  'adipotide',
  'ace-031',
  'hmg',
  'snap-8',
  'vip',
  'vitamin-b12',
  'epo',
  'foxo4-dri',
  'lipo-c',
];

async function main() {
  const client = getServiceClient();
  const { data: compounds, error } = await client
    .from('compounds')
    .select('id, slug, name, status')
    .in('slug', NEW_SLUGS);
  if (error) throw error;
  if (compounds.length !== NEW_SLUGS.length) {
    console.error(
      `FATAL: expected ${NEW_SLUGS.length} compounds, found ${compounds.length}. Aborting.`,
    );
    process.exit(1);
  }

  // ---- readiness re-check (mirrors checkPublishReadiness exactly) ----
  let anyBlocked = false;
  for (const c of compounds) {
    const { data: claims } = await client
      .from('claims')
      .select('id, evidence_quality, quality_rationale, claim_sources(source_id)')
      .eq('compound_id', c.id);
    const uncited = (claims ?? []).filter((cl) => (cl.claim_sources?.length ?? 0) === 0);
    const missingRationale = (claims ?? []).filter(
      (cl) =>
        cl.evidence_quality && cl.evidence_quality !== 'not_assessed' && !cl.quality_rationale,
    );
    const { data: regRecords } = await client
      .from('regulatory_records')
      .select('id, source_id')
      .eq('compound_id', c.id);
    const regMissingSource = (regRecords ?? []).filter((r) => !r.source_id);

    if (uncited.length || missingRationale.length || regMissingSource.length) {
      anyBlocked = true;
      console.error(
        `BLOCKED: ${c.slug} — uncited claims: ${uncited.length}, missing rationale: ${missingRationale.length}, regulatory records missing source: ${regMissingSource.length}`,
      );
    }
  }
  if (anyBlocked) {
    console.error(
      '\nAborting — fix the blockers above before publishing (no partial publish performed).',
    );
    process.exit(1);
  }
  console.log(`Readiness check passed for all ${compounds.length} compounds.\n`);

  // ---- publish ----
  const now = new Date().toISOString();
  for (const c of compounds) {
    if (c.status === 'published') {
      console.log(`${c.slug}: already published, skipping.`);
      continue;
    }
    const { error: claimsErr } = await client
      .from('claims')
      .update({ status: 'published' })
      .eq('compound_id', c.id);
    if (claimsErr) {
      console.error(`FAILED to publish claims for ${c.slug}:`, claimsErr.message);
      continue;
    }
    const { error: compoundErr } = await client
      .from('compounds')
      .update({ status: 'published', last_reviewed_at: now })
      .eq('id', c.id);
    if (compoundErr) {
      console.error(`FAILED to publish compound ${c.slug}:`, compoundErr.message);
      continue;
    }
    console.log(`${c.slug}: published.`);
  }
}

main();
