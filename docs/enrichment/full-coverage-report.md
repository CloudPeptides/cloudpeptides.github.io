# Research Enrichment — Full Coverage Report (All 56 Compounds)

**Run dates:** 2026-08-06 (5-compound pilot) through 2026-08-07 (batches 1-6, 51 remaining compounds).
**Scope:** All 56 compound records in the `cloudpeptides-staging` Supabase project. Production was never touched.
**Status:** Every compound, claim, and source-linkage produced by this pipeline is `status = 'draft'`. Nothing was published.

This report supersedes and incorporates [pilot-report.md](pilot-report.md) (the 5-compound pilot). See that document for the pilot's own detailed narrative; this report focuses on the full picture and the six subsequent batches.

## 1. Compounds completed

**56 / 56.** Full list, in processing order:

| Phase | Compounds |
|---|---|
| Pilot | BPC-157, Semaglutide, Retatrutide, GHK-Cu, Semax |
| Batch 1 | 5-Amino-1MQ, Adamax, AHK-Cu, AICAR, AOD-9604, ARA-290, Botulinum Toxin, BPC-157+TB-500, Cagrilintide |
| Batch 2 | Calm Focus Stack, Cartalax, Cerebrolysin, CJC-1295 DAC, CJC-1295 No DAC, CJC-1295 No DAC+Ipamorelin, DSIP, Elite Anti-Aging Stack, Enhanced Sleep Stack |
| Batch 3 | Epithalon, Glow Blend, Glutathione, Growth Hormone Fat Loss Stack, Growth Hormone Muscle Building Stack, HCG, IGF-1 LR3, Ipamorelin, Kisspeptin-10 |
| Batch 4 | KLOW Blend, KPV, Lemon Bottle, Melanotan I, Melanotan II, MOTS-c, NAD+, Neuro-Cognitive Stack, Oxytocin Acetate |
| Batch 5 | PE-22-28, PE-22-29, Pinealon, PT-141, Selank, Sermorelin, SS-31, TB-500, Tesamorelin |
| Batch 6 | Thymalin/Thymulin, Thymosin Alpha-1, Tirzepatide, Ultimate Fat Loss Stack, Upgraded Glow Stack, Wolverine Stack |

## 2. Studies, sources, claims, and regulatory records — totals and per-compound

**Whole-database totals (live-queried, not estimated):**

| Metric | Count |
|---|---|
| Compounds | 56 (0 non-draft) |
| Claims | 609 (0 non-draft) |
| Sources | 160 |
| Studies | 89 |
| source_identifiers (DOI/PMID/NCT) | 157 (0 duplicates) |
| regulatory_records | 23 |
| content_revisions | 56 (exactly 1 per compound) |
| claim_sources links | 838 (0 orphaned) |

**Per-compound breakdown** (sources added / reused / claims added / regulatory records added / legacy claims reconciled):

