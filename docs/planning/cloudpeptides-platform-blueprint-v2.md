# Cloud Peptides — Platform Blueprint v2

**Status:** Planning only. Nothing has been built, no accounts created, no dependencies installed, no repository files touched.
**Supersedes:** Blueprint v1. This document incorporates your 12 decisions and the full set of corrections you sent — data model, security model, editorial policy, and 15 additional requirements. Where v1 already had it right and nothing changed, I've kept it brief and said so; where you asked for a rebuild, it's rebuilt in full.

---

## 0. Your Decisions — Confirmed

| # | Decision | Status |
|---|---|---|
| 1 | Framework: Astro | Confirmed |
| 2 | React islands only where real interactivity is needed | Confirmed |
| 3 | TypeScript, Tailwind, Astro, Supabase client libs, testing libs, Resend | Confirmed |
| 4 | Custom domain planned; exact domain TBD | Noted — everything below is written domain-agnostic |
| 5 | Organized nested canonical URLs, with permanent redirects from every legacy URL | Confirmed — see §4 |
| 6 | Design: Botanical Field Guide + Soft Sprout combined | Confirmed — full visual system deferred to the post-approval mockup phase you requested |
| 7 | Search: Supabase Postgres FTS + pg_trgm now, Meilisearch upgrade path preserved | Confirmed — unchanged from v1 |
| 8 | Analytics: Cloudflare Web Analytics at launch | Confirmed — unchanged from v1 |
| 9 | Commerce: preserve existing shop/cart behavior only, no new payment processing | Confirmed |
| 10 | Research and commerce visually/editorially/structurally separated | Confirmed — see §15 |
| 11 | Brand assets are just the logo PNG today; plan a real brand-asset phase | Noted — added as its own line item in the roadmap (§26) |
| 12 | Staging environment + staging Supabase project; production untouched | Confirmed — unchanged from v1 |

---

## 1. Architecture Decision: Cloudflare Workers, Not Pages

You asked me not to default to Pages just because v1 named it — I re-checked against current official documentation rather than assuming, and the answer changed.

**Finding:** As of 2026, Cloudflare's own guidance is explicit: *"Now that Workers supports both serving static assets and server-side rendering, you should start with Workers."* Pages is described as being in maintenance mode — it still works and isn't going away, but all new platform investment (Cron Triggers, native Durable Objects support, Workers Logs/observability, Email Workers, Rate Limiting, Queue consumers) is landing on Workers, not Pages. Astro's own official deployment docs now say the same thing directly: *"Cloudflare recommends using Cloudflare Workers for new projects."* Astro's official `@astrojs/cloudflare` adapter already targets Workers (using the `workerd` runtime, with static assets served via a Workers `[assets]` binding and Astro's server-rendered routes running as the Worker itself).

**Recommendation: deploy to Cloudflare Workers directly, using Astro's official Cloudflare adapter, via Wrangler.** Practically, this changes very little from what v1 described — you still get git-based deploys and preview environments (via Wrangler + GitHub Actions rather than Pages' built-in git integration, which requires slightly more CI setup on our side but is well-documented), the same edge network, and the same "static pages served instantly, Worker code runs only for dynamic routes" behavior. What it gains you: native Cron Triggers (needed for the link-health-check job in §18), first-class Durable Objects support if a future feature needs stateful edge logic, and better observability tooling — and it avoids building on a product Cloudflare has told developers not to start new projects on.

**Trade-off to flag honestly:** Pages' git-push-and-done workflow is slightly more turnkey out of the box; Workers deployment via Wrangler + CI is a small amount of extra setup in Phase 1. I think that's clearly worth it here given Cloudflare's own direction, but wanted the trade-off on the record rather than hidden.

---

## 2. Storage: Repository Assets vs. Supabase Storage vs. Cloudflare R2

You asked me not to reach for R2 just because it's available. Comparing the three real options:

| | Repo-managed static assets | Supabase Storage | Cloudflare R2 |
|---|---|---|---|
| Admin can upload new images at runtime | No — requires a code deploy | Yes | Yes |
| Access control | None needed (all public) | Built-in, ties directly into the same RLS/auth system as the rest of the data | Needs its own access-control layer built manually (not RLS-aware out of the box) |
| Image transformation (resize/format on request) | No | Built-in | Needs a separate Cloudflare Images add-on or custom Worker logic |
| Egress cost | N/A (bundled with hosting) | Usage-based, can add up at scale | Zero egress fees — cheapest at real scale |
| Operational simplicity | Simplest | Simple — one dashboard, one project, one RLS model | An extra service/account to manage and secure separately |

