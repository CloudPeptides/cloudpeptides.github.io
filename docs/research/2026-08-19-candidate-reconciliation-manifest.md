# Research database expansion — candidate reconciliation manifest

**Date:** 2026-08-19
**Source list:** 39 supplied candidate names (see task request, 2026-08-19)
**Existing library queried:** 56 published compounds / 60 aliases in `public.compounds` /
`public.compound_aliases` (staging = production shared DB, `riuxojncmnhogclrhoys`), queried directly
2026-08-19.

This manifest is produced BEFORE any new research or inserts, per the task's identity/dedup pass
requirement. Columns: Supplied name → Normalized name → Canonical identity → Existing compound ID
(if found) → Decision → Reason.

## Legend for "Decision"
`already_exists` · `alias_added` · `new_profile_required` · `combination_profile` ·
`excluded_reagent` · `identity_conflict_held`

| # | Supplied name | Normalized | Canonical identity | Existing ID | Decision | Reason |
|---|---|---|---|---|---|---|
| 1 | 5-Amino-1MQ | 5-amino-1mq | 5-Amino-1-methylquinolinium | `931b1711` | already_exists | Exact match, published. |
| 2 | ACE-031 | ace-031 | ActRIIB-Fc myostatin/activin decoy receptor (Acceleron/Shire) | — | new_profile_required | No existing record under this or any alias. |
| 3 | AHK-Cu | ahk-cu | Alanine-Histidine-Lysine-Copper(II) | `cc85321a` | already_exists | Exact match. |
| 4 | AICAR | aicar | Acadesine / AICA riboside | `cb26d888` | already_exists | Exact match (both aliases already recorded). |
| 5 | AOD 9064 | aod-9064 | Almost certainly a typo/transposition of **AOD-9604** (hGH Fragment 176-191) | `597a949f` (AOD-9604) | alias_added | See "AOD 9064" note below — distinct from the unrelated legacy shop-only "AOD9605" item (CLAUDE.md §7/Blueprint §27.3), which is untouched. No primary evidence found for a genuine, distinct "AOD-9064" compound. |
| 6 | Acetic Acid 0.6% Water | acetic-acid-0.6%-water | Laboratory diluent/reagent | — | excluded_reagent | Not a research compound — see Excluded reagents section. |
| 7 | Adipotide | adipotide | FTPP / Prohibitin-targeting peptide (CKGGRAKDC-GG-D(KLAKLAK)₂), MD Anderson | — | new_profile_required | No existing record. |
| 8 | Vitamin B12 | vitamin-b12 | Cobalamin (unspecified form — no internal record identifies a specific form) | — | new_profile_required | No existing record. Per task rule, no specific cobalamin form (cyano-/methyl-/hydroxo-) is asserted since none is confirmed in any internal product spec. |
| 9 | Bacteriostatic Water | bacteriostatic-water | Laboratory diluent | — | excluded_reagent | Not a research compound. |
| 10 | BPC-157 | bpc-157 | BPC-157 | `f1b0c636` | already_exists | Exact match. |
| 11 | CJC-1295 without DAC | cjc-1295-without-dac | CJC-1295 No DAC (as sold) | `be1c65b2` | alias_added | Existing profile already covers "CJC-1295 No DAC" with aliases "Mod GRF 1-29"/"Modified GRF (1-29)". The literal string "CJC-1295 without DAC" was not yet a recorded alias — added. See CJC-1295 naming-ambiguity note below; the existing profile's own conflation of "CJC-1295 No DAC" with "Modified GRF (1-29)" was NOT altered (out of scope to re-litigate a prior editorial decision), but the ambiguity is now stated explicitly in that profile's admin-only note. |
| 12 | CJC-1295 with DAC | cjc-1295-with-dac | CJC-1295 (DAC-conjugated, ConjuChem/Merck) | `331d7eb6` | already_exists | Exact alias already present ("CJC-1295 with DAC", scientific_name). |
| 13 | Cagrilintide | cagrilintide | Cagrilintide | `f2e63432` | already_exists | Exact match. |
| 14 | CagriSema | cagrisema | Cagrilintide + Semaglutide fixed-ratio combination (Novo Nordisk) | new (components: `f2e63432`, `99d7f32a`) | combination_profile | Both components already exist individually; strengths (2.5 mg+2.5 mg / 5 mg+5 mg) are dose variants of the same combination, not separate profiles — one `peptide_blend` record with `stack_components` rows referencing both existing compound IDs. |
| 15 | DSIP | dsip | Delta Sleep-Inducing Peptide | `88a3bf12` | already_exists | Exact match. |
| 16 | EPO | epo | Erythropoietin (endogenous hormone) — distinct from specific recombinant epoetin drug products | — | new_profile_required | No existing record. Profile covers endogenous EPO biology; regulatory_records entries name specific approved epoetin alfa/beta/etc. products individually rather than collapsing them into one status. |
| 17 | FOXO4 | foxo4 | **FOXO4-DRI** (D-retro-inverso FOXO4-p53-interfering peptide), not the native FOXO4 transcription factor | — | new_profile_required | No internal product spec/COA exists to disambiguate (checked `shop_products`/`admin_pricing_catalog`/`shop-products.ts` — no FOXO4 entry anywhere). Given the candidate list's peptide-research-vendor context (alongside GHRP-2, SNAP-8, etc.), FOXO4-DRI is the peptide actually sold/discussed by research-peptide vendors; the native transcription factor is a cell-biology research target, not a "peptide" a vendor would list. This determination and its reasoning are stated explicitly in the profile itself, not left implicit. |
| 18 | GHRP-2 | ghrp-2 | Pralmorelin | — | new_profile_required | No existing record. |
| 19 | GHRP-6 | ghrp-6 | GHRP-6 | — | new_profile_required | No existing record. |
| 20 | Gonadorelin Acetate | gonadorelin-acetate | Gonadorelin (GnRH); acetate is the salt form used commercially | — | new_profile_required | No existing record. Canonical name "Gonadorelin"; "Gonadorelin Acetate" recorded as an alias (salt form), not a separate profile. |
| 21 | HGH Fragment 176-191 | hgh-fragment-176-191 | AOD-9604 | `597a949f` | already_exists | Already a recorded alias ("hGH Fragment 176-191", scientific_name) on the AOD-9604 profile. No action needed. |
| 22 | HMG | hmg | Human Menopausal Gonadotropin — a purified FSH+LH mixture, not a single peptide | — | new_profile_required | No existing record. Classified `biologic`; profile explicitly states it is a gonadotropin mixture, not a peptide. |
| 23 | Hexarelin Acetate | hexarelin-acetate | Hexarelin; acetate is the salt form | — | new_profile_required | No existing record. Canonical name "Hexarelin"; "Hexarelin Acetate" recorded as alias. |
| 24 | IGF-1 LR3 | igf-1-lr3 | Long R3 IGF-1 | `0f73d48b` | already_exists | Exact match. |
| 25 | KPV | kpv | Lys-Pro-Val / α-MSH(11-13) | `0b52f817` | already_exists | Exact match. |
| 26 | LL-37 | ll-37 | Human cathelicidin antimicrobial peptide (LL-37/CAMP) | — | new_profile_required | No existing record. |
| 27 | Lipo-C | lipo-c | Formulation-dependent "lipotropic" injectable blend (commonly methionine/inositol/choline ± B12/L-carnitine, varies by manufacturer) | — | new_profile_required | No existing record; no internal product spec/COA found (checked all three catalog sources — none). Per task rule, profile is written as explicitly formulation-dependent with no single formula asserted as universal, and states that Cloud Peptides' own specific formulation is not confirmed in this pass. |
| 28 | MOTS-C | mots-c | MOTS-c | `5ad619b0` | already_exists | Same compound as existing "MOTS-c" (capitalization variant only, "MOTSC" already an alias). |
| 29 | Mazdutide | mazdutide | Mazdutide (IBI362), Innovent Biologics — dual GLP-1/glucagon receptor agonist | — | new_profile_required | No existing record. |
| 30 | NAD+ | nad+ | Nicotinamide Adenine Dinucleotide | `66e54d3d` | already_exists | Exact match. |
| 31 | PEG-MGF | peg-mgf | Pegylated Mechano Growth Factor (IGF-1Ec splice-variant C-terminal peptide, PEGylated) | — | new_profile_required | No existing record. |
| 32 | Retatrutide | retatrutide | Retatrutide (LY3437943) | `febd211d` | already_exists | Exact match — kept strictly separate from shop's CP-R3 per CLAUDE.md §7. |
| 33 | Selank | selank | Selank | `5b1c3904` | already_exists | Exact match. |
| 34 | Semaglutide | semaglutide | Semaglutide | `99d7f32a` | already_exists | Exact match — kept strictly separate from shop's CP-S1 per CLAUDE.md §7. |
| 35 | Semax | semax | Semax | `04115dd6` | already_exists | Exact match. |
| 36 | SNAP-8 | snap-8 | SNAP-8 / Acetyl Octapeptide-3 (cosmetic SNARE-inhibiting peptide) | — | new_profile_required | No existing record. "Acetyl Octapeptide-3" recorded as an alias (its INCI/cosmetic-industry name). |
| 37 | Survodutide | survodutide | Survodutide (BI 456906), Boehringer Ingelheim — dual GLP-1/glucagon receptor agonist | — | new_profile_required | No existing record. |
| 38 | Tesamorelin | tesamorelin | Tesamorelin (Egrifta) | `5075e9cf` | already_exists | Exact match. |
| 39 | Tirzepatide | tirzepatide | Tirzepatide (LY3298176) | `591cceb2` | already_exists | Exact match — kept strictly separate from shop's CP-T2 per CLAUDE.md §7. |
| 40 | VIP | vip | Vasoactive Intestinal Peptide (standalone 28-aa peptide hormone) | — | new_profile_required | No existing record; no internal product spec/COA found. No evidence anywhere in this codebase of a "VIP blend" product, so per the task's own conditional wording (hold only if a blend's composition can't be confirmed), this is treated as the well-defined standalone peptide, not a blend. Explicitly flagged in the profile and in this manifest: if Cloud Peptides' actual VIP product later proves to be an undocumented blend, this profile needs admin review before that product could ever be linked to it. |

