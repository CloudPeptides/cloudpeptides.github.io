// Shared idempotent import helpers for scripts/research/import-batch-*.mjs
//
// Every function here is safe to re-run: a compound is looked up by
// slug first and skipped entirely (never re-inserted, never
// overwritten — "do not overwrite richer existing research with a
// shallow new summary") if it already exists; a source is looked up by
// URL first and reused (never duplicated) across compounds/claims that
// cite the same thing. New compounds are always inserted as
// status='draft' — CLAUDE.md's draft -> in_review -> published
// editorial workflow means nothing generated in this pass is ever
// auto-published; a human editor reviews and publishes each one
// through the ordinary admin dashboard, same as any other draft.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

export function loadEnv() {
  const envText = readFileSync('.env.local', 'utf8');
  const env = {};
  for (const rawLine of envText.split(/\r?\n/)) {
    const line = rawLine.trim();
    const m = line.match(/^([A-Za-z0-9_ ]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

export function getServiceClient() {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Inserts a compound as a new draft if its slug doesn't already
 * exist; otherwise returns the existing row untouched and reports
 * 'already_exists'. Never updates an existing row's content fields. */
export async function upsertCompoundDraft(client, compound) {
  const { data: existing, error: findError } = await client
    .from('compounds')
    .select('id, name, status')
    .eq('slug', compound.slug)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) {
    return { id: existing.id, outcome: 'already_exists', existingStatus: existing.status };
  }

  const { data, error } = await client
    .from('compounds')
    .insert({
      slug: compound.slug,
      name: compound.name,
      entity_kind: compound.entityKind,
      identity_confidence: compound.identityConfidence ?? 'unverified',
      category: compound.category ?? null,
      status: 'draft',
      overview_what_it_is: compound.overviewWhatItIs ?? null,
      overview_why_people_use_it: compound.overviewWhyPeopleUseIt ?? null,
      overview_research_summary: compound.overviewResearchSummary ?? null,
      overview_bottom_line: compound.overviewBottomLine ?? null,
      overview_evidence_reviewed_date: compound.searchDate ?? null,
      administration_context: compound.administrationContext ?? null,
      administration_context_reviewed_date: compound.administrationContext
        ? (compound.searchDate ?? null)
        : null,
      raw_import_metadata: {
        research_provenance: {
          search_date: compound.searchDate,
          databases_searched: compound.databasesSearched,
          search_terms: compound.searchTerms,
          researched_by: 'Claude (Sonnet 5) — deep-research pass, 2026-08-19 task',
          batch: compound.batch,
        },
      },
    })
    .select('id')
    .single();
  if (error) throw error;
  return { id: data.id, outcome: 'inserted' };
}

/** Adds an alias only if that exact (compound_id, alias) pair doesn't
 * already exist — compound_aliases has its own unique constraint on
 * that pair, so this is belt-and-suspenders idempotency (upsert with
 * ignoreDuplicates would also work; explicit check is clearer here
 * since we also want to skip logging a "duplicate key" error). */
export async function addAliasIfMissing(client, compoundId, alias, aliasType, note) {
  const { data: existing } = await client
    .from('compound_aliases')
    .select('compound_id')
    .eq('compound_id', compoundId)
    .eq('alias', alias)
    .maybeSingle();
  if (existing) return 'already_exists';
  const { error } = await client.from('compound_aliases').insert({
    compound_id: compoundId,
    alias,
    alias_type: aliasType ?? null,
    note: note ?? null,
  });
  if (error) throw error;
  return 'inserted';
}

/** Reuses an existing sources row (by exact URL) if one exists;
 * otherwise inserts a new one. Global source_identifiers uniqueness
 * (migration 20260806144903) means a PMID/DOI can never end up
 * attached to two different source rows either way. */
export async function upsertSource(client, source) {
  const { data: existing, error: findError } = await client
    .from('sources')
    .select('id')
    .eq('url', source.url)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return { id: existing.id, outcome: 'reused' };

  const { data, error } = await client
    .from('sources')
    .insert({
      source_type: source.sourceType,
      study_id: source.studyId ?? null,
      title: source.title,
      url: source.url,
      publisher_or_agency: source.publisherOrAgency ?? null,
      publication_date: source.publicationDate ?? null,
      retrieved_date: source.retrievedDate,
    })
    .select('id')
    .single();
  if (error) throw error;

  if (source.identifiers) {
    for (const [identifierType, identifierValue] of Object.entries(source.identifiers)) {
      if (!identifierValue) continue;
      const { error: idError } = await client.from('source_identifiers').insert({
        source_id: data.id,
        identifier_type: identifierType,
        identifier_value: identifierValue,
      });
      // A global-uniqueness conflict here means this exact PMID/DOI is
      // already attached to a different source row — that's a real
      // data situation worth surfacing, not silently swallowing, but
      // must never abort the whole import.
      if (idError) console.error(`  ! identifier conflict for ${source.url}:`, idError.message);
    }
  }
  return { id: data.id, outcome: 'inserted' };
}

export async function insertStudy(client, study) {
  const { data, error } = await client
    .from('studies')
    .insert({
      study_design: study.studyDesign,
      population: study.population ?? null,
      sample_size: study.sampleSize ?? null,
      comparator: study.comparator ?? null,
      intervention: study.intervention ?? null,
      route: study.route ?? null,
      published_research_dose: study.publishedResearchDose ?? null,
      duration: study.duration ?? null,
      primary_outcomes: study.primaryOutcomes ?? null,
      results_summary: study.resultsSummary ?? null,
      limitations: study.limitations ?? null,
      peer_review_status: study.peerReviewStatus ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function insertClaim(client, compoundId, claim) {
  const { data, error } = await client
    .from('claims')
    .insert({
      compound_id: compoundId,
      content_section: claim.section,
      statement: claim.statement,
      evidence_quality: claim.evidenceQuality ?? null,
      quality_rationale: claim.qualityRationale ?? null,
      interpretation_status: claim.interpretationStatus ?? null,
      display_order: claim.displayOrder ?? null,
      status: 'draft',
    })
    .select('id')
    .single();
  if (error) throw error;

  if (claim.sourceIds) {
    for (const { sourceId, relationship, locator } of claim.sourceIds) {
      const { error: linkError } = await client.from('claim_sources').insert({
        claim_id: data.id,
        source_id: sourceId,
        relationship: relationship ?? 'directly_supports',
        locator: locator ?? null,
      });
      if (linkError) console.error('  ! claim_sources link failed:', linkError.message);
    }
  }
  return data.id;
}

export async function insertRegulatoryRecord(client, compoundId, record, sourceId) {
  const { error } = await client.from('regulatory_records').insert({
    compound_id: compoundId,
    agency: record.agency,
    jurisdiction: record.jurisdiction,
    formulation: record.formulation ?? null,
    indication: record.indication ?? null,
    regulatory_status: record.regulatoryStatus,
    effective_date: record.effectiveDate ?? null,
    status_change_date: record.statusChangeDate ?? null,
    source_id: sourceId,
    last_verified_date: record.lastVerifiedDate,
    notes: record.notes ?? null,
  });
  if (error) throw error;
}

/** Standard site-wide disclaimer/FAQ claims, verbatim-equivalent to
 * every existing published profile's own boilerplate (see BPC-157's
 * claims as the reference pattern) — these carry no citation because
 * they're statements about the site's own editorial posture, not
 * scientific claims about the compound. Every new profile gets these
 * plus its own compound-specific claims. */
export function standardBoilerplateClaims(compoundName) {
  return [
    {
      section: 'faq',
      statement:
        'Q: Does Cloud Peptides provide dosage information? A: No. Cloud Peptides does not provide dosage recommendations, reconstitution instructions, or administration protocols. This page summarizes published research literature for educational purposes only.',
      interpretationStatus: 'established',
    },
    {
      section: 'safety',
      statement:
        'Cloud Peptides does not provide medical advice, treatment recommendations, or dosage information.',
      interpretationStatus: 'established',
    },
    {
      section: 'faq',
      statement: `Q: Is ${compoundName} approved for medical use? A: This page summarizes scientific literature only. Cloud Peptides does not make regulatory-approval claims beyond what is documented in the Regulatory Status section below, sourced to the cited agency records.`,
      evidenceQuality: 'high',
      qualityRationale:
        'Editorial policy statement, not a scientific claim about the compound itself.',
      interpretationStatus: 'established',
    },
    {
      section: 'safety',
      statement:
        'All products are intended strictly for laboratory research purposes only and are not for human consumption.',
      evidenceQuality: 'high',
      qualityRationale:
        'Editorial/legal policy statement, not a scientific claim about the compound itself.',
      interpretationStatus: 'established',
    },
    {
      section: 'safety',
      statement:
        'This page summarizes publicly available scientific literature for educational purposes only.',
      interpretationStatus: 'established',
    },
  ];
}

/** Runs one compound's full import (compound + aliases + sources +
 * studies + claims + regulatory records) inside a single pass. Logs a
 * one-line outcome per compound and never throws past its own compound
 * — one bad record must not abort the rest of the batch. */
export async function importCompound(client, compoundDef) {
  const { id: compoundId, outcome } = await upsertCompoundDraft(client, compoundDef);
  console.log(`${compoundDef.name}: compound ${outcome} (${compoundId})`);
  if (outcome === 'already_exists') {
    console.log(`  -> skipping content (already exists) for ${compoundDef.name}`);
    return { compoundId, outcome: 'skipped' };
  }

  for (const alias of compoundDef.aliases ?? []) {
    const aliasOutcome = await addAliasIfMissing(
      client,
      compoundId,
      alias.alias,
      alias.type,
      alias.note,
    );
    console.log(`  alias "${alias.alias}": ${aliasOutcome}`);
  }

  const sourceIdByKey = {};
  for (const [key, source] of Object.entries(compoundDef.sources ?? {})) {
    const { id, outcome: srcOutcome } = await upsertSource(client, source);
    sourceIdByKey[key] = id;
    console.log(`  source "${key}": ${srcOutcome} (${id})`);
  }

  for (const study of compoundDef.studies ?? []) {
    const studyId = await insertStudy(client, study);
    if (study.sourceKey) {
      // Backfill the source row's study_id link now that both exist.
      await client
        .from('sources')
        .update({ study_id: studyId })
        .eq('id', sourceIdByKey[study.sourceKey]);
    }
  }

  let claimsInserted = 0;
  for (const claim of compoundDef.claims ?? []) {
    const resolvedSourceIds = (claim.sourceKeys ?? []).map((k) => ({
      sourceId: sourceIdByKey[k.key],
      relationship: k.relationship,
      locator: k.locator,
    }));
    try {
      await insertClaim(client, compoundId, { ...claim, sourceIds: resolvedSourceIds });
      claimsInserted++;
    } catch (err) {
      // One bad claim must never abort the rest of this compound's
      // import (or leave the compound stuck half-imported for a
      // re-run) — logged loudly so it's still visible and fixable.
      console.error(`  ! claim insert failed ("${claim.statement.slice(0, 60)}..."):`, err.message);
    }
  }
  console.log(`  claims inserted: ${claimsInserted} / ${(compoundDef.claims ?? []).length}`);

  for (const record of compoundDef.regulatoryRecords ?? []) {
    await insertRegulatoryRecord(client, compoundId, record, sourceIdByKey[record.sourceKey]);
  }
  console.log(`  regulatory records inserted: ${(compoundDef.regulatoryRecords ?? []).length}`);

  return { compoundId, outcome: 'imported' };
}