**Recommendation:** Use **Supabase Storage** for admin-uploaded compound images, diagrams, and generated Open Graph images at launch. It shares the same project, the same RLS/auth model as everything else (an admin upload policy is just another RLS policy, not a second security system to design), and includes basic image transforms. **Keep repository-managed static assets** for anything that isn't admin-editable — the logo, icons, fixed marketing imagery. **Revisit R2 later, specifically if and when image egress volume actually becomes a meaningful cost** (§25 gives you the numbers to watch for that trigger) — not by default. This directly answers your instruction: R2 is the *scaling* answer, not the *starting* answer.

---

## 3. Confirmed Technology Stack

| Layer | Choice | Change from v1 |
|---|---|---|
| Framework | Astro, hybrid rendering | Unchanged |
| Interactive components | React islands, used sparingly | Unchanged, now explicit that static content never becomes a React island by default |
| Styling | Tailwind CSS | Unchanged |
| Database | Supabase (Postgres) | Unchanged |
| Auth | Supabase Auth | **Access-control mechanism revised — see §16** |
| Hosting | **Cloudflare Workers** (via `@astrojs/cloudflare`) | **Changed from Pages — see §1** |
| Server logic | Worker routes (formerly "Pages Functions") | Same concept, new home |
| File/image storage | **Supabase Storage** for admin uploads; repo assets for fixed brand imagery | **Changed from R2 — see §2** |
| Email | Resend, server-side only | Unchanged |
| Search | Postgres FTS + pg_trgm, Meilisearch upgrade path documented | Unchanged |

---

## 4. Information Architecture & Route Map

Unchanged in substance from v1 — full route list preserved. Per your decision #5, canonical URLs are now confirmed as **organized and nested** (e.g., `/research/compounds/bpc-157` rather than a flat `/bpc-157`), with a complete legacy-URL redirect map (§26, Phase "Cutover") issuing permanent (301) redirects from every current `.html` path. This trades a larger one-time redirect list for a cleaner long-term structure — the right call for a platform meant to grow well past its current ~90 pages.

One structural addition driven by §11 (taxonomy) and §13 (canonicalization): stack/blend pages now live under their own route and pull component-compound summaries by reference rather than duplicating them:

```
/research/stacks/[slug]            → renders from stack_components join, not hand-duplicated text
```

---

## 5. Scientific Data Model — Evidence Type, Quality, and Interpretation (Rebuilt)

This was the most important correction, and I've redesigned it as three genuinely independent fields rather than one conflated rating.

**Evidence Type / Provenance** — an objective, factual classification of *what kind of source this is*. Never a judgment call.
```
rct_human · non_randomized_human_trial · human_observational · case_report_or_series ·
systematic_review · meta_analysis · narrative_review · animal_study · in_vitro_study ·
mechanistic · regulatory_document · official_database_record · anecdotal_report
```
This lives on the **source** (§7) — for a study, as `studies.study_design`; for a non-study source, as `sources.source_type`. Per your instruction, **anecdotal reports are not a formal study type** — they exist only as a `sources.source_type = 'anecdotal_report'` with no associated `studies` row at all.

**Evidence Quality / Certainty** — a separate, deliberate judgment about how much confidence the *body of evidence behind a specific claim* deserves.
```
high · moderate · low · very_low · not_assessed
```
This lives on the **claim** (§6), not the source, because one claim can be backed by several sources of mixed type and quality. Per your instruction, this field **can never be auto-derived from evidence type alone** — the schema enforces that every non-`not_assessed` quality rating requires a filled `quality_rationale` text field written by an editor, explaining the reasoning (e.g., "single small human trial, no replication, industry-funded — downgraded from moderate to low").

**Interpretation Status** — the plain-language state of scientific consensus for a claim, meant for a reader who isn't going to parse quality ratings themselves.
```
established · supported · preliminary · conflicting · insufficient · unknown
```
Also lives on the claim. This is what actually renders as the visible badge on a compound page — quality/rationale is available on click-through for anyone who wants the reasoning.

---

## 6. Claim-Level Citation Model

Large free-text fields (mechanism, pharmacokinetics, origin, regulatory status, adverse effects, interactions, storage, FAQs) are eliminated as single blobs. Instead, content is built from atomic **claims**, each independently sourced:

```sql
create table claims (
  id uuid primary key default gen_random_uuid(),
  compound_id uuid references compounds(id) on delete cascade,
  content_section text not null check (content_section in
    ('summary','mechanism','pharmacokinetics','origin','regulatory',
     'adverse_effects','interactions','storage','faq','safety')),
  statement text not null,               -- the atomic factual claim itself
  evidence_quality text check (evidence_quality in
    ('high','moderate','low','very_low','not_assessed')),
  quality_rationale text,
  interpretation_status text check (interpretation_status in
    ('established','supported','preliminary','conflicting','insufficient','unknown')),
  display_order int,
  status text not null default 'draft',  -- mirrors compound-level draft/review/published
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quality_rationale_required
    check (evidence_quality is null or evidence_quality = 'not_assessed' or quality_rationale is not null)
);

create table claim_sources (
  claim_id uuid references claims(id) on delete cascade,
  source_id uuid references sources(id) on delete cascade,
  relationship text not null check (relationship in
    ('directly_supports','indirectly_supports','contradicts','provides_context')),
  locator text,                          -- page, section, figure, table, or "abstract"
  date_accessed date not null,
  primary key (claim_id, source_id)
);
```

A rendered compound page assembles its "Mechanism of Action" section, for example, by rendering the ordered list of `claims` where `content_section = 'mechanism'`, each with its own citation chips pulled from `claim_sources`. There is no path for an editor to write an uncited paragraph into a compound page — the schema doesn't have a field for that anymore.

---

## 7. Generalized Source Model

Replaces the v1 design that required every citation to belong to a study.

```sql
create table sources (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in
    ('pubmed_article','doi_article','clinicaltrials_gov','fda_document','ema_document',
     'wada_list','pubchem_record','uniprot_record','patent','regulatory_announcement',
     'systematic_review','official_database_record','anecdotal_report','other')),
  study_id uuid references studies(id),  -- nullable: most non-study sources have no study
  title text not null,
  url text not null,
  publisher_or_agency text,
  publication_date date,
  retrieved_date date not null,
  retraction_status text not null default 'none' check (retraction_status in
    ('none','corrected','retracted','expression_of_concern')),
  retraction_note text,
  retraction_checked_at date
);

create table source_identifiers (
  source_id uuid references sources(id) on delete cascade,
  identifier_type text not null check (identifier_type in
    ('doi','pmid','nct_number','patent_number','cas_number','pubchem_cid','other')),
  identifier_value text not null,
  primary key (source_id, identifier_type, identifier_value)
);

-- Global uniqueness: the same DOI/PMID/NCT number/etc. cannot be attached to two
-- different source records — this is what actually prevents accidental duplicate
-- source entry, not just the composite primary key above.
create unique index source_identifiers_globally_unique
  on source_identifiers (identifier_type, identifier_value);
```

A study can have several `sources` rows pointing back to it via `study_id` (the paper itself, its trial registration, a later correction notice) — but a source (an FDA label, a PubChem record, an anecdotal forum report) never requires a study to exist. This is the exact cardinality you asked for.

---

## 8. Expanded Study Model

```sql
create table studies (
  id uuid primary key default gen_random_uuid(),
  study_design text not null check (study_design in
    ('rct_human','non_randomized_human_trial','human_observational','case_report_or_series',
     'systematic_review','meta_analysis','narrative_review','animal_study','in_vitro_study',
     'mechanistic')),
  population text,
  sample_size int,
  comparator text,
  intervention text,
  route text,
  published_research_dose text,
  duration text,
  primary_outcomes text,
  secondary_outcomes text,
  results_summary text,
  limitations text,
  funding_source text,
  conflicts_of_interest text,
  registration_number text,
  peer_review_status text check (peer_review_status in
    ('peer_reviewed','preprint','not_peer_reviewed','unknown')),
  created_at timestamptz not null default now()
);
```

Note `anecdotal` is deliberately absent from `study_design` — confirmed per your instruction, anecdotal reports live only as a `sources.source_type`, never as a `studies` row. Retraction/correction status is tracked per-**source** (§7), since a single study can have multiple linked sources with independently different statuses (e.g., the original paper retracted, but its trial registration entry unaffected) — the admin UI shows the most severe status of any linked source as a study-level warning.

---

## 9. Regulatory Model

Replaces the three flat text fields (`regulatory_status_fda`/`_ema`/`_wada`) entirely.

```sql
create table regulatory_records (
  id uuid primary key default gen_random_uuid(),
  compound_id uuid references compounds(id) on delete cascade,
  agency text not null,                  -- 'FDA', 'EMA', 'WADA', or other
  jurisdiction text not null,             -- 'US', 'EU', 'Global', etc.
  formulation text,
  indication text,
  regulatory_status text not null check (regulatory_status in
    ('approved','not_approved','withdrawn','discontinued','investigational',
     'banned_in_sport','scheduled_controlled_substance','unscheduled',
     'no_determination','other')),
  effective_date date,
  status_change_date date,
  source_id uuid references sources(id) not null,   -- every status claim must cite something
  last_verified_date date not null,
  notes text
);
```

