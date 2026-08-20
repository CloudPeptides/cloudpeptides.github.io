#!/usr/bin/env node
/**
 * Pre-publish fix, part 2: checkPublishReadiness (src/lib/admin/
 * validation.ts) blocks publishing while ANY claim has zero cited
 * sources — including the 5 standard editorial/site-policy claims
 * every profile gets (standardBoilerplateClaims() in
 * scripts/research/lib/import-helpers.mjs). Checked against an
 * existing published compound (bpc-157) to confirm this is a real,
 * already-enforced site convention, not a rule only this batch would
 * be held to: its own boilerplate claims are in fact linked to a
 * source (its "legacy page" provenance record) — none of its 16 claims
 * are sourceless.
 *
 * These new compounds have no legacy page to link to (they never
 * existed on the old static site), so this attaches them all to one
 * shared, real, already-live site page instead — the Research Use
 * Policy — which is what the claims are actually describing (Cloud
 * Peptides' own editorial posture), not a scientific citation standing
 * in for one.
 *
 * Idempotent: the shared source is looked up/reused by URL; each
 * (claim_id, source_id) link is skipped if it already exists.
 * Run manually: node scripts/research/fix-boilerplate-claim-sources.mjs
 */
import { getServiceClient, upsertSource } from './lib/import-helpers.mjs';

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

const BOILERPLATE_PREFIXES = [
  'Q: Does Cloud Peptides provide dosage information?',
  'Cloud Peptides does not provide medical advice',
  'Q: Is ',
  'All products are intended strictly for laboratory research',
  'This page summarizes publicly available scientific literature',
];

const LOCATOR_NOTE =
  "This is Cloud Peptides' own editorial/site-policy statement, not a scientific claim about the compound — linked to the site's own Research Use Policy page rather than a scientific source.";

async function main() {
  const client = getServiceClient();

  const { id: policySourceId } = await upsertSource(client, {
    sourceType: 'other',
    title: 'Cloud Peptides Research Use Policy',
    url: 'https://cloudpeptides.org/research-use-policy',
    publisherOrAgency: 'Cloud Peptides',
    retrievedDate: '2026-08-19',
  });
  console.log(`Research Use Policy source: ${policySourceId}`);

  const { data: compounds } = await client
    .from('compounds')
    .select('id, slug')
    .in('slug', NEW_SLUGS);

  let linked = 0;
  let alreadyLinked = 0;
  for (const c of compounds) {
    const { data: claims } = await client
      .from('claims')
      .select('id, statement, claim_sources(source_id)')
      .eq('compound_id', c.id);
    const sourceless = (claims ?? []).filter(
      (cl) =>
        (cl.claim_sources?.length ?? 0) === 0 &&
        BOILERPLATE_PREFIXES.some((p) => cl.statement.startsWith(p)),
    );
    for (const claim of sourceless) {
      const { error } = await client.from('claim_sources').insert({
        claim_id: claim.id,
        source_id: policySourceId,
        relationship: 'provides_context',
        locator: LOCATOR_NOTE,
      });
      if (error) {
        console.error(`FAILED (${c.slug}, claim ${claim.id}):`, error.message);
      } else {
        linked++;
      }
    }
  }
  console.log(`\nLinked ${linked} boilerplate claims to the shared policy source.`);
  console.log(`(already linked / skipped: ${alreadyLinked})`);
}

main();
