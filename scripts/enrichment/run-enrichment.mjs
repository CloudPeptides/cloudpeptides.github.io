#!/usr/bin/env node
/**
 * Research enrichment pipeline — reads the verified per-compound data
 * files in scripts/enrichment/data/*.mjs and writes them into Supabase
 * as draft research content. Run manually, locally, never in CI:
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/enrichment/run-enrichment.mjs [slug ...]
 *
 * With no slugs given, runs the fixed pilot list (bpc-157, semaglutide,
 * retatrutide, ghk-cu, semax). Pass one or more slugs to run a subset —
 * this script never auto-discovers every file in data/, so no compound
 * is ever touched without being explicitly named here or on the CLI.
 *
 * The service-role key is read from the environment only — never
 * hardcoded, never committed, never logged.
 *
 * Guarantees enforced by this script (not just documented):
 *  - A compound is only ever touched if it already exists AND is
 *    currently status='draft'. Anything else is a hard error for that
 *    compound (skipped, reported, non-zero exit) — never silently
 *    coerced.
 *  - No compound's status is ever changed. The only write to the
 *    `compounds` row itself is a no-op-shaped UPDATE (merging a
 *    provenance marker into raw_import_metadata) whose entire purpose
 *    is to fire the existing compounds_record_revision trigger so a
 *    real content_revisions snapshot is captured — see
 *    supabase/migrations/20260806144906_functions_triggers.sql.
 *  - Sources are deduplicated before insert: first by DOI/PMID/NCT
 *    number against the globally-unique source_identifiers table, then
 *    (for sources with no identifiers, e.g. FDA calendar pages) by exact
 *    URL — so the same real-world source referenced from two different
 *    compound files (e.g. the FDA PCAC meeting page, cited by both
 *    bpc-157.mjs and semax.mjs) reuses one sources row instead of
 *    duplicating it.
 *  - Re-running this script is idempotent per compound: a compound
 *    whose raw_import_metadata already carries an `enrichment_pilot`
 *    marker is skipped entirely (reported as 'already_enriched'), so
 *    claims/regulatory_records are never doubled by a repeat run.
 *  - A data file may also declare `legacyReconciliations` (see
 *    schema.mjs): each entry updates one pre-existing, DB-verified legacy
 *    claim's evidence_quality/quality_rationale/interpretation_status and
 *    links it to newly-verified sources, without ever touching that
 *    claim's original `statement` text. Also idempotent — re-running
 *    checks for an existing claim_sources link before inserting.
 *  - Reconciliation-only closeout passes: if a compound was already
 *    fully enriched in an earlier run (its already_enriched marker is
 *    set) but its data file now declares NEW or REVISED
 *    legacyReconciliations, the pipeline re-enters that compound in
 *    "reconciliation_only" mode — sources are (re-)resolved (safe,
 *    dedup'd, zero new inserts for already-existing ones), but the
 *    claims/regulatoryRecords arrays are NOT re-inserted (they already
 *    exist from the first pass), and only the legacyReconciliations are
 *    processed. This is how a compound's legacy-claim reconciliation can
 *    be revisited in a later closeout without duplicating its sources,
 *    claims, or regulatory records. The compound's provenance metadata
 *    preserves the original enrichment pass's counts and appends each
 *    reconciliation pass under `reconciliation_passes`, so nothing about
 *    the original run is lost or overwritten.
 */
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

const PILOT_SLUGS = ['bpc-157', 'semaglutide', 'retatrutide', 'ghk-cu', 'semax'];
// NOTE: keep this value stable across the whole rollout (pilot + every
// later batch) — the 5 pilot compounds already have this exact string
// stored in raw_import_metadata.enrichment_pilot.run_tag, and changing it
// would break the already-enriched idempotency check for them (the
// pipeline would treat them as un-enriched and duplicate their claims).
const ENRICHMENT_RUN_TAG = 'research-enrichment-pilot-2026-08';

async function loadDataFile(slug) {
  const mod = await import(`./data/${slug}.mjs`);
  const data = mod.default;
  if (!data || data.slug !== slug) {
    throw new Error(
      `scripts/enrichment/data/${slug}.mjs missing or slug mismatch (expected "${slug}")`,
    );
  }
  return data;
}