A single compound can now carry many `regulatory_records` — FDA has one status for one indication, EMA a different one, WADA a sport-specific banned-substance entry — with no schema field anywhere implying a compound has one universal status. Every record requires a source and a last-verified date, so "regulatory status" is never presented without a citation and a freshness signal.

---

## 10. Canonical Compound & Alias Strategy

- Every real substance has exactly **one canonical compound record**, identified by `compounds.slug`.
- `compound_aliases` (unchanged from v1) holds every other name it's known by — abbreviation, brand name, research code, common misspelling.
- **Alias pages don't create duplicate content.** An alias resolves to the canonical URL (redirect) or, where an alias is commonly searched-for enough to deserve its own indexed page, that page renders the same canonical content with an "also known as" banner and a `rel=canonical` tag pointing back to the primary URL — never a second copy of the actual content.

---

## 11. Taxonomy: Compounds, Blends, Stacks, Drugs, Biologics, Supplements, Non-Peptide Compounds

```sql
alter table compounds add column entity_kind text not null check (entity_kind in
  ('peptide','peptide_blend','stack','small_molecule_drug','biologic',
   'supplement','non_peptide_research_compound'));

create table stack_components (
  stack_id uuid references compounds(id) on delete cascade,
  component_compound_id uuid references compounds(id) on delete cascade,
  dose_or_ratio_note text,
  primary key (stack_id, component_compound_id)
);
```

A "stack" or "blend" is a compound record like any other (so it gets its own citations, evidence claims about the *combination itself* where such evidence exists, and a canonical URL) — but it also declares its component compounds via `stack_components`, and its page pulls each component's own summary by reference rather than re-explaining it. This is what fixes the Wolverine Stack / BPC-157+TB-500 duplicate-page problem from the v1 audit at the schema level, not just as an editorial reminder.

---

## 12. Questionable-Identity Policy

```sql
alter table compounds add column identity_confidence text not null default 'unverified'
  check (identity_confidence in ('verified','disputed','unverified','likely_naming_variant'));
```

**Policy:** A compound cannot be marked `verified` without at least one `source` of type `pubchem_record`, `uniprot_record`, `doi_article`, or an equivalent authoritative record confirming its identity/sequence. Where a shop product name doesn't clearly match any verified research compound, the platform **must not silently alias it to the nearest-sounding verified compound.** It either gets its own `unverified` or `likely_naming_variant` record with an explicit disclosure, or the shop listing links to no research page at all until verified — never a silent, unstated assumption of equivalence.

This directly names the open question flagged in the v1 audit: **"AOD9605" needs manual verification before any content is written for it** — I don't have a reliable basis to confirm whether it's a genuine distinct compound, a naming variant of AOD-9604, or a labeling error, and I'm not going to guess in content that reads as authoritative. This goes on your research-content to-do list, not mine to resolve here.

---

## 13. Duplicate-Content & Canonicalization Rules

- One canonical URL per compound/stack/blend record, enforced via `rel=canonical` sitewide.
- Legacy URLs and alias URLs redirect (or self-canonicalize) rather than existing as independent indexable content — see §10 and §26.
- The content-validation workflow (§17) includes an automated check for near-duplicate `claims.statement` text across different compounds, flagged for editor review rather than silently allowed — catches accidental copy-paste duplication before publish, not just structural duplication.

---

## 14. Editorial Integrity & Content Policy

New section, direct response to your request. This becomes real published content on the site (an `/about/editorial-policy` page or similar), not just an internal document:

- **Editorial policy** — who writes/reviews content, what "published" means, how content gets updated.
- **Citation policy** — the claim-level sourcing model from §6, stated in plain language for readers.
- **Corrections policy** — how the public feedback mechanism (§24) becomes a published correction, with a visible correction log per compound.
- **Conflict-of-interest disclosure** — standing statement that Cloud Peptides sells some of the compounds discussed in its research library, and how editorial content is kept independent of that fact.
- **Author and reviewer attribution** — every published compound page shows who last reviewed it (`content_revisions.editor_id` from v1, retained) and when.
- **Scientific last-reviewed dates** — visible on every compound page, not just tracked internally.
- **Hard structural rule, enforced in the admin editor, not just written policy:** the Evidence, Safety, and Regulatory sections of a compound page render **no purchase links, no shop cross-sells, no pricing** — the admin UI for those content sections simply has no field for one. Commerce touchpoints live only in a clearly separated area of the page (§15).
- **Hard rule:** Janoshik or other batch Certificates of Analysis are never entered as a `source` for a scientific `claim`. They get their own separate structure (next section) and are never citable as evidence of a compound's biological effects.

