#!/usr/bin/env node
/**
 * One-off, read-only verification for the Phase 2/3 closeout — queries the
 * live Supabase staging project directly rather than trusting the import
 * script's own self-reported counts. Never writes anything.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migration/verify-closeout.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TARGET_SLUGS = [
  ['5-amino-1mq', 'non_peptide_research_compound'],
  ['aicar', 'small_molecule_drug'],
  ['bpc-157-tb-500', 'peptide_blend'],
  ['cerebrolysin', 'biologic'],
  ['cjc-1295-no-dac-ipamorelin', 'peptide_blend'],
  ['glutathione', 'peptide'],
  ['nad-plus', 'non_peptide_research_compound'],
  ['semax', 'peptide'],
];

async function main() {
  console.log('=== Compound totals ===');
  const { count: total } = await admin
    .from('compounds')
    .select('id', { count: 'exact', head: true });
  const { count: draft } = await admin
    .from('compounds')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'draft');
  const { count: published } = await admin
    .from('compounds')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');
  console.log(`total=${total} draft=${draft} published=${published}`);

  console.log('\n=== The 8 target compounds ===');
  for (const [slug, expectedKind] of TARGET_SLUGS) {
    const { data: c, error } = await admin
      .from('compounds')
      .select('id, slug, entity_kind, status, raw_import_metadata')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !c) {
      console.log(`${slug}: MISSING (${error?.message ?? 'no row'})`);
      continue;
    }
    const { count: claimCount } = await admin
      .from('claims')
      .select('id', { count: 'exact', head: true })
      .eq('compound_id', c.id);
    const kindOk = c.entity_kind === expectedKind ? 'OK' : `MISMATCH (expected ${expectedKind})`;
    console.log(
      `${slug}: entity_kind=${c.entity_kind} [${kindOk}] status=${c.status} claims=${claimCount}`,
    );
  }

  console.log('\n=== Claim + provenance totals ===');
  const { count: claimTotal } = await admin
    .from('claims')
    .select('id', { count: 'exact', head: true });
  const { count: sourceTotal } = await admin
    .from('sources')
    .select('id', { count: 'exact', head: true });
  const { count: claimSourceTotal } = await admin
    .from('claim_sources')
    .select('claim_id', { count: 'exact', head: true });
  console.log(`claims=${claimTotal} sources=${sourceTotal} claim_sources=${claimSourceTotal}`);

  console.log('\n=== Stack/blend component links (full table) ===');
  const { data: links } = await admin
    .from('stack_components')
    .select('stack_id, component_compound_id, dose_or_ratio_note');
  const { data: allCompounds } = await admin.from('compounds').select('id, slug, name');
  const idToSlug = new Map(allCompounds.map((c) => [c.id, c.slug]));
  console.log(`total stack_components rows: ${links.length}`);
  const bySlug = new Map();
  for (const l of links) {
    const stackSlug = idToSlug.get(l.stack_id) ?? l.stack_id;
    const compSlug = idToSlug.get(l.component_compound_id) ?? l.component_compound_id;
    if (!bySlug.has(stackSlug)) bySlug.set(stackSlug, []);
    bySlug.get(stackSlug).push(compSlug);
  }
  for (const [stack, comps] of [...bySlug.entries()].sort()) {
    console.log(`  ${stack}: [${comps.sort().join(', ')}]`);
  }
  console.log('\n  --- specifically requested ---');
  for (const s of ['bpc-157-tb-500', 'cjc-1295-no-dac-ipamorelin']) {
    console.log(`  ${s}: [${(bySlug.get(s) || []).sort().join(', ')}]`);
  }
  for (const s of ['calm-focus-stack', 'neuro-cognitive-stack', 'upgraded-glow-stack']) {
    console.log(`  ${s}: [${(bySlug.get(s) || []).sort().join(', ')}]`);
  }

  console.log('\n=== Anonymous read of the 8 drafts (must all be null/empty) ===');
  for (const [slug] of TARGET_SLUGS) {
    const { data, error } = await anon
      .from('compounds')
      .select('id, slug, status')
      .eq('slug', slug)
      .maybeSingle();
    console.log(
      `  ${slug}: anon sees ${data ? JSON.stringify(data) : 'nothing'} ${error ? `(error: ${error.message})` : ''}`,
    );
  }
  const { count: anonCount } = await anon.from('compounds').select('id', { count: 'exact' });
  console.log(`  anon total visible compounds (should be 0, none published): ${anonCount}`);
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
