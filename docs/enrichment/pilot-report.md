# Research Enrichment Pilot — Report

**Run date:** 2026-08-06
**Scope:** 5 pilot compounds only (BPC-157, Semaglutide, Retatrutide, GHK-Cu, Semax), per explicit instruction. The remaining ~51 compound records were **not** touched.
**Environment:** Supabase staging project (`cloudpeptides-staging`), via `scripts/enrichment/run-enrichment.mjs`. Production was never touched.
**Status:** Every compound and every claim inserted by this pilot remains `status = 'draft'`. Nothing was published. Nothing existing was deleted, overwritten, or revised — this pilot only *adds* new sources/studies/claims/regulatory records alongside each compound's existing legacy-imported content.

## Pipeline

- `scripts/enrichment/schema.mjs` — JSDoc type contract for a compound's enrichment data, mapped 1:1 to real columns in `supabase/migrations/20260806144903_research_schema.sql`.
- `scripts/enrichment/data/{bpc-157,semaglutide,retatrutide,ghk-cu,semax}.mjs` — the verified, per-compound source/study/claim/regulatory data.
- `scripts/enrichment/run-enrichment.mjs` — the runner. For each compound: verifies it exists and is `status='draft'` (hard error otherwise); deduplicates sources by DOI/PMID/NCT number, then by exact URL for sources with no identifier; inserts studies, sources, source_identifiers, claims, claim_sources, and regulatory_records; then performs a provenance-only `UPDATE` on the compound row (re-asserting `status='draft'`, merging an `enrichment_pilot` marker into `raw_import_metadata`) to fire the existing `compounds_record_revision` trigger and capture a real `content_revisions` snapshot. Idempotent — a compound already carrying this run's marker is skipped, not re-inserted.

Run command:
```
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/enrichment/run-enrichment.mjs
```

## Results per compound

| Compound | New sources | Reused sources | New studies | New claims | New claim–source links | New regulatory records | Legacy claims (pre-existing, untouched) | `content_revisions` rows added |
|---|---|---|---|---|---|---|---|---|
| BPC-157 | 10 | 0 | 8 | 7 | 10 | 2 | 9 | 1 |
| Semaglutide | 5 | 0 | 4 | 5 | 5 | 1 | 9 | 1 |
| Retatrutide | 3 | 0 | 2 | 3 | 3 | 1 | 9 | 1 |
| GHK-Cu | 5 | 0 | 5 | 4 | 4 | 0 | 9 | 1 |
| Semax | 6 | 1 (FDA PCAC page, reused from BPC-157) | 6 | 5 | 7 | 1 | 0 | 1 |
| **Total** | **29** | **1** | **25** | **24** | **29** | **5** | **36** | **5** |

**Claims added/revised/unsupported/removed:** 24 claims added; 0 revised; 0 removed. This pilot only added new claim-level content alongside each compound's existing legacy-imported claims (which are untouched free-text from the original static site and were explicitly out of scope for revision in this pass). "Unsupported" legacy claims — i.e., auditing the 9 pre-existing legacy claims per compound (36 total) for whether the new sourced evidence actually supports, contradicts, or leaves them unaddressed — was **not** performed in this pilot; that reconciliation is flagged below as follow-up work, not silently assumed complete.

**Live-DB verification performed after the run** (not just script exit code):
- All 5 compounds confirmed `status = 'draft'` (`0` non-draft compounds in the *entire* database, not just these 5 — confirms nothing anywhere was accidentally published).
- Per-compound claim counts confirmed by direct query and cross-checked against expected legacy-claim (9, or 0 for Semax) + newly-inserted counts: BPC-157 16, Semaglutide 14, Retatrutide 12, GHK-Cu 13, Semax 5 — all exact matches.
- `0` duplicate `(identifier_type, identifier_value)` pairs found across all 46 `source_identifiers` rows in the database (confirms the global-uniqueness dedup logic worked, including the one cross-compound reuse: the FDA PCAC calendar page, cited by both BPC-157 and Semax, resolved to a single shared `sources` row rather than being duplicated).
- Exactly 1 `content_revisions` row created per compound (5 total) — confirms the provenance-snapshot trigger fired once per compound, not zero or multiple times.
- Re-running the script a second time against the same 5 slugs produced `already_enriched` for all 5 with zero new inserts — confirms idempotency.