**Batch testing / COA data model (separate from evidence):**
```sql
create table batch_coas (
  id uuid primary key default gen_random_uuid(),
  product_id uuid,                       -- references the shop product, not a research compound
  batch_identifier text not null,
  test_date date,
  testing_lab text not null,             -- e.g. 'Janoshik'
  coa_file_url text not null,            -- Supabase Storage
  purity_result text,
  uploaded_at timestamptz not null default now()
);
```
This lives entirely in the commerce data domain (§15) and is never joined into a compound's evidence claims.

---

## 15. Research ↔ Commerce Separation

- **Structural:** research content (`compounds`, `claims`, `sources`, `studies`, `regulatory_records`) and commerce content (`products`, `orders`, `batch_coas`, cart logic) are entirely separate table groups with no foreign key from a `claims`/`sources`/`regulatory_records` row into commerce data.
- **Editorial:** a compound's Evidence/Safety/Regulatory sections carry no purchase prompts (§14). A compound page *may* include a clearly labeled, visually distinct "Available in our shop" module — but it's a single well-defined component, not something an editor can drop into the middle of a safety discussion.
- **Visual:** the design system (§21 of v1, revisited once approved) gives research and shop distinct-but-related visual treatments so a reader always knows which "mode" of the site they're in.
- **Disclosure:** when a compound discussed in the research library is also sold in the shop, that relationship is disclosed explicitly (a labeled note, not just an implicit link) — directly satisfying your instruction.

---

## 16. Security & Access Control (Rebuilt)

**The core problem with v1:** a `profiles.role` column readable and writable through normal client-side Supabase calls is not a secure authorization boundary — a user could, in principle, update their own row. **Corrected design**, based on Supabase's current official RBAC guidance:

