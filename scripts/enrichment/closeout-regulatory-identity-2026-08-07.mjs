#!/usr/bin/env node
/**
 * One-time closeout script (2026-08-07) — pushes the corrected
 * molecule-vs-approved-product regulatory reasoning into the live
 * database for the 8 compounds affected: botulinum-toxin, hcg,
 * melanotan-i, oxytocin-acetate, pt-141, ss-31, tesamorelin, tirzepatide.
 *
 * Context: the original batch runs authored a `claims` entry with
 * contentSection='regulatory' (or, for tesamorelin, a 'summary' claim)
 * describing each compound's real FDA-approved drug product, and a
 * matching `regulatoryRecords` entry. Those entries have since been
 * revised in each compound's own data file (scripts/enrichment/data/*.mjs)
 * to add the manufacturer name and an explicit molecule-vs-approved-
 * product distinction. Because those are PIPELINE-AUTHORED rows (not
 * pre-existing legacy site content), correcting them for accuracy is
 * ordinary editorial correction — not the "never touch legacy statement
 * text" rule, which protects the original site's own wording, not this
 * pipeline's own prior output.
 *
 * run-enrichment.mjs has no UPDATE path for previously-inserted `claims`
 * or `regulatory_records` rows (by design — claims/regulatoryRecords are
 * insert-only, to avoid ever silently duplicating or clobbering
 * inserted content on a normal re-run). This script is therefore a
 * deliberate, narrow, one-time exception: it imports each compound's
 * OWN already-corrected data file (so there is exactly one place the
 * corrected text lives — this script does not hand-transcribe anything)
 * and UPDATEs the specific, already-known claim/regulatory_records rows
 * by id, with a safety check against the row's prior text before
 * writing, so it can never silently patch the wrong row.
 *
 * Idempotent: re-running matches on the NEW text too (already applied),
 * so it detects "already applied" and skips with no further writes.
 *
 * Run manually, locally, never in CI:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/enrichment/closeout-regulatory-identity-2026-08-07.mjs
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

// Each entry: which compound file to pull corrected text from, which
// claims-array predicate identifies the right claim, the known live
// claim id, and the previously-known (pre-correction) text prefix used
// as a safety check.
const CLAIM_UPDATES = [
  {
    slug: 'botulinum-toxin',
    claimId: 'ead5ea2d-b8e4-4e32-a98a-13d25566a022',
    findClaim: (claims) => claims.find((c) => c.contentSection === 'regulatory'),
    oldPrefix:
      'Botulinum toxin type A (onabotulinumtoxinA, brand name Botox) was first FDA-approved',
  },
  {
    slug: 'hcg',
    claimId: '8e44b72f-cea5-4334-876b-66931d833d87',
    findClaim: (claims) => claims.find((c) => c.contentSection === 'regulatory'),
    oldPrefix: 'HCG (e.g. Novarel, and other brands) is FDA-approved',
  },
  {
    slug: 'melanotan-i',
    claimId: 'c032b117-9c0f-49f7-9f32-22efe475cc4a',
    findClaim: (claims) => claims.find((c) => c.contentSection === 'regulatory'),
    oldPrefix: 'Melanotan I is the research name for afamelanotide',
  },
  {
    slug: 'oxytocin-acetate',
    claimId: 'e56b9c04-dacb-4e63-9288-921c1231ef66',
    findClaim: (claims) => claims.find((c) => c.contentSection === 'regulatory'),
    oldPrefix: 'Oxytocin is FDA-approved (brand name Pitocin, and generics) ONLY',
  },
  {
    slug: 'pt-141',
    claimId: '0ced6713-ea82-4a38-a405-9ead168cb86c',
    findClaim: (claims) => claims.find((c) => c.contentSection === 'regulatory'),
    oldPrefix:
      'PT-141 is the research name for bremelanotide, a melanocortin receptor agonist that the FDA approved (brand name Vyleesi) for',
  },
  {
    slug: 'ss-31',
    claimId: 'e78e903a-8a6f-4878-ac36-32e42f9278e9',
    findClaim: (claims) => claims.find((c) => c.contentSection === 'regulatory'),
    oldPrefix: 'Elamipretide received FDA accelerated approval',
  },
  {
    slug: 'tesamorelin',
    claimId: 'd94144ec-090e-4a0a-8e5a-50324d826715',
    findClaim: (claims) =>
      claims.find((c) =>
        c.statement.startsWith(
          'In a randomized, placebo-controlled human trial of HIV-infected patients',
        ),
      ),
    oldPrefix: 'In a randomized, placebo-controlled human trial of HIV-infected patients',
  },
  {
    slug: 'tirzepatide',
    claimId: '6cf64297-d30d-4d93-bbed-348ebe320f3c',
    findClaim: (claims) => claims.find((c) => c.contentSection === 'regulatory'),
    oldPrefix: 'Tirzepatide is FDA-approved for THREE indications',
  },
];

// Each entry: compound slug, the known regulatory_records row id, and a
// predicate to find the matching entry in the file's regulatoryRecords
// array (by indication substring, since formulation text itself changed).
const REGULATORY_RECORD_UPDATES = [
  {
    slug: 'botulinum-toxin',
    recordId: '17ec52a4-98b2-497d-b2db-9b33c733adb8',
    findRecord: (recs) => recs.find((r) => r.indication.includes('essential blepharospasm')),
  },
  {
    slug: 'hcg',
    recordId: 'd726f832-956f-496a-abae-af01e4f72083',
    findRecord: (recs) => recs.find((r) => r.indication.includes('Induction of ovulation')),
  },
  {
    slug: 'melanotan-i',
    recordId: 'faee5d51-883b-4dfb-92c8-c425836d5e35',
    findRecord: (recs) => recs.find((r) => r.indication.includes('erythropoietic protoporphyria')),
  },
  {
    slug: 'oxytocin-acetate',
    recordId: 'b3b2bdee-c241-48f1-9a17-2cb6480f53f9',
    findRecord: (recs) =>
      recs.find((r) => r.indication.includes('Induction/augmentation of labor')),
  },
  {
    slug: 'pt-141',
    recordId: '8057b44d-fe50-4ee6-b16b-8f82aa38b027',
    findRecord: (recs) =>
      recs.find((r) => r.indication.includes('Hypoactive sexual desire disorder')),
  },
  {
    slug: 'ss-31',
    recordId: '898e494c-85b2-49ea-abf9-2f13273a2d2f',
    findRecord: (recs) => recs.find((r) => r.indication.includes('Barth syndrome')),
  },
  {
    slug: 'tesamorelin',
    recordId: '112544fe-748e-40d6-9318-080f03a0d9f2',
    findRecord: (recs) =>
      recs.find((r) => r.indication.includes('Reduction of excess abdominal fat')),
  },
  {
    slug: 'tirzepatide',
    recordId: 'e35da877-2571-4a0c-8f88-91e2f6174b47',
    findRecord: (recs) => recs.find((r) => r.indication.includes('type 2 diabetes')),
  },
  {
    slug: 'tirzepatide',
    recordId: '3617a6e6-d079-4afe-8d21-8f9bdcad2344',
    findRecord: (recs) => recs.find((r) => r.indication.includes('Chronic weight management')),
  },
  {
    slug: 'tirzepatide',
    recordId: '17e419eb-2b00-4b52-b4ce-c16103443386',
    findRecord: (recs) => recs.find((r) => r.indication.includes('obstructive sleep apnea')),
  },
];

async function main() {
  const dataBySlug = new Map();
  const slugs = [
    ...new Set([
      ...CLAIM_UPDATES.map((u) => u.slug),
      ...REGULATORY_RECORD_UPDATES.map((u) => u.slug),
    ]),
  ];
  for (const slug of slugs) {
    const mod = await import(`./data/${slug}.mjs`);
    dataBySlug.set(slug, mod.default);
  }

  let claimsUpdated = 0;
  let claimsAlreadyCorrect = 0;
  let regRecordsUpdated = 0;
  let regRecordsAlreadyCorrect = 0;
  const errors = [];

  for (const u of CLAIM_UPDATES) {
    const data = dataBySlug.get(u.slug);
    const correctedClaim = u.findClaim(data.claims);
    if (!correctedClaim) {
      errors.push(`${u.slug}: could not find the expected claim in the data file`);
      continue;
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('claims')
      .select('id, statement')
      .eq('id', u.claimId)
      .maybeSingle();
    if (fetchErr) {
      errors.push(`${u.slug}: claim fetch failed: ${fetchErr.message}`);
      continue;
    }
    if (!existing) {
      errors.push(`${u.slug}: claim id ${u.claimId} not found`);
      continue;
    }
    if (existing.statement === correctedClaim.statement) {
      claimsAlreadyCorrect++;
      continue;
    }
    if (!existing.statement.startsWith(u.oldPrefix)) {
      errors.push(
        `${u.slug}: claim ${u.claimId} current text doesn't match expected old OR new text — refusing to overwrite an unexpected row (found: "${existing.statement.slice(0, 80)}...")`,
      );
      continue;
    }

    const { error: updateErr } = await supabase
      .from('claims')
      .update({
        statement: correctedClaim.statement,
        evidence_quality: correctedClaim.evidenceQuality ?? null,
        quality_rationale: correctedClaim.qualityRationale ?? null,
        interpretation_status: correctedClaim.interpretationStatus,
      })
      .eq('id', u.claimId);
    if (updateErr) {
      errors.push(`${u.slug}: claim update failed: ${updateErr.message}`);
      continue;
    }
    claimsUpdated++;
    console.log(`  updated claim ${u.claimId} (${u.slug})`);
  }

  for (const u of REGULATORY_RECORD_UPDATES) {
    const data = dataBySlug.get(u.slug);
    const correctedRecord = u.findRecord(data.regulatoryRecords);
    if (!correctedRecord) {
      errors.push(`${u.slug}: could not find the expected regulatory record in the data file`);
      continue;
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('regulatory_records')
      .select('id, formulation, notes')
      .eq('id', u.recordId)
      .maybeSingle();
    if (fetchErr) {
      errors.push(`${u.slug}: regulatory_records fetch failed: ${fetchErr.message}`);
      continue;
    }
    if (!existing) {
      errors.push(`${u.slug}: regulatory_records id ${u.recordId} not found`);
      continue;
    }
    if (
      existing.notes === (correctedRecord.notes ?? null) &&
      existing.formulation === (correctedRecord.formulation ?? null)
    ) {
      regRecordsAlreadyCorrect++;
      continue;
    }

    const { error: updateErr } = await supabase
      .from('regulatory_records')
      .update({
        formulation: correctedRecord.formulation ?? null,
        indication: correctedRecord.indication ?? null,
        effective_date: correctedRecord.effectiveDate ?? null,
        notes: correctedRecord.notes ?? null,
      })
      .eq('id', u.recordId);
    if (updateErr) {
      errors.push(`${u.slug}: regulatory_records update failed: ${updateErr.message}`);
      continue;
    }
    regRecordsUpdated++;
    console.log(`  updated regulatory_records ${u.recordId} (${u.slug})`);
  }

  console.log(`\nClaims: ${claimsUpdated} updated, ${claimsAlreadyCorrect} already correct.`);
  console.log(
    `Regulatory records: ${regRecordsUpdated} updated, ${regRecordsAlreadyCorrect} already correct.`,
  );
  if (errors.length > 0) {
    console.error(`\n${errors.length} error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Closeout script failed:', err);
  process.exit(1);
});