/** Find an existing sources row for this entry, by identifier first, then by exact URL. */
async function findExistingSourceId(entry) {
  const ids = entry.identifiers || {};
  const identifierChecks = [
    ids.doi && ['doi', ids.doi],
    ids.pmid && ['pmid', ids.pmid],
    ids.nctNumber && ['nct_number', ids.nctNumber],
  ].filter(Boolean);

  for (const [identifierType, identifierValue] of identifierChecks) {
    const { data, error } = await supabase
      .from('source_identifiers')
      .select('source_id')
      .eq('identifier_type', identifierType)
      .eq('identifier_value', identifierValue)
      .maybeSingle();
    if (error)
      throw new Error(
        `source_identifiers lookup failed for ${identifierType}=${identifierValue}: ${error.message}`,
      );
    if (data) return data.source_id;
  }

  if (identifierChecks.length === 0 && entry.url) {
    const { data, error } = await supabase
      .from('sources')
      .select('id')
      .eq('url', entry.url)
      .maybeSingle();
    if (error) throw new Error(`sources URL lookup failed for ${entry.url}: ${error.message}`);
    if (data) return data.id;
  }

  return null;
}

/** Insert a source (and its study, if any, and its identifiers), or reuse an existing one. */
async function upsertSource(entry, log) {
  const existingId = await findExistingSourceId(entry);
  if (existingId) {
    log.sourcesReused++;
    return { id: existingId, reused: true };
  }

  let studyId = null;
  if (entry.study) {
    const s = entry.study;
    const { data: studyRow, error: studyError } = await supabase
      .from('studies')
      .insert({
        study_design: s.studyDesign,
        population: s.population ?? null,
        sample_size: s.sampleSize ?? null,
        comparator: s.comparator ?? null,
        intervention: s.intervention ?? null,
        route: s.route ?? null,
        duration: s.duration ?? null,
        primary_outcomes: s.primaryOutcomes ?? null,
        results_summary: s.resultsSummary ?? null,
        limitations: s.limitations ?? null,
        registration_number: s.registrationNumber ?? null,
        peer_review_status: s.peerReviewStatus ?? null,
      })
      .select('id')
      .single();
    if (studyError)
      throw new Error(`studies insert failed for "${entry.title}": ${studyError.message}`);
    studyId = studyRow.id;
    log.studiesInserted++;
  }

  const { data: sourceRow, error: sourceError } = await supabase
    .from('sources')
    .insert({
      source_type: entry.sourceType,
      study_id: studyId,
      title: entry.title,
      url: entry.url,
      publisher_or_agency: entry.publisherOrAgency ?? null,
      publication_date: normalizeDate(entry.publicationDate),
    })
    .select('id')
    .single();
  if (sourceError)
    throw new Error(`sources insert failed for "${entry.title}": ${sourceError.message}`);

  const ids = entry.identifiers || {};
  const identifierRows = [
    ids.doi && { source_id: sourceRow.id, identifier_type: 'doi', identifier_value: ids.doi },
    ids.pmid && { source_id: sourceRow.id, identifier_type: 'pmid', identifier_value: ids.pmid },
    ids.nctNumber && {
      source_id: sourceRow.id,
      identifier_type: 'nct_number',
      identifier_value: ids.nctNumber,
    },
  ].filter(Boolean);
  if (identifierRows.length > 0) {
    const { error: idError } = await supabase.from('source_identifiers').insert(identifierRows);
    if (idError)
      throw new Error(`source_identifiers insert failed for "${entry.title}": ${idError.message}`);
  }

  log.sourcesInserted++;
  return { id: sourceRow.id, reused: false };
}

/** publicationDate may be 'YYYY', 'YYYY-MM', or 'YYYY-MM-DD'; the DB column is `date`. */
function normalizeDate(value) {
  if (!value) return null;
  if (/^\d{4}$/.test(value)) return `${value}-01-01`;
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
  return value;
}

async function reconcileLegacyClaim(entry, sourceKeyToId, log) {
  const { data: existing, error: fetchError } = await supabase
    .from('claims')
    .select('id, statement')
    .eq('id', entry.legacyClaimId)
    .maybeSingle();
  if (fetchError)
    throw new Error(`legacy claim lookup failed for ${entry.legacyClaimId}: ${fetchError.message}`);
  if (!existing)
    throw new Error(
      `legacy claim id ${entry.legacyClaimId} not found — refusing to reconcile a nonexistent row`,
    );
  if (!existing.statement.startsWith(entry.legacyStatementExcerpt.slice(0, 40))) {
    throw new Error(
      `legacy claim ${entry.legacyClaimId} statement does not match the recorded excerpt — refusing to reconcile a possibly-wrong row (expected prefix "${entry.legacyStatementExcerpt.slice(0, 40)}...", found "${existing.statement.slice(0, 40)}...")`,
    );
  }

  const dated = `[Reconciliation ${new Date().toISOString().slice(0, 10)}, disposition: ${entry.disposition}] ${entry.rationale}`;
  const { error: updateError } = await supabase
    .from('claims')
    .update({
      evidence_quality: entry.evidenceQuality ?? null,
      quality_rationale: dated,
      interpretation_status: entry.interpretationStatus,
    })
    .eq('id', entry.legacyClaimId);
  if (updateError)
    throw new Error(
      `legacy claim update failed for ${entry.legacyClaimId}: ${updateError.message}`,
    );
  log.legacyClaimsReconciled++;
  log.legacyDispositions[entry.disposition] = (log.legacyDispositions[entry.disposition] || 0) + 1;

  for (const link of entry.sources) {
    const sourceId = sourceKeyToId.get(link.sourceKey);
    if (!sourceId)
      throw new Error(`legacy reconciliation references unknown sourceKey "${link.sourceKey}"`);
    const { data: existingLink } = await supabase
      .from('claim_sources')
      .select('claim_id')
      .eq('claim_id', entry.legacyClaimId)
      .eq('source_id', sourceId)
      .maybeSingle();
    if (existingLink) continue; // idempotent re-run
    const { error: linkError } = await supabase.from('claim_sources').insert({
      claim_id: entry.legacyClaimId,
      source_id: sourceId,
      relationship: link.relationship,
      locator: link.locator ?? null,
    });
    if (linkError)
      throw new Error(
        `claim_sources insert failed for legacy claim ${entry.legacyClaimId}: ${linkError.message}`,
      );
    log.claimSourcesInserted++;
  }
}