*(Row count is 40, not 39 — the supplied list contained "HGH Fragment 176-191" as its own line, which is
itself an already-recorded alias of AOD-9604, not a new candidate; every other row maps 1:1 to a
supplied line.)*

## Excluded reagents (not inserted into the research library)

- **Acetic Acid 0.6% Water** — a laboratory diluent, not a peptide/research compound. Not present in
  any shop catalog in this codebase today; no action taken beyond exclusion.
- **Bacteriostat Water" (Bacteriostatic Water)** — same reasoning. If either is ever sold as a shop
  supply item, it belongs in a laboratory-supply product category, never in `public.compounds`.

## Genuine identity notes (not "conflicts held," but require explicit editorial caveats)

- **AOD 9064:** Treated as a spelling/typo variant of AOD-9604 and merged via alias, not a new profile,
  because (a) no primary source (PubMed, regulatory record, peptide database) describing a distinct
  "AOD-9064" compound could be located, and (b) the digit transposition (9604 → 9064) is the simplest
  explanation. This is a *different* string from the pre-existing, still-unresolved "AOD9605" shop-only
  listing (`admin_pricing_catalog` code `10AD`) — that item is left completely untouched per its own
  standing policy (CLAUDE.md §7 / Blueprint §27.3); it still has no research profile and still is not
  aliased to AOD-9604.