## Evidence coverage and gaps

**BPC-157** — Strong preclinical (in-vitro + rat tendon/ligament/muscle) mechanistic and healing evidence from an internally consistent body of work by one research group; a 4-species preclinical toxicology panel. Human evidence is essentially absent: one uncontrolled n=2 IV safety pilot (`very_low` quality, `insufficient` interpretation) and one currently-recruiting Phase 2 RCT (NCT07437547, no results yet). No human efficacy evidence exists as of this review — represented as such, not implied.

**Semaglutide** — The strongest evidence base of the five: multiple large, peer-reviewed, randomized, placebo-controlled Phase 3 human trials (STEP 1, STEP 2, SELECT with n=17,604), plus an FDA-approved label (Wegovy, NDA 215256, 2021-06-04) and a withdrawal/discontinuation follow-up study. This pilot deliberately selected a representative subset rather than attempting exhaustive literature coverage — noted as a scope limitation, not a completeness claim.

**Retatrutide** — Solid Phase 2 randomized, placebo-controlled human trial evidence (obesity trial and T2D trial, both in top-tier journals) but **not yet FDA-approved for any indication** and still in Phase 3 development. Active FDA enforcement (warning letters) against unapproved compounded/direct-to-consumer sales exists concurrently. **Gap, honestly flagged in the source file itself:** the FDA warning-letter source (`fda-glp1-solution-warning-2025`) could not be fully re-verified by direct page fetch during this review — `fda.gov` URLs returned HTTP errors to automated fetching throughout this pilot (see "Broken or unverifiable citations" below); its existence and metadata were corroborated via multiple independent search results, not full-page extraction.

**GHK-Cu** — Thin and mixed. The only human RCT identified (n=13, CO2-laser-resurfaced skin) showed **no significant objective improvement** — only a significant subjective/patient-satisfaction difference — and is represented as `conflicting` evidence, not smoothed into a positive claim. The rest of the evidence is in-vitro fibroblast mechanism studies and one non-systematic, potentially conflict-of-interest-affected narrative review. **No regulatory record was added** — GHK-Cu is commonly sold/marketed as a cosmetic ingredient, a category that doesn't map onto a drug-approval-style regulatory record, and a record was deliberately not force-fit here.

**Semax** — The only pilot compound with **zero pre-existing legacy claims** in the database. Human evidence is limited to one 1997 Russian-language study (n=30 treated vs n=80 concurrent, non-randomized, unblinded per the reviewed abstract) — represented as `non_randomized_human_trial`, not upgraded to RCT. Remaining evidence is animal/mechanistic (BDNF/trkB, dopaminergic/serotoninergic activation, nitric oxide, protein-expression/transcriptomic studies) plus one narrative review authored by Semax's original developers (explicit conflict-of-interest flag, `very_low` quality, `insufficient` interpretation). **Gap, deliberately not represented as fact:** Semax is widely described by commercial/vendor sources as "registered in Russia since 1994," but no authoritative primary source for that specific claim (Russian State Register of Medicines or equivalent, or a peer-reviewed citation of it) was located — per this project's sourcing policy, vendor/blog pages are excluded as evidence, so **no regulatory_record was created for that claim.** It is flagged here as unverified and a candidate for dedicated follow-up (e.g., a direct search of the Russian state drug registry) before any editorial content asserts it as fact.

## Regulatory findings

- **BPC-157:** WADA S0 (banned in sport, per USADA guidance). FDA PCAC discussed BPC-157 on 2026-07-23/24 as a 503A bulks-list nominee; PCAC voted in favor — advisory only, no final FDA/HHS determination as of this review (`no_determination`).
- **Semaglutide:** FDA-approved (Wegovy, NDA 215256, effective 2021-06-04) for chronic weight management. Newer label indications (cardiovascular risk reduction, MASH) exist but were **not independently re-verified** in this pilot — noted in the record itself.
- **Retatrutide:** Not FDA-approved for any indication; investigational, Phase 3. FDA enforcement action (warning letters) exists against unapproved compounded sales — source not fully re-verifiable, see gaps above.
- **GHK-Cu:** No regulatory record added (cosmetic-ingredient category, not a drug-approval category — see above).
- **Semax:** FDA PCAC voted on 2026-07-24 to recommend Semax for the 503A bulks list — advisory only, no final determination (`no_determination`). The commonly-repeated "Russia, 1994" registration claim was **not** added as a regulatory record — unverified via an authoritative source (see gap above).

