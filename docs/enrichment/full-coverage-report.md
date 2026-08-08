# Research Enrichment — Full Coverage Report (All 56 Compounds)

**Run dates:** 2026-08-06 (5-compound pilot) through 2026-08-07 (batches 1-6, all 51 remaining compounds, and same-day scientific closeout).
**Scope:** All 56 compound records in the `cloudpeptides-staging` Supabase project. Production was never touched.
**Status:** Every compound, claim, and source-linkage produced by this pipeline is `status = 'draft'`. Nothing was published.

This report supersedes and incorporates [pilot-report.md](pilot-report.md) (the 5-compound pilot). See that document for the pilot's own detailed narrative.

## 0. Closeout pass (2026-08-07) — summary of what changed after the initial six-batch run

Following the six-batch run, a dedicated scientific closeout addressed two gaps identified in that run's own "unresolved / follow-up" section:

**A. Reconciled the 5 pilot compounds' pre-existing legacy claims.** BPC-157, Semaglutide, Retatrutide, and GHK-Cu each had 9 legacy claims (36 total) that predated the legacy-reconciliation feature (Semax has 0 legacy claims — nothing to do). All 36 are now individually reconciled with claim-level citations for every supported/revised claim, using the exact same disposition taxonomy as the other 51 compounds. See §3.

**B. Corrected a regulatory-reasoning error affecting 10 claims across 8 compounds.** The original batch runs classified 10 legacy "research purposes only, not for human consumption" disclaimers as **contradicted**, on the reasoning that FDA approval of a drug containing the same active ingredient made the disclaimer false. That reasoning was wrong, and has been corrected:

- **FDA approval attaches to a specific drug product** — its manufacturer, formulation, manufacturing/sterility process, route, indication, and approved labeling — not to every product containing the same molecular entity.
- A vendor's unapproved, research-grade product is correctly labeled "research use only / not for human consumption" *even when* an FDA-approved drug containing the same molecule exists, because the two are not the same product: the research-grade material has not gone through FDA review, and nothing establishes it matches the approved product's manufacturing, purity, or formulation.
- Approval of one product (e.g. Mounjaro) is never evidence that a compounded, generic-looking, research-grade, differently formulated, or independently sold version is also approved.

All 10 "research purposes only" disclaimers have been **reclassified from contradicted to supported** (see §5). Two related Tirzepatide claims that used the specific regulatory term "investigational" (technically wrong — the molecule has approved products, even though the specific research-grade product sold is still unapproved) were separately corrected: one reclassified `revised` (the word "investigational" itself needs correcting, even though the underlying "this specific product is unapproved" point stands), one reclassified `supported`. Every affected compound's regulatory claim and `regulatory_records` entry was also updated to name the actual approved product, its manufacturer, and an explicit statement that the approval does not extend to research-grade/compounded/independently-sold material — so the corrected reasoning is recorded in the data itself, not just in this report.