| Compound | New sources | Reused | New claims | New reg. records | Legacy reconciled |
|---|---|---|---|---|---|
| BPC-157 (pilot) | 10 | 0 | 7 | 2 | — (pre-reconciliation) |
| Semaglutide (pilot) | 5 | 0 | 5 | 1 | — |
| Retatrutide (pilot) | 3 | 0 | 3 | 1 | — |
| GHK-Cu (pilot) | 5 | 0 | 4 | 0 | — |
| Semax (pilot) | 6 | 1 | 5 | 1 | — |
| 5-Amino-1MQ | 2 | 0 | 2 | 0 | 9 |
| Adamax | 0 | 0 | 0 | 0 | 9 |
| AHK-Cu | 1 | 0 | 2 | 0 | 8 |
| AICAR | 3 | 0 | 3 | 1 | 9 |
| AOD-9604 | 4 | 0 | 3 | 2 | 9 |
| ARA-290 | 3 | 0 | 2 | 0 | 9 |
| Botulinum Toxin | 2 | 0 | 2 | 1 | 9 |
| BPC-157+TB-500 | 2 | 1 | 2 | 0 | 8 |
| Cagrilintide | 5 | 0 | 3 | 1 | 9 |
| Calm Focus Stack | 2 | 0 | 1 | 0 | 11 |
| Cartalax | 0 | 0 | 1 | 0 | 9 |
| Cerebrolysin | 3 | 0 | 2 | 0 | 9 |
| CJC-1295 DAC | 1 | 0 | 1 | 0 | 9 |
| CJC-1295 No DAC | 1 | 0 | 1 | 0 | 9 |
| CJC-1295 No DAC+Ipamorelin | 0 | 1 | 1 | 0 | 8 |
| DSIP | 3 | 0 | 1 | 0 | 9 |
| Elite Anti-Aging Stack | 1 | 0 | 1 | 0 | 11 |
| Enhanced Sleep Stack | 1 | 1 | 1 | 0 | 11 |
| Epithalon | 2 | 2 | 2 | 0 | 9 |
| Glow Blend | 0 | 2 | 1 | 0 | 8 |
| Glutathione | 2 | 0 | 2 | 0 | 9 |
| GH Fat Loss Stack | 1 | 0 | 1 | 0 | 11 |
| GH Muscle Building Stack | 1 | 1 | 1 | 0 | 11 |
| HCG | 1 | 0 | 2 | 1 | 9 |
| IGF-1 LR3 | 2 | 0 | 1 | 0 | 9 |
| Ipamorelin | 3 | 1 | 2 | 0 | 9 |
| Kisspeptin-10 | 3 | 0 | 1 | 0 | 8 |
| KLOW Blend | 1 | 0 | 1 | 0 | 5 |
| KPV | 1 | 1 | 2 | 0 | 9 |
| Lemon Bottle | 1 | 0 | 1 | 1 | 9 |
| Melanotan I | 1 | 0 | 1 | 1 | 9 |
| Melanotan II | 3 | 0 | 2 | 0 | 8 |
| MOTS-c | 1 | 0 | 2 | 0 | 9 |
| NAD+ | 1 | 0 | 1 | 0 | 9 |
| Neuro-Cognitive Stack | 0 | 1 | 1 | 0 | 11 |
| Oxytocin Acetate | 2 | 0 | 2 | 1 | 9 |
| PE-22-28 | 1 | 0 | 1 | 0 | 9 |
| PE-22-29 | 0 | 0 | 1 | 0 | 9 |
| Pinealon | 1 | 0 | 1 | 0 | 9 |
| PT-141 | 2 | 0 | 1 | 1 | 9 |
| Selank | 1 | 2 | 1 | 0 | 9 |
| Sermorelin | 1 | 0 | 2 | 1 | 9 |
| SS-31 | 1 | 0 | 2 | 1 | 9 |
| TB-500 | 2 | 1 | 2 | 0 | 9 |
| Tesamorelin | 1 | 1 | 2 | 1 | 9 |
| Thymalin/Thymulin | 2 | 0 | 2 | 0 | 9 |
| Thymosin Alpha-1 | 1 | 0 | 2 | 2 | 9 |
| Tirzepatide | 2 | 0 | 3 | 3 | 9 |
| Ultimate Fat Loss Stack | 0 | 2 | 1 | 0 | 14 |
| Upgraded Glow Stack | 0 | 2 | 1 | 0 | 11 |
| Wolverine Stack | 0 | 2 | 1 | 0 | 11 |

## 3. Disposition of every legacy claim

