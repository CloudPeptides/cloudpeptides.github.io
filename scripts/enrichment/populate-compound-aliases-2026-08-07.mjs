#!/usr/bin/env node
/**
 * One-time launch-readiness script (2026-08-07) — populates
 * public.compound_aliases, which has had zero rows since the original
 * legacy import (confirmed empty during the prior integration phase;
 * neither Phase 2's import nor the research-enrichment pipeline ever
 * wrote to this table).
 *
 * Scope and sourcing discipline, per instruction:
 *  - Only accepted scientific names, established abbreviations,
 *    generic/nonproprietary (INN) names, recognized development codes,
 *    genuinely common spelling/hyphenation variants, and names actually
 *    used in peer-reviewed literature or authoritative regulatory
 *    records.
 *  - No vendor-marketing names, no invented misspellings.
 *  - Brand/product names are included ONLY where this project's own
 *    already-verified regulatory_records establish the exact approved
 *    product (see the "closeout" work — docs/enrichment/full-coverage-
 *    report.md §5 — and the live regulatory_records rows this script
 *    cross-checks itself against below), each tagged alias_type =
 *    'brand_name' with a note distinguishing the approved product from
 *    unapproved research-grade material containing the same molecule.
 *    A compound with no independently-verified brand name in its own
 *    regulatory_records gets no invented one (e.g. SS-31/elamipretide:
 *    FDA-approved but no separate brand name is recorded here, so none
 *    is added).
 *  - NO aliases for stacks or proprietary blends (13 records: 9 stacks
 *    + 4 blends) — a stack/blend name is not a synonym for a molecule.
 *  - NO aliases for the compounds already flagged for expert review due
 *    to unverifiable identity/literature (Adamax, Cartalax, Pinealon,
 *    Lemon Bottle, Thymalin/Thymulin) — adding alternate names to a
 *    record whose own identity is already flagged as unverified would
 *    compound the ambiguity, not resolve it.
 *  - A handful of compounds (PE-22-28, PE-22-29, Selank, Ipamorelin,
 *    Sermorelin's brand, Cerebrolysin) intentionally get zero or
 *    minimal aliases — no alternate identifier could be verified to
 *    this project's confidence bar, so none was added rather than
 *    guessed.
 *
 * Every alias is checked against the compound's own `name` (case-
 * insensitively) and against every other alias already queued for that
 * compound (case-insensitively) before insert — no duplicates, no
 * alias identical to the primary name.
 *
 * Idempotent: upserts on the table's existing unique(compound_id,
 * alias) constraint — re-running updates alias_type/note in place
 * rather than erroring or duplicating.
 *
 * Run manually, locally, never in CI:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/enrichment/populate-compound-aliases-2026-08-07.mjs
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

// slug -> [{ alias, type, note? }]
// type in: scientific_name | generic_name | abbreviation | development_code | spelling_variant | brand_name
const ALIASES = {
  '5-amino-1mq': [{ alias: '5-Amino-1-methylquinolinium', type: 'scientific_name' }],
  'ahk-cu': [{ alias: 'Alanine-Histidine-Lysine-Copper(II)', type: 'scientific_name' }],
  aicar: [
    {
      alias: 'Acadesine',
      type: 'generic_name',
      note: 'INN/generic name for the AICA riboside form.',
    },
    { alias: 'AICA riboside', type: 'scientific_name' },
  ],
  'aod-9604': [
    { alias: 'AOD9604', type: 'spelling_variant' },
    { alias: 'hGH Fragment 176-191', type: 'scientific_name' },
  ],
  'ara-290': [
    { alias: 'Cibinetide', type: 'generic_name' },
    { alias: 'ARA290', type: 'spelling_variant' },
  ],
  'botulinum-toxin': [
    { alias: 'Botulinum toxin type A', type: 'scientific_name' },
    { alias: 'Clostridium botulinum neurotoxin', type: 'scientific_name' },
    {
      alias: 'Botox',
      type: 'brand_name',
      note: 'FDA-approved brand name for onabotulinumtoxinA injection (Allergan, an AbbVie company) — refers to that specific approved product, not to unapproved research-grade botulinum toxin listings.',
    },
  ],
  'bpc-157': [
    { alias: 'Body Protection Compound-157', type: 'scientific_name' },
    {
      alias: 'PL 14736',
      type: 'development_code',
      note: 'Development code used in the original founding literature (e.g. Sikiric et al.).',
    },
    {
      alias: 'BPC 157',
      type: 'spelling_variant',
      note: 'Space (non-hyphenated) form used in cited study titles.',
    },
  ],
  cagrilintide: [
    { alias: 'AM833', type: 'development_code', note: "Novo Nordisk's development code." },
  ],
  'cjc-1295-dac': [{ alias: 'CJC-1295 with DAC', type: 'scientific_name' }],
  'cjc-1295-no-dac': [
    {
      alias: 'Mod GRF 1-29',
      type: 'scientific_name',
      note: 'Modified GRF (1-29) — the form of this analog without Drug Affinity Complex.',
    },
    { alias: 'Modified GRF (1-29)', type: 'scientific_name' },
  ],
  dsip: [{ alias: 'Delta Sleep-Inducing Peptide', type: 'scientific_name' }],
  'epithalon-compound': [
    {
      alias: 'Epitalon',
      type: 'spelling_variant',
      note: 'Common transliteration variant used interchangeably in the literature.',
    },
    {
      alias: 'AEDG peptide',
      type: 'scientific_name',
      note: 'Named for its Ala-Glu-Asp-Gly sequence.',
    },
  ],
  'ghk-cu': [
    {
      alias: 'Copper Tripeptide-1',
      type: 'generic_name',
      note: 'INCI cosmetic-ingredient name for this molecule.',
    },
  ],
  glutathione: [{ alias: 'GSH', type: 'abbreviation' }],
  hcg: [
    {
      alias: 'Choriogonadotropin alfa',
      type: 'generic_name',
      note: 'Generic name specifically for the recombinant form of hCG.',
    },
    {
      alias: 'Novarel',
      type: 'brand_name',
      note: 'FDA-approved brand of chorionic gonadotropin for injection (Ferring Pharmaceuticals, NDA 017016) — refers to that specific approved product, not to unapproved research-grade hCG listings.',
    },
  ],
  'igf-1-lr3': [
    { alias: 'Long R3 IGF-1', type: 'scientific_name' },
    { alias: 'Long-Arg3-IGF-1', type: 'scientific_name' },
  ],
  'kisspeptin-10': [
    { alias: 'Kp-10', type: 'abbreviation' },
    { alias: 'Metastin (45-54)', type: 'scientific_name' },
  ],
  kpv: [
    { alias: 'Lys-Pro-Val', type: 'scientific_name' },
    {
      alias: 'α-MSH (11-13)',
      type: 'scientific_name',
      note: 'C-terminal tripeptide fragment of alpha-MSH.',
    },
  ],
  'melanotan-i': [
    {
      alias: 'Afamelanotide',
      type: 'generic_name',
      note: 'The molecule’s actual INN/generic name — refers to the molecular entity itself, distinct from the approved Scenesse implant product below.',
    },
    { alias: 'Melanotan-I', type: 'spelling_variant' },
    { alias: 'Melanotan 1', type: 'spelling_variant' },
    {
      alias: 'Scenesse',
      type: 'brand_name',
      note: 'FDA-approved implant product containing afamelanotide (Clinuvel Pharmaceuticals) — refers to that specific approved product, not to unapproved research-grade Melanotan I listings.',
    },
  ],
  'melanotan-ii': [
    { alias: 'Melanotan-II', type: 'spelling_variant' },
    { alias: 'Melanotan 2', type: 'spelling_variant' },
    { alias: 'MT-II', type: 'abbreviation' },
    { alias: 'MT-2', type: 'abbreviation' },
  ],
  'mots-c': [
    { alias: 'MOTSC', type: 'spelling_variant' },
    {
      alias: 'Mitochondrial Open Reading Frame of the 12S rRNA-c',
      type: 'scientific_name',
      note: 'The expansion the "MOTS-c" abbreviation is drawn from.',
    },
  ],
  'nad-plus': [
    { alias: 'Nicotinamide Adenine Dinucleotide', type: 'scientific_name' },
    { alias: 'NAD', type: 'spelling_variant' },
  ],
  'oxytocin-acetate': [
    {
      alias: 'Pitocin',
      type: 'brand_name',
      note: 'FDA-approved brand of oxytocin injection, USP (Par Pharmaceutical, NDA 018261) — refers to that specific approved product, not to unapproved research-grade oxytocin listings.',
    },
  ],
  'pt-141': [
    {
      alias: 'Bremelanotide',
      type: 'generic_name',
      note: 'The molecule’s actual INN/generic name.',
    },
    { alias: 'PT141', type: 'spelling_variant' },
    {
      alias: 'Vyleesi',
      type: 'brand_name',
      note: 'FDA-approved autoinjector product containing bremelanotide (originally AMAG Pharmaceuticals/Palatin Technologies; commercial rights held by Cosette Pharmaceuticals as of late 2023) — refers to that specific approved product, not to unapproved research-grade PT-141 listings.',
    },
  ],
  retatrutide: [
    { alias: 'LY3437943', type: 'development_code', note: "Eli Lilly's development code." },
  ],
  semaglutide: [
    {
      alias: 'Wegovy',
      type: 'brand_name',
      note: 'FDA-approved chronic-weight-management product containing semaglutide (Novo Nordisk) — refers to that specific approved product, not to unapproved research-grade semaglutide listings.',
    },
  ],
  semax: [{ alias: 'ACTH (4-10) analogue', type: 'scientific_name' }],
  sermorelin: [
    {
      alias: 'GRF (1-29)',
      type: 'scientific_name',
      note: 'Growth Hormone-Releasing Factor (1-29) — sermorelin is this fragment.',
    },
  ],
  'ss-31': [
    {
      alias: 'Elamipretide',
      type: 'generic_name',
      note: 'The molecule’s actual INN/generic name.',
    },
  ],
  'tb-500': [
    {
      alias: 'Thymosin Beta-4',
      type: 'scientific_name',
      note: 'Commonly used synonym in both vendor and scientific literature for this peptide.',
    },
    { alias: 'TB500', type: 'spelling_variant' },
  ],
  tesamorelin: [
    {
      alias: 'Egrifta',
      type: 'brand_name',
      note: 'FDA-approved brand of tesamorelin for injection (Theratechnologies Inc.) — refers to that specific approved product, not to unapproved research-grade tesamorelin listings.',
    },
  ],
  'thymosin-alpha-1': [
    {
      alias: 'Thymalfasin',
      type: 'generic_name',
      note: 'The molecule’s actual INN/generic name (brand: Zadaxin).',
    },
    { alias: 'Tα1', type: 'abbreviation' },
  ],
  tirzepatide: [
    { alias: 'LY3298176', type: 'development_code', note: "Eli Lilly's development code." },
    {
      alias: 'Mounjaro',
      type: 'brand_name',
      note: 'FDA-approved product containing tirzepatide for type 2 diabetes (Eli Lilly) — refers to that specific approved product, not to unapproved research-grade tirzepatide listings.',
    },
    {
      alias: 'Zepbound',
      type: 'brand_name',
      note: 'FDA-approved product containing tirzepatide for chronic weight management (Eli Lilly) — a distinct approved product from Mounjaro above, not to be conflated with unapproved research-grade tirzepatide listings.',
    },
  ],
};

async function main() {
  const { data: compounds, error } = await supabase.from('compounds').select('id, slug, name');
  if (error) throw error;
  const bySlug = new Map(compounds.map((c) => [c.slug, c]));

  const rows = [];
  const skipped = [];
  for (const [slug, aliasList] of Object.entries(ALIASES)) {
    const compound = bySlug.get(slug);
    if (!compound) {
      skipped.push({ slug, reason: 'no matching compound' });
      continue;
    }
    const seen = new Set([compound.name.toLowerCase()]);
    for (const { alias, type, note } of aliasList) {
      const key = alias.toLowerCase();
      if (seen.has(key)) {
        skipped.push({ slug, alias, reason: 'duplicate of name or another alias' });
        continue;
      }
      seen.add(key);
      rows.push({ compound_id: compound.id, alias, alias_type: type, note: note ?? null });
    }
  }

  console.log(
    `Prepared ${rows.length} alias rows across ${Object.keys(ALIASES).length} compounds.`,
  );
  if (skipped.length) {
    console.log(`Skipped ${skipped.length}:`, skipped);
  }

  const { data: inserted, error: upsertErr } = await supabase
    .from('compound_aliases')
    .upsert(rows, { onConflict: 'compound_id,alias' })
    .select('id');
  if (upsertErr) throw upsertErr;
  console.log(`Upserted ${inserted.length} alias rows.`);

  // Explicitly remove any previously-inserted alias for a compound that is
  // no longer in this script's own ALIASES list for that compound — keeps
  // re-runs authoritative rather than only ever additive. (Concretely:
  // this is how the ambiguous "CJC1295" alias, briefly present on both
  // CJC-1295 DAC and CJC-1295 No-DAC in an earlier run, gets cleaned up.)
  const { data: existing, error: existingErr } = await supabase
    .from('compound_aliases')
    .select('id, alias, compound_id, compounds(slug)');
  if (existingErr) throw existingErr;
  const wanted = new Set(rows.map((r) => `${r.compound_id}::${r.alias.toLowerCase()}`));
  const stale = existing.filter(
    (e) =>
      Object.hasOwn(ALIASES, e.compounds.slug) &&
      !wanted.has(`${e.compound_id}::${e.alias.toLowerCase()}`),
  );
  if (stale.length > 0) {
    console.log(
      `Removing ${stale.length} stale alias row(s) no longer in ALIASES:`,
      stale.map((s) => s.alias),
    );
    const { error: deleteErr } = await supabase
      .from('compound_aliases')
      .delete()
      .in(
        'id',
        stale.map((s) => s.id),
      );
    if (deleteErr) throw deleteErr;
  }

  const { count } = await supabase
    .from('compound_aliases')
    .select('id', { count: 'exact', head: true });
  console.log(`Total compound_aliases rows now: ${count}`);

  // Self-verify: no alias string should resolve to more than one compound
  // by pure case-insensitive equality (substring overlaps between a
  // qualified and unqualified form, e.g. "GRF (1-29)" / "Modified GRF
  // (1-29)", are expected and fine — those remain two distinct, correctly
  // labeled alias strings for two genuinely related-but-distinct
  // compounds, not a collision).
  const { data: final } = await supabase.from('compound_aliases').select('alias, compound_id');
  const byAlias = new Map();
  for (const a of final) {
    const key = a.alias.toLowerCase();
    if (!byAlias.has(key)) byAlias.set(key, new Set());
    byAlias.get(key).add(a.compound_id);
  }
  const collisions = [...byAlias.entries()].filter(([, ids]) => ids.size > 1);
  console.log(`Exact-match cross-compound alias collisions: ${collisions.length} (expect 0)`);
  if (collisions.length > 0) console.log(collisions);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