**Mechanism:** `run-enrichment.mjs` was extended with a "reconciliation-only" mode so an already-enriched compound can have new or revised `legacyReconciliations` applied without re-inserting its existing sources/claims/regulatory records (see the script's own header comment for the full design). A separate one-time script, `closeout-regulatory-identity-2026-08-07.mjs`, updated the 8 pipeline-authored regulatory claims and 10 `regulatory_records` rows whose text needed correcting (these are the pipeline's own prior output, not pre-existing legacy site content, so editorial correction is the intended workflow here — not the "never touch legacy statement text" rule, which protects the original site's wording specifically).

**Live-verified after the closeout:** 13/13 compounds checked (12 changed + Semax as an untouched control) remain `status='draft'`; 224 `claim_sources` rows for this set all resolve; 0 duplicate source identifiers anywhere in the database; 0 claims missing a required `quality_rationale`; both closeout scripts are idempotent (re-running each reports zero new writes); 0 `contradicted` claims remain anywhere in the database (down from 10). Whole-database final state: 56/56 compounds draft, 609/609 claims draft, 160 sources, 23 regulatory records, 864 claim_sources links (0 orphaned), 80 content_revisions rows, 0 duplicate identifiers. Full detail in §2–§3 below (now updated to reflect the closeout) and §12 (new).

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
| Closeout | (no new compounds — reconciled/corrected 12 of the above: BPC-157, Semaglutide, Retatrutide, GHK-Cu, Botulinum Toxin, HCG, Melanotan I, Oxytocin Acetate, PT-141, SS-31, Tesamorelin, Tirzepatide) |

## 2. Studies, sources, claims, and regulatory records — totals and per-compound

**Whole-database totals (live-queried after the closeout, not estimated):**

| Metric | Count |
|---|---|
| Compounds | 56 (0 non-draft) |
| Claims | 609 (0 non-draft) |
| Sources | 160 |
| Studies | 89 |
| source_identifiers (DOI/PMID/NCT) | 157 (0 duplicates) |
| regulatory_records | 23 |
| content_revisions | 80 (12 closeout-affected compounds each gained 2 additional snapshots — one per closeout script run, including the idempotency test re-run; the other 44 compounds remain at 1 each) |
| claim_sources links | 864 (0 orphaned) — 26 new links added during closeout (all from the pilot's 36 newly-reconciled legacy claims) |

**Per-compound breakdown** (sources added / reused / claims added / regulatory records added / legacy claims reconciled — closeout-affected rows marked):

| Compound | New sources | Reused | New claims | New reg. records | Legacy reconciled |
|---|---|---|---|---|---|
| BPC-157 (pilot) ⟳ | 10 | 0 | 7 | 2 | **9** (closeout) |
| Semaglutide (pilot) ⟳ | 5 | 0 | 5 | 1 | **9** (closeout) |
| Retatrutide (pilot) ⟳ | 3 | 0 | 3 | 1 | **9** (closeout) |
| GHK-Cu (pilot) ⟳ | 5 | 0 | 4 | 0 | **9** (closeout) |
| Semax (pilot) | 6 | 1 | 5 | 1 | 0 (no legacy claims exist) |
| 5-Amino-1MQ | 2 | 0 | 2 | 0 | 9 |
| Adamax | 0 | 0 | 0 | 0 | 9 |
| AHK-Cu | 1 | 0 | 2 | 0 | 8 |
| AICAR | 3 | 0 | 3 | 1 | 9 |
| AOD-9604 | 4 | 0 | 3 | 2 | 9 |
| ARA-290 | 3 | 0 | 2 | 0 | 9 |
| Botulinum Toxin ⟳ | 2 | 0 | 2 | 1 | 9 (1 reclassified in closeout) |
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
| HCG ⟳ | 1 | 0 | 2 | 1 | 9 (1 reclassified in closeout) |
| IGF-1 LR3 | 2 | 0 | 1 | 0 | 9 |
| Ipamorelin | 3 | 1 | 2 | 0 | 9 |
| Kisspeptin-10 | 3 | 0 | 1 | 0 | 8 |
| KLOW Blend | 1 | 0 | 1 | 0 | 5 |
| KPV | 1 | 1 | 2 | 0 | 9 |
| Lemon Bottle | 1 | 0 | 1 | 1 | 9 |
| Melanotan I ⟳ | 1 | 0 | 1 | 1 | 9 (1 reclassified in closeout) |
| Melanotan II | 3 | 0 | 2 | 0 | 8 |
| MOTS-c | 1 | 0 | 2 | 0 | 9 |
| NAD+ | 1 | 0 | 1 | 0 | 9 |
| Neuro-Cognitive Stack | 0 | 1 | 1 | 0 | 11 |
| Oxytocin Acetate ⟳ | 2 | 0 | 2 | 1 | 9 (1 reclassified in closeout) |
| PE-22-28 | 1 | 0 | 1 | 0 | 9 |
| PE-22-29 | 0 | 0 | 1 | 0 | 9 |
| Pinealon | 1 | 0 | 1 | 0 | 9 |
| PT-141 ⟳ | 2 | 0 | 1 | 1 | 9 (1 reclassified in closeout) |
| Selank | 1 | 2 | 1 | 0 | 9 |
| Sermorelin | 1 | 0 | 2 | 1 | 9 |
| SS-31 ⟳ | 1 | 0 | 2 | 1 | 9 (1 reclassified in closeout) |
| TB-500 | 2 | 1 | 2 | 0 | 9 |
| Tesamorelin ⟳ | 1 | 1 | 2 | 1 | 9 (1 reclassified in closeout) |
| Thymalin/Thymulin | 2 | 0 | 2 | 0 | 9 |
| Thymosin Alpha-1 | 1 | 0 | 2 | 2 | 9 |
| Tirzepatide ⟳ | 2 | 0 | 3 | 3 | 9 (3 reclassified in closeout) |
| Ultimate Fat Loss Stack | 0 | 2 | 1 | 0 | 14 |
| Upgraded Glow Stack | 0 | 2 | 1 | 0 | 11 |
| Wolverine Stack | 0 | 2 | 1 | 0 | 11 |

## 3. Disposition of every legacy claim

**All 56 compounds' legacy claims are now reconciled** (the pilot's remaining gap from the six-batch run has been closed):

| Disposition | Count (post-closeout) | Was (pre-closeout) | Meaning |
|---|---|---|---|
| **Supported** | 387 | 345 | Confirmed accurate by verified evidence (or, for site-policy/disclaimer boilerplate, true by inspection — including all 10 "research purposes only" disclaimers, now correctly classified here per the corrected molecule-vs-product reasoning) |
| **Revised** | 75 | 72 | Directionally correct but incomplete, overstated, or missing important context |
| **Unsupported** | 44 | 43 | No independently verifiable source located; not proven false, but not currently verifiable |
| **Contradicted** | **0** | 10 | *(see §5 — the 10 prior "contradicted" claims were all reclassified after correcting the underlying regulatory reasoning; 0 genuinely contradicted claims remain anywhere in the database as of this review)* |
| **Superseded** | 0 | 0 | No legacy claim was fully replaced by newer evidence in a way that made the old claim obsolete rather than merely wrong/incomplete |

**Total reconciled: 506** legacy claims across 55 compounds (Semax has 0 pre-existing legacy claims — nothing to reconcile there).

## 4. Human vs. preclinical evidence coverage

(Unchanged by the closeout — the underlying evidence didn't change, only the regulatory-disclaimer reasoning did.)

- **Real human RCT/clinical evidence (of some kind):** Semaglutide, Retatrutide, Cagrilintide, AOD-9604 (strong safety data, but a *negative* efficacy trial), ARA-290, DSIP, Kisspeptin-10, PT-141, Tesamorelin, Tirzepatide, HCG, Botulinum Toxin, Melanotan I, SS-31, Thymosin Alpha-1, Sermorelin (historical, pre-2009), Selank, Semax, Glutathione (conflicting), Oxytocin Acetate (approved obstetric use + a negative behavioral-use trial), Cerebrolysin (indication-dependent, mixed), Ipamorelin (PK/PD data; efficacy-trial outcome unconfirmed), CJC-1295 DAC, BPC-157 (n=2 safety pilot only — no efficacy data). **≈24 of 56 compounds.**
- **Animal/in-vitro evidence only (no human data identified):** GHK-Cu (plus one small negative human RCT), AHK-Cu, 5-Amino-1MQ, AICAR, KPV, MOTS-c, IGF-1 LR3, PE-22-28, TB-500/thymosin beta-4, Thymalin, Pinealon, CJC-1295 No DAC (class-level only), Melanotan II (case reports, not trials). **≈13 of 56.**
- **No independently verifiable literature at all:** Adamax, Cartalax, PE-22-29. **3 of 56.**
- **Not a peptide / regulatory-flagged cosmetic product:** Lemon Bottle. **1 of 56.**
- **Named combination products with zero combination-level evidence** (each component individually evidenced, per above): Calm Focus Stack, Elite Anti-Aging Stack, Enhanced Sleep Stack, Growth Hormone Fat Loss Stack, Growth Hormone Muscle Building Stack, CJC-1295 No DAC+Ipamorelin, Glow Blend, KLOW Blend, Neuro-Cognitive Stack, Ultimate Fat Loss Stack, Upgraded Glow Stack, Wolverine Stack, BPC-157+TB-500. **13 of 56** (the "stack"/"blend" entity types are exactly these).

## 5. Regulatory/product-identity corrections (formerly "FDA-approved compounds mislabeled by legacy disclaimers" — reclassified in the 2026-08-07 closeout)

The six-batch run originally classified 10 legacy "research purposes only, not for human consumption" disclaimers as **contradicted**. On closeout review, that classification was itself wrong (see §0) and has been reversed to **supported** (9 of the 10) or **revised** (1 of the 10 — a Tirzepatide claim using the specific term "investigational," corrected in wording rather than fully reversed). For each, the compound's regulatory claim and `regulatory_records` entry were also updated to name the actual approved product and its manufacturer, and to state explicitly that the approval does not extend to research-grade/compounded/independently-sold material:

| Compound | Approved product | Manufacturer | Approval | Disclaimer reclassified to |
|---|---|---|---|---|
| Botulinum Toxin | Botox (onabotulinumtoxinA), BLA 103000 | Allergan (an AbbVie company) | 1989, multiple expanded indications since | supported |
| HCG | Novarel, NDA 017016 | Ferring Pharmaceuticals Inc. | 1974-01-15 | supported |
| Melanotan I | Scenesse (afamelanotide), NDA 210797 | Clinuvel Pharmaceuticals | 2019-10-08, erythropoietic protoporphyria | supported |
| Oxytocin Acetate | Pitocin, NDA 018261 | Par Pharmaceutical (Par Sterile Products LLC) | Obstetric indications only | supported |
| PT-141 | Vyleesi (bremelanotide) | AMAG Pharmaceuticals at approval; developer Palatin Technologies; commercial rights now Cosette Pharmaceuticals (~Dec 2023) | 2019-06-21, HSDD | supported |
| SS-31 | Elamipretide | Stealth BioTherapeutics | 2025-09 (accelerated), Barth syndrome | supported |
| Tesamorelin | Egrifta, NDA 22-505 | Theratechnologies Inc. | 2010-11-10, HIV lipodystrophy | supported |
| Tirzepatide | Mounjaro (NDA 215866) / Zepbound | Eli Lilly and Company | 2022 / 2023 / 2024, three indications | supported |
| Tirzepatide (2nd claim: "designed to activate GLP-1/GIP receptors for research purposes") | — | — | — | supported |
| Tirzepatide (3rd claim: "investigational peptide") | — | — | — | **revised** (word "investigational" corrected; underlying point about the specific research-grade product being unapproved stands) |

**The corrected principle, applied prospectively to any future compound work on this site:** a vendor's "research use only / not for human consumption" disclaimer is not automatically wrong just because the same active ingredient has an FDA-approved drug product somewhere. It is wrong only if the specific product being described/sold actually IS that approved product (same manufacturer, formulation, and regulatory filing) — which is essentially never true for an independently-sourced research chemical. Manufacturer names, NDA/BLA numbers where known, and this identity distinction are now recorded directly in each affected compound's `claims` and `regulatory_records` rows (not just in this report), verified via manufacturer-name lookups narrowly scoped to these 8 already-identified approved products (not a new broad research pass).

## 6. Compounds requiring expert/editorial review before any publication

1. **Lemon Bottle** — highest priority. Not a peptide; named in an FDA Warning Letter (March 2025) as an unapproved new drug; independent Swissmedic lab testing found tested samples did not match declared ingredients. This is a product-safety/integrity issue, not just an evidence gap.
2. **Adamax** — zero independently verifiable literature found anywhere. The described "adamantane-modified Semax analogue" structure appears only on commercial vendor pages.
3. **PE-22-29** — zero independently verifiable literature found. Every search surfaced only the genuinely-real PE-22-28 or vendor pages; possibly a naming variant or vendor error rather than a truly distinct compound.
4. **Cartalax** — no PubMed-indexed source located, despite plausibly being a real member of the Khavinson bioregulator peptide family (which does have some real literature for other members, e.g. Epithalon).
5. **Pinealon / Thymalin** — real but very thin literature, predominantly self-authored by the compounds' own developers (Khavinson group), with minimal independent outside replication.
6. **The process note on `epithalon-compound.mjs`** (§9 below) — the original pre-session draft's content is unrecoverable; the current content is fresh, independently researched, but an editor should be aware no continuity exists with whatever the earlier draft said.
7. **PT-141's manufacturer/commercial-rights chain** (AMAG → Palatin → Cosette) — corroborated via company press releases and SEC filings during the closeout, not independently re-verified against the FDA's own record; flagged for direct confirmation before being asserted with full precision in published content.
8. **Tirzepatide's Zepbound and OSA-indication approval dates**, and **SS-31/Elamipretide's exact September 2025 approval date/NDA number** — carried over from the six-batch run, still not independently re-verified against their own dedicated FDA label/approval documents.

## 7. Records with only preclinical or weak evidence (new section, requested for this closeout)

- **Preclinical/animal/in-vitro only, no human data identified:** GHK-Cu (plus one small negative human RCT), AHK-Cu, 5-Amino-1MQ, AICAR, KPV, MOTS-c, IGF-1 LR3, PE-22-28, TB-500/thymosin beta-4, CJC-1295 No DAC (class-level literature only, not the specific commercial product).
- **Very thin, predominantly self-authored literature** (Khavinson research program, minimal independent outside replication): Epithalon (some independent human-adjacent literature exists, comparatively stronger), Cartalax (no independently located source at all — see §6), Pinealon, Thymalin (Thymulin, its frequently-paired compound, has much stronger independent literature — see thymalin-thymulin.mjs for the explicit asymmetry).
- **Case-report-only human safety signal, not controlled trial evidence:** BPC-157 (n=2 IV safety pilot), Melanotan II (multiple independent case reports of priapism, rhabdomyolysis, and melanoma — a genuine safety signal from case reports, not a controlled trial, and not to be read as "no evidence" either).
- **Conflicting human RCT evidence:** GHK-Cu (null on objective measures, positive only on a subjective outcome), Glutathione (oral-supplementation trials disagree on whether biomarkers change at all).
- **No independently verifiable literature located under the compound's own name:** Adamax, Cartalax, PE-22-29 (see §6).

## 8. Unresolved / follow-up work (updated — items resolved by this closeout are marked done; new items added)

- ~~The 5 pilot compounds' pre-existing legacy claims were never run through legacy-claim reconciliation~~ — **RESOLVED in this closeout** (§0, §3). All 36 pilot legacy claims are now reconciled.
- ~~10 claims misclassified as "contradicted" on flawed molecule-vs-product regulatory reasoning~~ — **RESOLVED in this closeout** (§0, §5).
- **Retatrutide's FDA warning-letter source** (`fda-glp1-solution-warning-2025`) — still not fully re-verified via direct page fetch; unresolved.
- **Semax's "registered in Russia since 1994" claim** — still deliberately excluded (no authoritative source found); unresolved.
- **Thymosin Alpha-1's country-by-country approval footprint** (35+ countries) — still reflects cross-corroborated secondary reporting only; unresolved.
- **Cagrilintide's CagriSema NDA filing** — still sourced from a company press release only; unresolved.
- **Tirzepatide's Zepbound/OSA approval dates, and SS-31's exact approval date/NDA number** — still not independently re-verified against dedicated FDA documents; unresolved (see §6 item 8).
- **PT-141's manufacturer/commercial-rights chain** — new item from this closeout, not independently re-verified against FDA's own record (see §6 item 7).
- **Systemic `fda.gov` direct-fetch failures** — unchanged; most FDA facts across this whole project were verified via cross-corroborated search results and the FDA label PDFs that did fetch successfully, but individual pages sometimes could not be fetched directly.
- **Extending this pipeline beyond the current 56 compounds** — not applicable; all 56 are now processed and reconciled.

## 9. Process note (already disclosed mid-run, repeated here for completeness)

`scripts/enrichment/data/epithalon-compound.mjs` existed as an untracked, uncommitted file before this session began. It was overwritten by a `Write` call without first reading its prior content — an error against this project's "preserve existing content" rule. No git history exists for that file (it was never committed), so the original content is unrecoverable. The current file is freshly, independently researched with real verified citations; nothing false was introduced, but continuity with whatever the earlier draft contained was lost.

## 10. Tests performed

**Six-batch run:**
- No dedicated automated test suite for the enrichment pipeline scripts (consistent with the pre-existing `scripts/migration/import-to-supabase.mjs`, also untested by the CI suite).
- Per-batch verification (`scripts/enrichment/verify-batch.mjs`), run after every one of the 6 batches: draft-status, citation-integrity, claim-support, duplicate-identifier checks, and per-compound counts.
- Idempotency tested after every batch: re-running produced `already_enriched` for 100% of compounds with zero new inserts.

**Closeout pass (2026-08-07), this report's new work:**
- Extended `run-enrichment.mjs` with a "reconciliation-only" mode (see the script's own header comment) so already-enriched compounds could have new/revised `legacyReconciliations` applied without re-inserting existing sources/claims/regulatory records.
- New one-time script `closeout-regulatory-identity-2026-08-07.mjs`, with a built-in safety check (refuses to overwrite a claim/record whose current text doesn't match the expected prior or corrected text) before every UPDATE.
- Ran the reconciliation pass for all 12 affected compounds: 0 errors, 0 non-draft compounds afterward.
- Ran the regulatory-identity closeout script: 8 claims + 10 regulatory_records updated, 0 errors.
- **Idempotency**: re-ran both scripts a second time — the reconciliation pass reported the same 9-per-compound reconciled count with 0 new `claim_sources` inserts; the closeout script reported "0 updated, 8/10 already correct."
- **Focused integrity audit** (`verify-batch.mjs` across all 13 affected compounds — the 12 changed plus Semax as an untouched control): 0 non-draft, 224 `claim_sources` rows for this set all resolve, 0 duplicate identifiers, 0 claims missing required rationale, exactly 3 `content_revisions` per changed compound (1 original + 2 from this closeout's two runs) and exactly 1 for the untouched Semax control — confirming nothing outside the intended 12 compounds was touched.
- **Whole-database final verification**: 56/56 draft, 609/609 claims draft, 0 duplicate identifiers (of 157), 0 remaining `contradicted` claims (down from 10). Disposition totals were cross-checked arithmetically against the pre-closeout totals from §3: supported 345→387 (+9 from reclassified disclaimers, +33 from pilot), revised 72→75 (+1 from a reclassified Tirzepatide claim, +2 from pilot), unsupported 43→44 (+1 from pilot), contradicted 10→0 — every unit of change traced to a specific reconciliation, none unaccounted for.
- Unrelated project test suites (Vitest unit, Playwright e2e, axe accessibility, shop/cart) were **not** rerun at any point — nothing application/UI-facing was touched by either the six-batch run or this closeout.

## 11. All commits created (chronological, six-batch run + closeout)

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
| `b3313bf` | docs(research): full coverage report — all 56 compounds enriched (draft) |
| *(this closeout — committed after this report)* | fix(research): reconcile pilot legacy claims + correct molecule-vs-approved-product regulatory reasoning (draft) |

All pushed to `rebuild/astro-platform`. `main` was never touched. No production deployment, DNS change, or domain activation occurred at any point.

## 12. Confirmation

- **56 / 56 compounds remain `status = 'draft'`** — live-verified after the closeout, not assumed.
- **609 / 609 claims remain `status = 'draft'`** — 0 published anywhere.
- **506 / 506 legacy claims across all 56 compounds are now reconciled** (Semax has 0 to reconcile) — the pilot's remaining gap is closed.
- **0 claims remain classified "contradicted"** anywhere in the database (down from 10) — every instance was a regulatory-reasoning error, now corrected and reclassified with claim-level citations.
- **0 duplicate source identifiers**, **0 orphaned claim_sources links**, **0 claims missing required rationale** — all live-verified post-closeout.
- Nothing was published, merged to `main`, deployed to production, or exposed via DNS/domain changes at any point in this run or this closeout.
