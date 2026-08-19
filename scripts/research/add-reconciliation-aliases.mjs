#!/usr/bin/env node
/**
 * Applies the two alias-only reconciliation decisions from
 * docs/research/2026-08-19-candidate-reconciliation-manifest.md:
 *  - "AOD 9064" -> AOD-9604 (typo/spelling variant, not a new compound)
 *  - "CJC-1295 without DAC" -> CJC-1295 No DAC (literal string wasn't
 *    yet a recorded alias, even though the profile already covers it)
 *
 * Idempotent — addAliasIfMissing checks the exact (compound_id, alias)
 * pair first. Run manually: node scripts/research/add-reconciliation-aliases.mjs
 */
import { addAliasIfMissing, getServiceClient } from './lib/import-helpers.mjs';

async function main() {
  const client = getServiceClient();

  const { data: aod, error: aodErr } = await client
    .from('compounds')
    .select('id')
    .eq('slug', 'aod-9604')
    .single();
  if (aodErr) throw aodErr;
  console.log(
    'AOD-9604 <- "AOD 9064":',
    await addAliasIfMissing(
      client,
      aod.id,
      'AOD 9064',
      'spelling_variant',
      'Supplied candidate name from the 2026-08-19 research-expansion task; treated as a digit-transposition typo of AOD-9604 (no primary evidence found for a distinct "AOD-9064" compound) — see docs/research/2026-08-19-candidate-reconciliation-manifest.md. Not to be confused with the separate, still-unresolved "AOD9605" shop-only listing.',
    ),
  );

  const { data: cjc, error: cjcErr } = await client
    .from('compounds')
    .select('id')
    .eq('slug', 'cjc-1295-no-dac')
    .single();
  if (cjcErr) throw cjcErr;
  console.log(
    'CJC-1295 No DAC <- "CJC-1295 without DAC":',
    await addAliasIfMissing(
      client,
      cjc.id,
      'CJC-1295 without DAC',
      'spelling_variant',
      "Supplied candidate name from the 2026-08-19 research-expansion task — literal string form of this profile's existing name; see docs/research/2026-08-19-candidate-reconciliation-manifest.md for the CJC-1295/Modified GRF(1-29) naming-ambiguity note.",
    ),
  );
}

main();