- Roles are **not** stored as a client-editable column. They live in a `user_roles` table, writable only by service-role/trusted server contexts and by `admin`-role actions that go through a server-side check first — never directly by the user whose role it is.
- A **Custom Access Token Auth Hook** (Supabase's documented mechanism) runs at login/token-refresh, reads the user's role from `user_roles`, and embeds it as a **custom claim inside the signed JWT**. The JWT is signed by Supabase — a client cannot forge or edit its own claims.
- RLS policies call an `authorize()` Postgres function that reads the role **from the verified JWT claim**, not from a table join a client could manipulate:

```sql
create table user_roles (
  user_id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'member'
    check (role in ('member','contributor','editor','admin'))
);
-- user_roles itself: only readable by the owning user, only writable via service-role
-- (admin promotions happen through a server-side Worker route using the service-role key,
--  never through a direct client-side table write)
```

- **Service-role key** is used only inside trusted Worker routes for: user role changes, the migration script, the scheduled link-checker job, and other narrowly-scoped admin operations. **Every normal editorial action — drafting, editing, submitting for review — uses the acting user's own JWT and is enforced by RLS**, exactly as you specified, not by blanket service-role access.

**Every service-role Worker route, without exception, must have all of the following before it ships:**

| Requirement | What it means here |
|---|---|
| Authentication | Caller's own JWT is verified before the route does anything |
| Explicit authorization | The route checks the caller's role/claim for *this specific action*, not just "is logged in" |
| Input validation | Every parameter is schema-validated server-side, never trusted from the client |
| Rate limiting | Applied where the action could be abused (role changes, bulk operations) |
| Audit logging | Every service-role action is written to an append-only log — see `audit_log` below |
| Narrow scope | The route does exactly one privileged thing; it never becomes a general-purpose "admin passthrough" |
| Tests | A test proving an unauthorized/unauthenticated caller is rejected exists for every such route before it's considered done |

```sql
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  action text not null,              -- e.g. 'role_change', 'compound_published', 'user_deleted'
  target_table text,
  target_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);
```

**Required security test suite** (to be written as real Playwright/integration tests before Phase 5 is considered done, not just asserted here):

| Test | Expected result |
|---|---|
| A `member` attempts to write to `user_roles` for themselves | Rejected by RLS |
| A `contributor` attempts to set a compound's `status` to `published` | Rejected by RLS |
| An `editor` attempts to grant themselves or another user the `admin` role | Rejected — role changes require the service-role path, not a direct client call |
| An anonymous (unauthenticated) request reads a `draft` or `in_review` compound | Returns nothing — RLS filters it out |
| A logged-in `member` requests another user's `favorites` or `reading_list_items` | Returns nothing — RLS enforces `user_id = auth.uid()` |
| An anonymous request attempts to insert/update any research content table | Rejected by RLS |
| A request using only the public anon key attempts an operation that requires the service-role key | Rejected — service-role key is never present in any client-reachable context to even attempt this with |
| A search query or a compound's `related_compounds` join is checked against `archived`/non-`published` records | Confirmed absent from both search results and related-record listings |

---

## 17. Research-Content Validation Workflow

1. **Draft** — contributor writes claims, attaches sources.
2. **Automated pre-review checks** (run on save): every `claim` has ≥1 row in `claim_sources`; every `evidence_quality` other than `not_assessed` has a non-empty `quality_rationale` (also enforced at the database level — see §6); every `regulatory_records` row has a `source_id` and `last_verified_date`. **Source reachability is checked but never auto-blocks submission** — see §18. A source's most recent health-check status other than `confirmed_accessible` or `manually_verified` surfaces as a visible editorial warning for the reviewer to judge, not a hard stop. Scientifically valid content is never held hostage to a source website's temporary downtime, bot protection, or rate limiting.
3. **In Review** — an editor checks claims against their cited sources, confirms editorial-policy compliance (no commerce content in evidence sections, retraction status checked), and either approves or kicks back to draft with notes.
4. **Published** — editor/admin action only; sets `last_reviewed_at` and `reviewed_by`.
5. **Scheduled re-review** — any published compound with `last_reviewed_at` older than a configurable threshold (recommend 12 months to start) surfaces automatically in an admin "needs re-review" queue.

---

## 18. Automated Source-Link Health Checks

A Cloudflare **Cron Trigger** (native to Workers, one of the capabilities gained by moving off Pages — see §1) runs on a schedule (recommend weekly) and requests every `sources.url`, logging a **nuanced status** rather than a simple pass/fail — a temporary outage and a permanently dead link are very different editorial situations and shouldn't be treated the same:

```sql
create table link_health_checks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete cascade,
  http_status int,
  status_category text not null check (status_category in
    ('confirmed_accessible','redirected','temporarily_unavailable','permanently_missing',
     'auth_or_bot_protected','rate_limited','invalid_url','not_automatically_checkable',
     'manually_verified')),
  checked_at timestamptz not null default now()
);
```

**Only `permanently_missing` and `invalid_url` are treated as real problems** requiring editor attention before publish confidence is high; `temporarily_unavailable`, `auth_or_bot_protected`, and `rate_limited` are logged and surfaced as low-priority warnings, not treated as evidence the source is bad — a 403 from bot protection or a 429 from rate limiting says nothing about whether the underlying science is sound. `not_automatically_checkable` (e.g., sources behind a login) and `manually_verified` (an editor has personally confirmed it) are both treated as acceptable, non-blocking states.

**Checker etiquette, by design:** the job identifies itself with a clear, honest User-Agent string; respects each domain's `robots.txt` and any documented rate limits; caches results and never re-checks the same source more than once per scheduled run; and spaces out requests to the same domain rather than bursting — this is a small, respectful crawler, not a scraper hammering PubMed or ClinicalTrials.gov.

Results surface in the admin "Broken Sources" report (successor to v1's simpler broken-link report), which feeds §17's pre-review checks as warnings, never automatic blocks.

---

## 19. Retraction & Correction Monitoring Strategy

Being honest about what's realistic at launch versus later:

- **At launch:** a manual quarterly editorial task — spot-check `sources` with `source_type` in the peer-reviewed-literature categories against Retraction Watch's public database and Crossref's retraction metadata for stored DOIs, updating `sources.retraction_status` by hand where something is found.
- **Post-launch enhancement (not scoped for v1):** automate this via scheduled polling of the Crossref API for retraction/correction metadata on every stored DOI, feeding the same field automatically and flagging editors for confirmation. I'm not scoping this into the initial build — it's a real, valuable feature but not one I'd promise as "automated" without building and testing the integration properly first.

---

## 20. Content Provenance & Change History

`content_revisions` (from v1) is retained at the **compound level** — a full JSON snapshot of the compound's structured record (including its current claims, sources, and regulatory records) taken on every meaningful edit, tagged with the editor and timestamp. This is sufficient to answer "what did this page say on date X and who changed it" without needing a separate revision table per claim, which would add real complexity for limited practical benefit at this scale — flagged as a candidate future enhancement if editorial volume grows enough to need finer-grained diffs.

---

## 21. Data Export & Backup Plan

- **Supabase automatic backups** from day one (included at the Pro tier — see cost notes in §25; Point-in-Time Recovery is a separate paid add-on, not bundled, and is a Phase-2-or-later decision once real usage patterns justify the cost).
- **Independent weekly export**, in addition to Supabase's own backups: a scheduled Worker job exports all `published` content to human-readable JSON/CSV into a private Supabase Storage bucket (or a private git repo) — protects against vendor-specific catastrophic failure, not just database corruption, and gives you a copy of your own content outside any single vendor's system.
- **Written restore runbook** produced during Phase 2, not left as "we have backups" — a documented, tested procedure for both a Supabase-native restore and a restore from the independent export.

---

## 22. Account Deletion & Personal-Data Export Workflow

- `/account` includes a self-service **"Export my data"** action (JSON download of profile, favorites, reading list, saved comparisons, and feedback submissions tied to the account).
- **"Delete my account"** — soft-deletes immediately (account deactivated, no longer usable), hard-deletes after a short grace period (recommend 30 days, to protect against accidental/coerced deletion) unless the user confirms immediate permanent deletion.
- Deleting a `contributor`/`editor`/`admin` account **never cascades into deleting content they authored** — their `content_revisions` and any content they published are reassigned to a generic "former contributor" attribution rather than being removed, preserving the integrity of published research and its citation trail.

---

## 23. Privacy & Data-Retention Policy Requirements

A published Privacy Policy needs to cover, at minimum: what's collected (account email, favorites/reading-list/comparison data, form submissions, aggregate Cloudflare Web Analytics data — no cookies involved there), how long it's retained, that it isn't sold to third parties, and how to exercise the export/deletion rights from §22. **Flagging directly: I can draft the structure and content outline, but the actual legal language should be reviewed by a lawyer before publishing** — this is a research-content site discussing research chemicals, and getting the privacy/health-adjacent-data language right matters enough that I don't want to represent a draft as legal advice.

---

## 24. Abuse Prevention

| Surface | Protection |
|---|---|
| Contact/feedback forms | Cloudflare Turnstile + Cloudflare rate limiting + a honeypot field as defense-in-depth |
| Saved/shareable comparisons | Rate-limited creation per session/IP; shared comparison pages default to `noindex` (not searchable/SEO-spammable) unless explicitly reviewed |
| Account creation | Email verification required before any content-contribution action (favorites work pre-verification; posting feedback or holding `contributor`+ role requires a verified email); Turnstile on signup; rate-limited per IP |

---

## 25. Cost Estimates

Real, currently-verified figures (checked against current pricing pages rather than assumed) — treat as planning ranges, not quotes, since these vendors' pricing does shift:

| Service | Staging | Production (launch-scale traffic) |
|---|---|---|
| Cloudflare Workers | Free tier (100k requests/day free) | Likely still free tier at launch traffic; Paid plan is **$5/month minimum** if you exceed it (includes 10M requests/month) — static asset requests don't count against this at all |
| Supabase | Free tier ($0 — note: free projects auto-pause after 7 days of inactivity, fine for staging) | **Pro tier, $25/month base** (includes $10/month compute credit covering a Micro instance) — recommended for production once real user accounts exist, since it's needed for backups and custom-domain auth email. **Point-in-Time Recovery is a separate add-on (~$100/month per 7-day retention window)** — not recommended at launch, revisit if uptime requirements grow |
| Resend | Free tier | **Free tier (3,000 emails/month, 100/day cap) is very likely sufficient** for a contact form + feedback form + auth emails at this scale; **Pro is $20/month for 50,000 emails/month** if you outgrow it |
| Supabase Storage | Included in above | Included in Supabase plan up to its bandwidth/storage limits |
| Domain registration | — | Typically $10–20/year, separate from the above, depends on registrar and TLD |

**Realistic all-in monthly estimate at launch: roughly $25–35/month** (Supabase Pro + likely-free Workers + likely-free Resend), separate from one-time domain registration. This will move if traffic or email volume grow meaningfully past the free tiers — the table above tells you exactly which line moves first.

---

## 26. Phased Roadmap — Dependencies & Acceptance Criteria

| Phase | Scope | Depends on | Acceptance criteria |
|---|---|---|---|
| 0 | Decisions finalized, accounts created, brand-asset phase scoped | — | All items in §27 answered; Cloudflare, Supabase (staging), Resend accounts exist |
| 1 | Repo scaffold: Astro + Workers adapter + Tailwind, design tokens, base layout, staging deploy via Wrangler + CI | Phase 0 | A staging URL renders the base layout; CI runs lint/typecheck on every PR |
| 2 | Full schema (§5–§13) + RLS (§16) + migration script importing existing ~50 compounds as drafts, preserving original wording | Phase 1 | Every existing compound exists as a `draft` row with claims/sources populated from the original page text; automated pre-review checks (§17) pass on at least one pilot compound |
| 3 | Public compound directory + compound profile pages (read-only), Postgres search + filters | Phase 2 | A visitor can search, filter by every listed facet, and view a fully rendered compound profile sourced entirely from Supabase |
| 4 | Shop/cart parity rebuild | Phase 1 (can run parallel to 2–3) | Every current shop feature (category filter, search, mg/price options, cart math, checkout email) works identically to the live site on staging |
| 5 | Auth + favorites/reading list/comparisons | Phases 2–3 | Full security test suite (§16 table) passes in CI |
| 6 | Admin dashboard | Phase 5 | An editor can take a migrated draft compound through review to published, entirely through the UI, with revision history visible afterward |
| 7 | Resend integration | Phase 1 | Contact/feedback forms deliver email without any key present in client-side code (verified by inspecting the shipped bundle) |
| 8 | SEO: sitemap, OG images, structured data | Phase 3 | Sitemap includes every published route; a compound page produces a valid, policy-appropriate structured-data block |
| 9 | Accessibility & testing hardening | Ongoing from Phase 1, gated formally here | Automated axe checks pass in CI on every core page template |
| 10 | Brand-asset phase (per decision #11) | Phase 0, informs Phase 1 visuals | Real logo (vector), icon set, and illustration style delivered before final visual polish |
| 11 | Content expansion & citation-sourcing | Ongoing, gated by your research-content rules | Each newly published claim passes §17's checks |
| 12 | Cutover | Phases 1–9 complete and QA'd on staging | Full redirect map live, GitHub Pages kept as untouched rollback for 30 days, broken-link check clean |
| 13 | Post-launch | Ongoing | Dark theme, glossary expansion, pathway diagrams, Meilisearch upgrade evaluated against real search-quality data |

**On timeline estimates:** I'm deliberately not attaching calendar dates or week-counts to these phases. This is a genuinely large rebuild — compound directory + profile pages (Phase 3) and the admin dashboard (Phase 6) are each substantial pieces of work on their own — and a specific promised duration here would be a guess dressed up as a plan. Once you approve this blueprint and we're staffed/resourced for implementation, I can give you a much more grounded estimate based on actual velocity in Phase 1–2.

---

## 27. Decisions — Resolved

1. **Custom domain:** decided and purchased — `cloudpeptides.org` (2026-08-07). Nameservers are propagating to Cloudflare; no DNS record, route, or custom-domain attachment has been made yet, and none will be without explicit approval (CLAUDE.md §9). `astro.config.mjs`'s `site` already reflects this domain (see docs/planning/production-cutover-plan.md §3, §6 for the remaining attachment steps).
2. **Brand assets:** scoped into this project — no external designer. A refined logo system, wordmark/icon-mark variants, favicon/app-icon direction, research-category icon system, evidence/regulatory-status icons, illustration and diagram style, and social/OG image style are all part of the visual-concept phase (§26, Phase 10). The existing logo is brand history, not a constraint — proposed directions will be shown before anything is permanently replaced.
3. **AOD9605:** treated as `identity_confidence = 'unverified'` per §12's policy. No silent renaming to AOD-9604, no research claims, no connection to the AOD-9604 record. The existing shop listing is preserved as-is during migration; the discrepancy is logged for your review, and it gets no public research profile until either an authoritative source verifies it or you confirm the shop name is a typo.
4. **Infrastructure:** Cloudflare Workers, Supabase Storage for admin uploads, repo-managed assets for fixed brand imagery, and deferring R2 until there's a demonstrated need — all approved as proposed in §1–§2.

## 28. Implementation Refinements — Approved, Folded Into This Document

Traceability for the five corrections from your last message, each now reflected in the relevant section above rather than left as a separate list to lose track of:

| # | Refinement | Where it now lives |
|---|---|---|
| 1 | `quality_rationale` required by a real Postgres constraint, not just the admin UI | §6 — `claims` table now has an explicit `check` constraint |
| 2 | Source health must distinguish transient/blocked states from real problems; a 403/429/outage must not auto-invalidate valid content | §17 and §18 — `link_health_checks` now uses a 9-state `status_category`, and pre-review checks treat everything except `permanently_missing`/`invalid_url` as a non-blocking warning |
| 3 | Automated source checking must be respectful — rate limits, identification, caching, no repeat hammering | §18 — "Checker etiquette" paragraph added |
| 4 | Authoritative identifiers (DOI/PMID/NCT/etc.) need real uniqueness constraints | §7 — added a global unique index on `source_identifiers(identifier_type, identifier_value)`, not just the per-source composite key |
| 5 | Every service-role Worker route needs auth, authorization, input validation, rate limiting, audit logging, narrow scope, and negative tests | §16 — added the hardening checklist table and an `audit_log` table |

## 29. Next Steps

Per your instructions: no accounts, no dependencies, no repository changes, no deployments during the visual-concept phase either. What follows this document is the high-fidelity visual-concept work — design system, brand directions, and page concepts — still purely design output, nothing implemented.