Across the 51 non-pilot compounds (the pilot's 5 compounds predate the legacy-reconciliation feature — see §7, "Unresolved / follow-up work"), every pre-existing legacy claim was individually reconciled:

| Disposition | Count | Meaning |
|---|---|---|
| **Supported** | 345 | Confirmed accurate by verified evidence (or, for site-policy/disclaimer boilerplate, true by inspection) |
| **Revised** | 72 | Directionally correct but incomplete, overstated, or missing important context — corrected in the claim's rationale and/or a new claim |
| **Unsupported** | 43 | No independently verifiable source located; not proven false, but not currently verifiable |
| **Contradicted** | 10 | Actively factually wrong — see §5 below, all 10 are the "research purposes only" disclaimer on compounds that are actually FDA-approved drugs |
| **Superseded** | 0 | No legacy claim was fully replaced by newer evidence in a way that made the old claim obsolete rather than merely wrong/incomplete |

**Total reconciled: 470** legacy claims across 51 compounds (pilot compounds' legacy claims — 36 total across BPC-157/Semaglutide/Retatrutide/GHK-Cu, none for Semax — were left untouched, as documented in the pilot report).

## 4. Human vs. preclinical evidence coverage

- **Real human RCT/clinical evidence (of some kind):** Semaglutide, Retatrutide, Cagrilintide, AOD-9604 (strong safety data, but a *negative* efficacy trial), ARA-290, DSIP, Kisspeptin-10, PT-141, Tesamorelin, Tirzepatide, HCG, Botulinum Toxin, Melanotan I, SS-31, Thymosin Alpha-1, Sermorelin (historical, pre-2009), Selank, Semax, Glutathione (conflicting), Oxytocin Acetate (approved obstetric use + a negative behavioral-use trial), Cerebrolysin (indication-dependent, mixed), Ipamorelin (PK/PD data; efficacy-trial outcome unconfirmed), CJC-1295 DAC, BPC-157 (n=2 safety pilot only — no efficacy data). **≈24 of 56 compounds.**
- **Animal/in-vitro evidence only (no human data identified):** GHK-Cu (plus one small negative human RCT), AHK-Cu, 5-Amino-1MQ, AICAR, KPV, MOTS-c, IGF-1 LR3, PE-22-28, TB-500/thymosin beta-4, Thymalin, Pinealon, CJC-1295 No DAC (class-level only), Melanotan II (case reports, not trials). **≈13 of 56.**
- **No independently verifiable literature at all:** Adamax, Cartalax, PE-22-29. **3 of 56.**
- **Not a peptide / regulatory-flagged cosmetic product:** Lemon Bottle. **1 of 56.**
- **Named combination products with zero combination-level evidence** (each component individually evidenced, per above): Calm Focus Stack, Elite Anti-Aging Stack, Enhanced Sleep Stack, Growth Hormone Fat Loss Stack, Growth Hormone Muscle Building Stack, CJC-1295 No DAC+Ipamorelin, Glow Blend, KLOW Blend, Neuro-Cognitive Stack, Ultimate Fat Loss Stack, Upgraded Glow Stack, Wolverine Stack, BPC-157+TB-500. **13 of 56** (the "stack"/"blend" entity types are exactly these).

## 5. FDA/regulatory-approved compounds mislabeled by legacy "research only" disclaimers

Ten legacy claims were reconciled as **contradicted** — all the same pattern: a "research purposes only, not for human consumption" (or equivalent) disclaimer applied to a compound that is, in reality, an FDA-approved drug administered to patients:

| Compound | Approved brand | Approval |
|---|---|---|
| Botulinum Toxin | Botox (onabotulinumtoxinA) | 1989, multiple expanded indications since |
| HCG | Novarel and others | Multiple decades-old approvals |
| Melanotan I | Scenesse (afamelanotide) | 2019, erythropoietic protoporphyria |
| Oxytocin Acetate | Pitocin | Obstetric indications only |
| PT-141 | Vyleesi (bremelanotide) | 2019, HSDD |
| SS-31 | Elamipretide | 2025 (accelerated), Barth syndrome |
| Tesamorelin | Egrifta | 2010, HIV lipodystrophy |
| Tirzepatide | Mounjaro / Zepbound | 2022/2023/2024, three indications |

This is flagged as a systemic pattern in the legacy content (not isolated typos) — every "research use only" disclaimer on this site should be reviewed against each compound's actual current regulatory status before publication, not assumed uniformly correct.

## 6. Compounds requiring expert/editorial review before any publication

1. **Lemon Bottle** — highest priority. Not a peptide; named in an FDA Warning Letter (March 2025) as an unapproved new drug; independent Swissmedic lab testing found tested samples did not match declared ingredients. This is a product-safety/integrity issue, not just an evidence gap.
2. **Adamax** — zero independently verifiable literature found anywhere. The described "adamantane-modified Semax analogue" structure appears only on commercial vendor pages.
3. **PE-22-29** — zero independently verifiable literature found. Every search surfaced only the genuinely-real PE-22-28 or vendor pages; possibly a naming variant or vendor error rather than a truly distinct compound.
4. **Cartalax** — no PubMed-indexed source located, despite plausibly being a real member of the Khavinson bioregulator peptide family (which does have some real literature for other members, e.g. Epithalon).
5. **Pinealon / Thymalin** — real but very thin literature, predominantly self-authored by the compounds' own developers (Khavinson group), with minimal independent outside replication.
6. **The process note on `epithalon-compound.mjs`** (§8 below) — the original pre-session draft's content is unrecoverable; the current content is fresh, independently researched, but an editor should be aware no continuity exists with whatever the earlier draft said.

## 7. Unresolved / follow-up work (explicitly not completed in this pass)

- **The 5 pilot compounds' pre-existing legacy claims were never run through legacy-claim reconciliation** — the reconciliation feature (disposition tracking, `legacyReconciliations`) was built *after* the pilot ran. BPC-157, Semaglutide, Retatrutide, and GHK-Cu each still have 9 untouched legacy claims (36 total); Semax has 0. This is the single largest piece of unfinished reconciliation work and should be the first follow-up task.
- **Retatrutide's FDA warning-letter source** (`fda-glp1-solution-warning-2025`) — flagged in the pilot as not fully re-verified via direct page fetch; still unresolved.
- **Semax's "registered in Russia since 1994" claim** — deliberately excluded from the database (no authoritative source found); still unverified.
- **Thymosin Alpha-1's country-by-country approval footprint** (35+ countries) — reflects cross-corroborated secondary reporting, not independently verified against each country's own regulatory database.
- **Cagrilintide's CagriSema NDA filing** — sourced from a company press release, not independently confirmed against FDA's own database.
- **Tirzepatide's Zepbound (2023) and OSA (2024) approval dates** — corroborated via secondary sources, not independently verified against their own dedicated FDA label documents (only the original 2022 Mounjaro label was directly fetched).
- **SS-31/Elamipretide's exact September 2025 approval date** — very recent, flagged for direct FDA-record confirmation before being asserted with day-level precision.
- **Systemic `fda.gov` direct-fetch failures** — as in the pilot, most FDA facts across all six batches were verified via cross-corroborated search results and FDA label PDFs that *did* fetch successfully, but several individual FDA pages could not be fetched directly; each such instance is flagged inline in its own data file.
- **Reconciling the 36 pilot-compound legacy claims against the newer sourced evidence** (see first bullet).
- **Extending this pipeline beyond the current 56 compounds** — not applicable; all 56 are now processed.

## 8. Process note (already disclosed mid-run, repeated here for completeness)

`scripts/enrichment/data/epithalon-compound.mjs` existed as an untracked, uncommitted file before this session began. It was overwritten by a `Write` call without first reading its prior content — an error against this project's "preserve existing content" rule. No git history exists for that file (it was never committed), so the original content is unrecoverable. The current file is freshly, independently researched with real verified citations; nothing false was introduced, but continuity with whatever the earlier draft contained was lost.

## 9. Tests performed

- No dedicated automated test suite for the enrichment pipeline scripts (consistent with the pre-existing `scripts/migration/import-to-supabase.mjs`, also untested by the CI suite — both are manual, operator-run data-loading scripts).
- **Per-batch verification** (`scripts/enrichment/verify-batch.mjs`), run after every one of the 6 batches: draft-status confirmation (batch-scoped and whole-database), citation-integrity checks (every `claim_sources` row resolves to a real, complete `sources` row), claim-support checks (every `evidence_quality` has a required `quality_rationale`), duplicate-source-identifier checks, and per-compound count reporting.
- **Idempotency**, tested after every batch: re-running `run-enrichment.mjs` against the same slugs produced `already_enriched` for 100% of compounds with zero new inserts, every time.
- **One complete final verification suite** (this report, §2): whole-database counts, 0 non-draft compounds/claims, 0 duplicate identifiers, 0 orphaned `claim_sources` rows, exactly 1 `content_revisions` row per compound (56/56).
- Unrelated project test suites (Vitest unit, Playwright e2e, axe accessibility) were **not** re-run at any point in this multi-batch run, per instruction — nothing application/UI-facing was touched.

## 10. All commits created (this multi-batch run, chronological)

| Commit | Description |
|---|---|
| `2ec4630` | security: durable rate limiting + Cloudflare Turnstile (prior session, pushed this session) |
| `a8db9d4` | feat(research): five-compound scientific enrichment pilot (draft only) |
| `1b1fbad` | feat(research): enrichment batch 1 — 9 compounds |
| `55338e1` | feat(research): enrichment batch 2 — 9 compounds |
| `8baa3d7` | feat(research): enrichment batch 3 — 9 compounds |
| `43b00b1` | feat(research): enrichment batch 4 — 9 compounds |
| `d2cb2ce` | feat(research): enrichment batch 5 — 9 compounds |
| `4f8ad52` | feat(research): enrichment batch 6 — final 6 compounds |

All pushed to `rebuild/astro-platform`. `main` was never touched. No production deployment, DNS change, or domain activation occurred at any point.

## 11. Confirmation

- **56 / 56 compounds remain `status = 'draft'`** — live-verified, not assumed, at the end of every batch and again in this final report.
- **609 / 609 claims remain `status = 'draft'`** — 0 published anywhere.
- **0 duplicate source identifiers**, **0 orphaned claim_sources links**, **exactly 1 content_revisions snapshot per compound** — all live-verified.
- Nothing was published, merged to `main`, deployed to production, or exposed via DNS/domain changes at any point in this run.