async function enrichCompound(slug) {
  const log = {
    slug,
    status: 'pending',
    sourcesInserted: 0,
    sourcesReused: 0,
    studiesInserted: 0,
    claimsInserted: 0,
    claimSourcesInserted: 0,
    regulatoryRecordsInserted: 0,
    legacyClaimsReconciled: 0,
    legacyDispositions: {},
    errors: [],
  };

  let data;
  try {
    data = await loadDataFile(slug);
  } catch (err) {
    log.status = 'error';
    log.errors.push(`data file load: ${err.message}`);
    return log;
  }

  const { data: compound, error: compoundError } = await supabase
    .from('compounds')
    .select('id, status, raw_import_metadata')
    .eq('slug', slug)
    .maybeSingle();

  if (compoundError) {
    log.status = 'error';
    log.errors.push(`compound lookup failed: ${compoundError.message}`);
    return log;
  }
  if (!compound) {
    log.status = 'error';
    log.errors.push(
      `no compound row found for slug "${slug}" — expected an existing draft compound, not created by this pipeline`,
    );
    return log;
  }
  if (compound.status !== 'draft') {
    log.status = 'error';
    log.errors.push(
      `compound status is "${compound.status}", not "draft" — refusing to touch a non-draft compound`,
    );
    return log;
  }
  // A compound already fully enriched (sources/claims/regulatory records
  // inserted in an earlier run) is only re-entered if its data file now
  // declares legacyReconciliations — this supports closeout passes that
  // reconcile a compound's remaining legacy claims (or revise an existing
  // reconciliation's disposition) without re-inserting anything that's
  // already there. A compound with nothing new to reconcile is still
  // skipped entirely, exactly as before.
  const alreadyEnriched =
    compound.raw_import_metadata?.enrichment_pilot?.run_tag === ENRICHMENT_RUN_TAG;
  if (alreadyEnriched && !(data.legacyReconciliations && data.legacyReconciliations.length > 0)) {
    log.status = 'already_enriched';
    return log;
  }

  const compoundId = compound.id;
  const sourceKeyToId = new Map();

  try {
    // Sources are always processed (even in reconciliation-only mode) —
    // legacyReconciliations reference sourceKeys, and upsertSource's
    // dedup-by-identifier logic means re-declaring an already-existing
    // source here is a safe, zero-new-rows no-op (reused, not inserted).
    for (const entry of data.sources) {
      const { id } = await upsertSource(entry, log);
      sourceKeyToId.set(entry.key, id);
    }

    if (!alreadyEnriched) {
      for (let i = 0; i < data.claims.length; i++) {
        const claim = data.claims[i];
        const { data: claimRow, error: claimError } = await supabase
          .from('claims')
          .insert({
            compound_id: compoundId,
            content_section: claim.contentSection,
            statement: claim.statement,
            evidence_quality: claim.evidenceQuality ?? null,
            quality_rationale: claim.qualityRationale ?? null,
            interpretation_status: claim.interpretationStatus,
            display_order: i,
            status: 'draft',
          })
          .select('id')
          .single();
        if (claimError)
          throw new Error(
            `claim insert failed ("${claim.statement.slice(0, 60)}..."): ${claimError.message}`,
          );
        log.claimsInserted++;

        for (const link of claim.sources) {
          const sourceId = sourceKeyToId.get(link.sourceKey);
          if (!sourceId) throw new Error(`claim references unknown sourceKey "${link.sourceKey}"`);
          const { error: linkError } = await supabase.from('claim_sources').insert({
            claim_id: claimRow.id,
            source_id: sourceId,
            relationship: link.relationship,
            locator: link.locator ?? null,
          });
          if (linkError) throw new Error(`claim_sources insert failed: ${linkError.message}`);
          log.claimSourcesInserted++;
        }
      }

      for (const record of data.regulatoryRecords) {
        const sourceId = sourceKeyToId.get(record.sourceKey);
        if (!sourceId)
          throw new Error(`regulatory record references unknown sourceKey "${record.sourceKey}"`);
        const { error: regError } = await supabase.from('regulatory_records').insert({
          compound_id: compoundId,
          agency: record.agency,
          jurisdiction: record.jurisdiction,
          formulation: record.formulation ?? null,
          indication: record.indication ?? null,
          regulatory_status: record.regulatoryStatus,
          effective_date: record.effectiveDate ?? null,
          status_change_date: record.statusChangeDate ?? null,
          source_id: sourceId,
          notes: record.notes ?? null,
        });
        if (regError) throw new Error(`regulatory_records insert failed: ${regError.message}`);
        log.regulatoryRecordsInserted++;
      }
    }

    for (const reconciliation of data.legacyReconciliations || []) {
      await reconcileLegacyClaim(reconciliation, sourceKeyToId, log);
    }

    // Touch the compound row (status re-asserted as 'draft' explicitly)
    // purely to fire compounds_record_revision and capture a real
    // content_revisions snapshot, per the provenance requirement. In
    // reconciliation-only mode this preserves the original enrichment
    // pass's recorded counts (sources/claims/regulatory records already
    // inserted then) rather than overwriting them with this pass's
    // (partial or zero) numbers, and appends this pass's own record
    // under reconciliation_passes so both are visible in history.
    const priorMarker = compound.raw_import_metadata?.enrichment_pilot;
    const thisPassRecord = {
      run_at: new Date().toISOString(),
      mode: alreadyEnriched ? 'reconciliation_only' : 'full_enrichment',
      sources_added: log.sourcesInserted,
      sources_reused: log.sourcesReused,
      claims_added: log.claimsInserted,
      regulatory_records_added: log.regulatoryRecordsInserted,
      legacy_claims_reconciled: log.legacyClaimsReconciled,
      legacy_dispositions: log.legacyDispositions,
    };
    const updatedMetadata = {
      ...(compound.raw_import_metadata || {}),
      enrichment_pilot: alreadyEnriched
        ? {
            ...priorMarker,
            reconciliation_passes: [...(priorMarker?.reconciliation_passes || []), thisPassRecord],
          }
        : { run_tag: ENRICHMENT_RUN_TAG, ...thisPassRecord },
    };
    const { error: touchError } = await supabase
      .from('compounds')
      .update({ status: 'draft', raw_import_metadata: updatedMetadata })
      .eq('id', compoundId);
    if (touchError) throw new Error(`compound provenance touch failed: ${touchError.message}`);

    log.status = alreadyEnriched ? 'reconciliation_only' : 'success';
  } catch (err) {
    log.status = 'error';
    log.errors.push(err.message);
  }

  return log;
}