## Broken or unverifiable citations

- **`fda.gov` direct-fetch failures (systemic, not isolated):** across this entire pilot, every direct `WebFetch` attempt against an `fda.gov` URL (a briefing-document PDF, the Wegovy label PDF, a press-release page, an individual warning-letter page, and a general GLP-1 concerns page) returned HTTP errors rather than page content. Where an FDA fact was still cited (the Wegovy label, the Retatrutide warning letter, the PCAC calendar page), it was cross-corroborated across multiple independent search results that quoted or described the real page content and metadata — but none of these FDA pages themselves were fetched and read in full during this pilot. This is flagged as a standing limitation of the current research tooling for FDA sources specifically, not resolved by this pilot.
- **Semax's "registered in Russia since 1994" claim:** repeated across many vendor/blog pages, but no authoritative primary source was found. Excluded from the database entirely (see Semax section above) rather than cited to a non-authoritative source.
- **PMID 11517472 (Semax, Gusev/Skvortsova 1997) and PMID 9173745 (Semax, "15 years experience" review):** both published in Russian-language journals. This pilot verified their existence, authorship, and journal metadata via NCBI E-utilities, and worked from English-language abstracts/summaries only — not the full original-language primary text. Represented in the database with that limitation stated explicitly in each claim's `quality_rationale`/study `limitations` field, not silently treated as fully reviewed.

## Tests performed

- No dedicated automated test suite exists for `scripts/enrichment/run-enrichment.mjs`, consistent with the existing `scripts/migration/import-to-supabase.mjs` (also untested by an automated suite — both are manual, operator-run data-loading scripts, not application code covered by the CI unit/e2e suites).
- In place of unit tests, this pilot relied on live-database verification queries run directly against the staging project after execution (see "Live-DB verification performed" above): draft-status confirmation (all 5, plus a whole-database `0` non-draft check), exact per-compound claim-count reconciliation, zero-duplicate-identifier confirmation, exactly-one-`content_revisions`-row-per-compound confirmation, and a full second run of the script confirming idempotent no-op behavior.
- The unrelated project-wide test suites (Vitest unit tests, Playwright e2e, axe accessibility) were **not** re-run for this pilot, per the instruction not to repeat unrelated verification — this pilot touches only new data files and a new standalone script, no application/UI code.

## Commits created

1. `security: durable rate limiting + Cloudflare Turnstile on public forms` (`2ec4630`) — from the prior security-closeout step, committed but **not pushed** (unchanged by this pilot; listed here only for a complete session record).
2. *(to be created after this report is reviewed)* — will add `scripts/enrichment/schema.mjs`, `scripts/enrichment/data/*.mjs`, `scripts/enrichment/run-enrichment.mjs`, and `docs/enrichment/pilot-report.md`. Not committed yet — shown for your review first, per the reporting requirement to show the diff before committing.

## Confirmation

- Every compound touched by this pilot remains `status = 'draft'` (live-verified, not assumed).
- Every claim inserted by this pilot is `status = 'draft'`.
- Nothing was published. No existing content was deleted, overwritten, or altered — only new rows were added.
- The remaining ~51 non-pilot compound records were not touched by this run (the pipeline only processes explicitly named slugs — see `PILOT_SLUGS` in `scripts/enrichment/run-enrichment.mjs` — never an auto-discovered "everything in data/").

## Suggested follow-ups (not started — awaiting your direction)

1. Resolve the two flagged unverifiable-citation gaps (Retatrutide's FDA warning letter; Semax's Russia-1994 registration claim) via a dedicated verification pass, e.g. a direct Russian State Register of Medicines lookup for Semax, and a retry or alternate verification path for FDA warning-letter pages.
2. Reconcile the 36 pre-existing legacy claims (9 per compound × 4 compounds; Semax has none) against the newly added sourced evidence — flag which legacy statements are now supported, contradicted, or still unaddressed. Out of scope for this pilot; not attempted.
3. If the pilot's approach is approved, extend to the remaining ~51 compound records — explicitly **not started**, per your instruction to stop after these five.
