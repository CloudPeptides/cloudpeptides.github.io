# Correction: Phase 2 "48/48 imported" statement (2026-08-06)

## What was said, and what was true

The Phase 2 closeout summary stated all imported compounds had landed
successfully — reported as "48/48 imported." That statement was **accurate
about the 48 rows it was describing**, but **incomplete and misleading as a
summary of the migration**: `scripts/migration/extract-legacy-compounds.mjs`
had classified **56** legacy pages as individual compounds/stacks, of which
only 48 were auto-classifiable (`entity_kind` inferable from a "Peptide
Class" quickfact or a small hard-coded override list) and therefore
`importable: true`. The other **8** were correctly *excluded* from that run
— `import-to-supabase.mjs` only ever imports `importable: true` rows — but
were never surfaced with equal weight alongside the "48/48" framing. They
were documented in `legacy-compound-import-report.md`'s "Needs human review"
section the whole time, just not restated as an unresolved gap in the
closeout summary itself. That's the inaccuracy being corrected here: not a
data-integrity bug, a reporting one.

## The correction

The user reviewed the 8 held-back pages and supplied explicit `entity_kind`
classifications (recorded in `scripts/migration/extract-legacy-compounds.mjs`
as `HUMAN_APPROVED_ENTITY_KIND`, kept separate from the script's own
name-based `ENTITY_KIND_OVERRIDES` inferences so the report/warnings can
always distinguish "the script guessed this" from "a human classified this
after review"):

| Slug | entity_kind | Notes |
|---|---|---|
| `5-amino-1mq` | `non_peptide_research_compound` | |
| `aicar` | `small_molecule_drug` | |
| `bpc-157-tb-500` | `peptide_blend` | Component list ("BPC-157", "TB-500") extracted from the page's "Compounds Included" section, not guessed from the name |
| `cerebrolysin` | `biologic` | |
| `cjc-1295-no-dac-ipamorelin` | `peptide_blend` | Component list ("CJC-1295 No DAC", "Ipamorelin") extracted the same way |
| `glutathione` | `peptide` | |
| `nad-plus` | `non_peptide_research_compound` | |
| `semax` | `peptide` | Legacy page is a content-free stub (see below) — imported as a zero-claim draft shell, not skipped |

All eight were imported as `status: 'draft'` via a re-run of
`import-to-supabase.mjs` (now idempotent for stack/blend component links —
see below) using the exact same extraction/insertion path as the original
48: no hand-written SQL, no claims or descriptions invented. Source text is
migrated verbatim from the legacy HTML exactly as `sections`/`paragraphs`
were originally extracted; nothing was added, rewritten, or summarized.

**Semax** stayed at zero claims deliberately — its legacy page
(`legacy-site/semax.html`) has no breadcrumb, no quickfacts, and no
extractable prose ("...runtime reset. Replace with the full template if
desired." is the only body content, an unfinished placeholder). Rather than
inventing content to fill in, the compound row exists as a draft shell with
an explicit warning attached both in the migration report and in the row's
own `raw_import_metadata.import_warnings` (queryable directly, not just in
a markdown file) — flagging that an editor needs to write real content from
scratch before this can ever go to review.

## Script changes behind the correction

- `scripts/migration/extract-legacy-compounds.mjs`:
  - Added `HUMAN_APPROVED_ENTITY_KIND` (see above) and wired it into
    `entityKindFor()` and `warningsFor()` (the latter now records *why*
    entity_kind is populated for these 8, instead of silently going quiet).
  - Broadened component-name extraction (previously gated to
    `classification.type === 'stack'` only) to also run for ordinary
    compound pages, scoped to an *exact* section-label match on "Key
    Compounds" or "Compounds Included" — verified against the raw legacy
    HTML that this exact-match scoping is required, because `.compounds
    span` markup is reused elsewhere on non-blend pages for unrelated
    mechanism/pathway tag lists (e.g. `nad-plus.html` uses it for
    "Mitochondria", "ATP Production" — not compounds). A loose match would
    have misattributed those as component links.
  - Relaxed the `importable` gate from `entity_kind !== null && claims.length
    > 0` to `entity_kind !== null` — the zero-claims requirement existed to
    avoid importing something with literally nothing extracted, but that's
    exactly the honest state Semax needs to be importable *as* (a flagged
    shell), not a reason to drop it.
- `scripts/migration/import-to-supabase.mjs`:
  - Pass 3 (stack/blend component linking) previously ran once, over
    whatever was importable in that run, and wasn't safe to re-run — a
    second pass would re-attempt already-existing `(stack_id,
    component_compound_id)` inserts, hit the primary-key constraint, and
    silently swallow the conflict as an "error," undercounting real links
    in the report. Fixed to check for an existing link before inserting,
    so re-running the full importable set (needed here, since previously
    unresolved links like `calm-focus-stack → Semax` only become
    resolvable once Semax exists) is now idempotent and accurately
    reported.
  - New compound rows now carry the extraction's `warnings` array in
    `raw_import_metadata.import_warnings`, so caveats like "stub page" or
    "entity_kind assigned via human review" are visible to anyone querying
    the table directly, not only in the markdown report. (Not backfilled
    onto the original 48 — out of scope for this correction, and Pass 1 is
    insert-only for genuinely new rows.)

## Verified results (queried directly against the live staging DB, not
inferred from script output)

- **56** total `compounds` rows, **56** `draft`, **0** `published`.
- All 8 target slugs present with the exact approved `entity_kind`.
- Claim/provenance totals: **507** `claims`, **56** `sources`, **507**
  `claim_sources` (446 + 61 new claims; 48 + 8 new sources).
- **24** `stack_components` rows total (15 pre-existing + 9 newly
  inserted): `bpc-157-tb-500 → [bpc-157, tb-500]`,
  `cjc-1295-no-dac-ipamorelin → [cjc-1295-no-dac, ipamorelin]`, and the
  three previously-unresolved links now resolved —
  `calm-focus-stack → [..., semax]`, `neuro-cognitive-stack → [...,
  semax]`, `upgraded-glow-stack → [..., glutathione]`.
  (`klow-blend` remains correctly unlinked — its legacy page has no
  itemized component-compound list to extract, only prose; nothing was
  invented to fill that gap.)
- Anonymous (`anon` key) reads return **zero** rows across all 56
  compounds, including each of the 8 by slug — confirmed by direct query,
  not just RLS policy inspection.
- Full 14-check RLS/security suite (`scripts/migration/verify-security.mjs`):
  **14/14 passed**.

See `docs/migration/legacy-import-result.md` (regenerated by this run) and
`docs/migration/legacy-compound-import-report.md` (regenerated extraction
preview, now showing 56/56 importable, 0 needing review) for full detail.