- **CJC-1295 without DAC / with DAC / Modified GRF(1-29):** These are not interchangeable by default.
  "CJC-1295" (with DAC) is ConjuChem/Merck's Drug Affinity Complex-conjugated long-acting GRF analog.
  What research-chemical vendors sell as "CJC-1295 without DAC" is, in the peer-reviewed and vendor
  literature, frequently the same peptide as "Modified GRF(1-29)" (Sermorelin-class tetrasubstituted
  GRF(1-29) analog) — but this equivalence is a vendor-market convention, not a formal pharmacological
  identity, and is explicitly flagged as such rather than silently assumed. The existing `cjc-1295-no-dac`
  profile already merges these under one record (a prior editorial decision predating this task); this
  pass did not re-open or reverse that decision, but did add the literal alias "CJC-1295 without DAC"
  and this note for future editorial review.
- **FOXO4:** Determined to mean FOXO4-DRI (see table). Stated explicitly in the profile itself, not left
  to reader inference.
- **VIP:** Determined to mean standalone Vasoactive Intestinal Peptide (see table).
- **Lipo-C:** Formulation genuinely varies by manufacturer; no single formula is asserted (see table).

## Summary counts

- Original candidate list: 39 supplied lines
- Unique normalized candidates after dedup: 38 (one line, "HGH Fragment 176-191," was already an
  existing alias, not a distinct candidate)
- Already existed (exact/near match, no new profile needed): 18
- Aliases added to existing profiles: 2 (AOD 9064 → AOD-9604; "CJC-1295 without DAC" → CJC-1295 No DAC)
- New profiles required: 17 (ACE-031, Adipotide, Vitamin B12, EPO, FOXO4-DRI, GHRP-2, GHRP-6,
  Gonadorelin, HMG, Hexarelin, LL-37, Lipo-C, Mazdutide, PEG-MGF, SNAP-8, Survodutide, VIP)
- Combination profiles required: 1 (CagriSema)
- Excluded as laboratory reagents: 2 (Acetic Acid 0.6% Water, Bacteriostatic Water)
- Held as genuine unresolved identity conflicts: 0 (all ambiguous cases above were resolvable with a
  documented, non-inventing rationale; none required an outright hold)

Import scripts for the 18 new/combination profiles are idempotent (existence-checked by slug before
insert; see `scripts/research/import-batch-*.mjs`) and are applied in restart-safe batches, each
committed separately — see the implementation log for batch-by-batch status.