async function main() {
  const requestedSlugs = process.argv.slice(2);
  const slugs = requestedSlugs.length > 0 ? requestedSlugs : PILOT_SLUGS;

  console.log(`Running enrichment pipeline for: ${slugs.join(', ')}\n`);

  const results = [];
  for (const slug of slugs) {
    console.log(`--- ${slug} ---`);
    const log = await enrichCompound(slug);
    results.push(log);
    console.log(JSON.stringify(log, null, 2));
  }

  // Live-DB verification: confirm zero touched compounds became non-draft.
  const { data: statusCheck, error: statusCheckError } = await supabase
    .from('compounds')
    .select('slug, status')
    .in('slug', slugs);
  if (statusCheckError) {
    console.error(`Post-run status verification query failed: ${statusCheckError.message}`);
  } else {
    const nonDraft = statusCheck.filter((c) => c.status !== 'draft');
    console.log(
      `\nPost-run status check: ${statusCheck.length} compounds queried, ${nonDraft.length} non-draft.`,
    );
    if (nonDraft.length > 0) {
      console.error(
        `FATAL: compounds became non-draft: ${nonDraft.map((c) => `${c.slug}=${c.status}`).join(', ')}`,
      );
      process.exitCode = 1;
    }
  }

  const errored = results.filter((r) => r.status === 'error');
  console.log(`\nSummary: ${results.length} compounds processed, ${errored.length} errored.`);
  if (errored.length > 0) {
    console.error(
      'One or more compounds errored — review output above before considering the pilot complete.',
    );
    process.exitCode = 1;
  }

  return results;
}

main().catch((err) => {
  console.error('Enrichment pipeline failed:', err);
  process.exit(1);
});
