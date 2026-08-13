# Implementation & Migration Log

Append-only. One entry per meaningful step, per [CLAUDE.md](../CLAUDE.md) §3/§11/§12.

## Product Rebrand + Mandatory Researcher-Account Gate (2026-08-13)

Three approved deliverables, staging-only per explicit instruction; `main`/production untouched pending separate approval.

**1. Shop rebrand (CP-S1/CP-T2/CP-R3), research/shop separation.** Commit `3e11a35`.

- Data-only: 15 `shop_products` rows (2 Semaglutide, 6 Tirzepatide, 7 Retatrutide SKUs) renamed `name`/`product_slug` to CP-S1/CP-T2/CP-R3; `compound_id` (existing column, previously null on every row) set to link each to its real research compound — admin-only, never selected by any public/researcher query. 6 published `batch_coas.peptide_name` rows updated to match. One `audit_log` entry (`product_rebrand_cp_codes`) records the full before/after mapping.
- `src/lib/shop-products.ts` (the documented static rollback source) updated to match.
- No shop/cart/checkout/email code changes needed — all already read product name/slug dynamically from the catalog.
- Confirmed the three research profiles never linked to shop products in the first place (`ShopDisclosure.astro` is dev-fixture-only) — nothing to remove.

**2. Mandatory researcher-account gate.** Commits `b595cc3`, `6b94d20`.

- `src/middleware.ts` rewritten: every route requires a signed-in, non-suspended session by default (previously only `/admin*`/`/api/admin/*`). Explicit small public allow-list (login, register, verify-email, forgot/reset-password, terms, privacy, research-use-policy); deny-by-default otherwise.
- New tables: `researcher_profiles` (self-service profile + admin-only status/suspension/force-recertify fields, trigger-protected) and `researcher_attestations` (append-only, no update/delete policy for any role including admin) — `supabase/migrations/20260813120000_researcher_accounts.sql`.
- `supabase/migrations/20260813121000_gate_revoke_anon_access.sql`: revoked every `anon` SELECT grant added since Phase 2/3 across all research + commerce tables; replaced anon-scoped RLS policies with authenticated-scoped equivalents. `coa-documents` Storage bucket flipped private (was `public: true`, which bypasses RLS entirely via its own public object URL — a real hole for a gated gallery); public COA gallery now uses short-lived signed URLs.
- Full registration/certification/email-verification/password-reset flow (`/register`, `/verify-email`, `/certify`, `/login`, `/forgot-password`, `/reset-password` + matching `/api/account/*` routes), built on the same session-cookie system `/admin` already used.
- Every research/shop/COA data read switched from a bare anon-key client to the visitor's own verified session (`createUserScopedClient`), required now that anon has no grant.
- **Two real bugs found and fixed live, not assumed:**
  - `/admin/login` looped infinitely for a signed-in researcher session (bounced to `/admin`, which middleware then bounced back, forever) — fixed to only bounce through for a session clearing the same contributor+ bar.
  - `src/pages/api/auth/logout.ts` called `signOut()` with supabase-js's default `scope: 'global'`, which revokes **every** session for that user account, not just the current one — this cascaded into an e2e-suite failure (one test's sign-out silently killed the shared test account's session mid-run, failing unrelated concurrently-running tests). Fixed to `scope: 'local'` — the correct behavior for an ordinary sign-out regardless of the test artifact it surfaced.
- Supabase Auth redirect allow-list (`uri_allow_list`) updated via the Management API to add the staging `/verify-email` and `/reset-password` URLs — required for those flows to work at all; production URLs deliberately not yet added (staging-only approval).

**3. Admin researcher management.** Commit `6b94d20`.

- `/admin/researchers`: view status/certification/affiliation/jurisdiction/verification/last-sign-in; suspend/reinstate/require-recertification actions; audit history via a filtered link into the existing `/admin/audit-log`. Every write uses the acting admin's own JWT (RLS + trigger enforce it), never the service role.

**Verification, all against the real deployed staging Worker and live shared Supabase project, not assumed:**

- `npm run typecheck` / `lint` / `format:check` (blob-level for pre-existing false-positive CRLF files) — clean.
- `npx vitest run` — 189/189 unit tests pass.
- `npx playwright test` — **90/90 e2e tests pass** at default parallelism, no retries, including a new `researcher-gate.spec.ts`/`researcher-access.spec.ts` covering the gate itself. A seeded, already-certified test account (`e2e-researcher-test@cloudpeptides.invalid`) provides the default authenticated `storageState` the whole suite now runs under.
- `node scripts/check-secrets.mjs` — clean. `node scripts/check-links.mjs` — 94/94 links ok (down from ~1091 pre-gate, since almost nothing is publicly crawlable anymore — expected).
- Direct `curl` checks against the live staging URL: anonymous `/`, `/shop`, and a direct compound URL all 302 to `/login`; `/login`/`/register`/`/research-use-policy` all 200 unauthenticated; a real login via `/api/account/login` reaches `/` (200), `/shop` (shows CP-S1/CP-T2/CP-R3, zero occurrences of the old scientific names), the Semaglutide research profile (correct name, zero shop-link occurrences), and `/coas` (signed `storage/v1/object/sign/...` URLs, zero raw public-object URLs).
- Anon-key REST calls directly against the live Supabase project confirmed `401 permission denied` for `compounds`/`shop_products`, and a real previously-public COA file confirmed no longer fetchable via its old public URL.
- GitHub Actions run `31688437204`: `ci` succeeded, `deploy-staging` succeeded, `deploy-production` correctly skipped (this branch).

**Backup:** full logical JSON export of all 16 public tables + a Storage bucket/object manifest, taken before any migration, stored outside the repo (scratchpad, not committed — contains no secrets but is a full data snapshot).

**Known limitation:** the mandatory per-request live Supabase Auth verification (no shortcut/mock, by design) makes the e2e suite genuinely sensitive to the shared test account's session lifecycle — the global-signOut bug above is exactly that category of issue, now fixed, but any *future* e2e addition that calls the real logout/session-revocation path against the shared seeded account needs to do so via its own independent login (see `researcher-access.spec.ts`'s sign-out test), not the default shared `storageState`.

## Focused Pre-Launch Correction Pass (2026-08-08)

Four items, each independently resolved, before production cutover:

1. **`SUPABASE_SERVICE_ROLE_KEY` architecture** — inspected the real
   implementation (`src/lib/auth.ts`, the two `/api/admin/users/*`
   routes, `src/lib/admin/users.ts`) against CLAUDE.md, Blueprint v2
   §16, and the RLS grants before changing anything. Conclusion: the
   architecture was already correct — auth, admin-role re-check before
   every privileged operation, input validation, rate limiting, audit
   logging, narrow scope (never a general table passthrough), and
   negative tests (`db:verify-admin-security`, re-run: 18/18) all
   already present, and this is structurally the *only* possible
   design (creating/listing Auth users and writing `user_roles` both
   have zero non-service-role path by the schema's own locked-down
   grants). **Nothing in the implementation changed** — the working
   staging admin dashboard was never at risk. What was actually wrong:
   `production-cutover-checklist.md`/`production-cutover-plan.md`/
   `production-readiness-audit.md` asserted "must not exist on any
   Worker," which was false (staging has genuinely had it set since
   the prior session) and contradicted Blueprint v2 §16's own text.
   Corrected in all three docs, plus `CLAUDE.md` §8 and `.env.example`
   for full consistency.
2. **`/about` page** — the one remaining "not yet migrated" legacy URL
   with real, reusable content. Rebuilt (`src/pages/about.astro`) using
   the legacy page's own established mission language verbatim, not
   reinvented; added to nav and a new footer "Site" landmark; wired
   `/about.html` → `/about` into the existing redirect table.
3. **Broken citations** — exactly 2 distinct URLs (3 flagged instances)
   confirmed via `check:links`. Both investigated directly (redirect
   chains followed with a browser User-Agent, cross-corroborated via
   web search) rather than assumed dead: the JAMA DOI resolves
   correctly but JAMA Network bot-blocks automated checkers — the
   source's primary URL was upgraded to the PMC open-access mirror of
   the identical article (a genuine same-source improvement, not a
   substitution); the FDA consumer-update URL redirects to FDA's own
   abuse-detection page (confirmed bot-wall, not a 404) and is
   independently corroborated by multiple 2025 news outlets as a real,
   current warning naming Lemon Bottle — left unchanged since no
   alternate URL could be confidently confirmed as the identical
   document. `scripts/enrichment/fix-broken-citations-2026-08-08.mjs`
   documents the full reasoning and made the one real change (staging:
   one `sources` row updated).
4. **Product decisions recorded:** `www.cloudpeptides.org` permanently
   redirects to the apex via a Cloudflare Redirect Rule, not a Worker
   route (`wrangler.production.jsonc` updated accordingly — the `www`
   route was removed, not just left commented); no analytics/
   advertising/nonessential cookies, stated as a forward-looking
   Privacy Policy commitment; no cookie-consent banner for the current
   strictly-functional cookies, with an explicit revisit-before-
   analytics trigger documented; checkout stays disabled (confirmed
   consistent, unchanged); all 7 policy pages now carry an identical
   "honest operational draft, not lawyer-reviewed" note via
   `PolicyLayout.astro`'s shared footer rather than two hand-written
   copies.

**Verification, run once at the end:** lint/typecheck clean;
**103/103** unit tests (interpretation of the redirect test data
updated for `/about.html` moving out of "not yet migrated"); **40/40**
e2e tests (2 new — `/about.html` redirect, and the "not yet migrated"
case repointed at `/faq.html`); build clean; `check:secrets` clean;
`check:links` — exactly the 2 documented, investigated,
non-actionable bot-wall cases remain, no new breaks; `db:verify-security`
14/14; `db:verify-admin-security` 18/18 (re-confirmed specifically
because item 1 was about this exact architecture, even though no code
changed). Deployed to staging and live-verified.

## Final Pre-Launch Readiness Phase (2026-08-08)

Scope: 7 policy/trust pages, full production-readiness audit, prepared
(not executed) production migration/backup scripts and cutover/smoke-
test checklists, and safe local fixes found along the way. `main`/
production/DNS untouched throughout; checkout stayed disabled.

**Policy pages:** Privacy Policy, Terms of Use, Research and Medical
Disclaimer, Accessibility Statement, Shipping Policy, Return and
Refund Policy, Shop Terms (`src/pages/{privacy,terms,disclaimer,
accessibility,shipping,returns,shop-terms}.astro`, shared
`PolicyLayout.astro`) — written strictly against this app's real,
verified behavior. No invented company registration, physical
address, jurisdiction, licenses, shipping carriers, or
processing/return promises; every genuinely unknown item (business
entity, address, governing law, cookie-consent requirement) is stated
as such and recorded as a deferred decision in
`docs/planning/production-readiness-audit.md` rather than guessed at.
Linked from a new footer "Policies" nav landmark plus contextual links
on the shop and research-directory pages.

**Production-readiness audit** (`docs/planning/
production-readiness-audit.md`) covered all 16 requested categories
with real, checked findings — most were already solid from prior
phases; two real gaps were found and fixed this phase:

- **No site-wide 404 page existed.** Added `src/pages/404.astro` +
  shared `NotFoundContent.astro`.
- **Legacy URL redirects were documented but never implemented.**
  First attempt lived in `src/middleware.ts`; found live (not assumed)
  that Cloudflare's Workers Static Assets binding intercepts any path
  with no matching static file — every legacy `.html` URL — and serves
  the static 404 directly before the Worker runs, confirmed via both
  `astro preview` and `wrangler dev`, unaffected by
  `not_found_handling` in `wrangler.jsonc`. Fixed by making each
  legacy path a real, matched Astro route instead
  (`src/pages/product.html.astro`, `src/pages/[legacy].html.astro`,
  reading `src/lib/legacy-redirects.ts`) — re-verified directly via
  `wrangler dev` and new Playwright e2e tests (real 301s with correct
  `Location` headers).
- A real accessibility regression was caught by axe during this
  phase's own verification, not missed: a new shop-page disclaimer
  link used `--terracotta-text` on `--bg-sunken` (4.15:1, below the
  4.5:1 AA minimum) — the exact pairing already flagged as unverified
  in `ShopDisclosure.astro`'s own prior comment. Fixed by switching to
  `--primary`, re-verified clean.

**Prepared, not executed** (no production Supabase project exists
yet): `scripts/migration/export-published-for-production.mjs`
(staging → production data migration, published rows only) and
`scripts/migration/backup-production.mjs` (`pg_dump` wrapper,
independent of Supabase's own backup system). `docs/planning/
production-cutover-checklist.md` (ordered steps + exact GitHub Actions
secrets/variables table) and `docs/planning/
post-launch-smoke-test-checklist.md` consolidate and operationalize
the existing narrative `production-cutover-plan.md`, whose Phase 5/6
readiness table was also corrected here (both were accurately "Not
started" when first written; both are done as of the two prior
"Combined Phase" entries below).

**Verification, run once at the end:** `npm run lint` / `typecheck` /
`format:check` (only files touched this phase) all clean; **103/103**
unit tests (7 new); **38/38** e2e tests (15 new — policy pages ×7,
footer-link check, 404 ×2, legacy-redirect HTTP assertions ×3),
including the axe-regression fix above; `npm run build` clean;
`npm run check:secrets` clean; `npm run check:links` — 2 pre-existing,
unrelated external citation URLs found (JAMA DOI 403ing for two
compounds' claims; the FDA one noted in the prior phase resolved
itself between runs — exactly the external-source-flakiness category
Blueprint v2 §18 describes, not a defect); `npm run
db:verify-security` **14/14**; `npm run db:verify-admin-security`
**18/18** (re-run specifically because `src/middleware.ts` changed
substantially this phase — confirms admin auth/RLS still hold).

**Deferred decisions requiring your input** (not blockers for further
staging work — full detail in the audit doc): `www` behavior
(direct-serve vs. redirect to apex); registered business entity/
physical address/governing jurisdiction for the policy pages (all
three genuinely don't exist anywhere in this project's records, and
Blueprint v2 §23 already required legal review before treating any
policy-page language as final); whether a cookie-consent banner is
needed (the site currently sets only strictly-necessary functional
cookies); production Supabase Pro-tier cost approval.

## Combined Phase — Deployment + First-Admin Bootstrap (2026-08-08)

With your explicit in-chat permission this session (staging Worker
only): set `SUPABASE_SERVICE_ROLE_KEY` as a Cloudflare secret on
`cloudpeptides-staging` (`wrangler secret put`, value read from local
`.env.local` — never printed, logged, or written anywhere else).
Bootstrapped the first admin account (`jessica.holsopple3@gmail.com`)
via a one-time local script: generated a strong password in-process
with `node:crypto`, copied it directly to the Windows clipboard
(`clip.exe` via stdin, never a shell argument), created the Supabase
user (`email_confirm: true` — no email sent), assigned the `admin`
role, verified by a real sign-in that the JWT's `user_role` claim
actually reads `admin` — then deleted the bootstrap script.

Deployed to `cloudpeptides-staging` via `wrangler deploy` (dropping an
explicit `--config wrangler.jsonc` flag worked around a Windows-only
path-resolution quirk in this local wrangler install; the existing
GitHub Actions `deploy-staging` job — Linux runners — doesn't hit
this). Live-verified against the real deployed URL with a second,
disposable test admin account (never your real password): site up,
`/admin/login` renders, unauthenticated `/admin` redirects,
unauthenticated `/api/admin/*` returns 401, a real login round-trip
succeeds, authenticated `/admin` loads, and admin user-creation
succeeds through the live Worker — the last one specifically proving
the service-role secret is genuinely wired up in the deployed runtime,
not just locally. **7/7 live checks passed.** Verification script
deleted afterward, same as the bootstrap script — nothing temporary
left in the repo.

No changes to `main`, production, DNS, or checkout (`COMMERCE_ENABLED`
unchanged).

## Combined Phase — Supabase Authentication + Editorial/Admin Dashboard (2026-08-08)

**Scope, as approved in chat:** Phase 5 narrowed to authentication
infrastructure only (no public favorites/reading-list/comparisons —
never requested this session) combined with Phase 6's full admin
dashboard scope. Staging only throughout; `main`/production/DNS/custom
domain untouched; checkout stays disabled (`COMMERCE_ENABLED = false`,
unchanged).

**Note on log continuity:** this entry picks up after several
enrichment/launch commits (`8f30fd2` publish all 56 compounds+claims,
`4390acd` compound_aliases population, `2bb6ba0` security hardening,
`4be06ec`–`0e88bb8` Resend/Turnstile/domain/contact-form work) that
were never individually logged here — a pre-existing gap in this file
from before this session, not backfilled now (out of scope for this
phase; the git history and each commit's own message remain the
authoritative record for that work).

### Authentication (Supabase Auth, email/password)

- `src/lib/auth.ts` — cookie-based session handling. The access-token
  cookie is re-verified against Supabase Auth on every request
  (`auth.getUser(token)`, a real network check) before its `user_role`
  custom JWT claim (injected by the already-enabled Custom Access
  Token Hook — confirmed live, not assumed) is ever read; transparent
  refresh via the refresh-token cookie. `createUserScopedClient()`
  (the acting user's own verified JWT — RLS is the real boundary for
  every ordinary editorial write) and `createServiceClient()` (service-
  role, reserved for `user_roles`/`audit_log`, the two tables with zero
  client write grant) are the only two ways this app ever talks to
  Supabase server-side.
- `src/pages/api/auth/login.ts` / `logout.ts` — rate-limited (reuses
  `FORM_RATE_LIMITER`), same-origin-checked, generic
  "invalid email or password" on failure (never reveals which). A
  `member` gets a genuine "no dashboard access" 403 and an immediate
  session revoke rather than a live-but-useless cookie.
- `src/middleware.ts` extended: every `/admin*`/`/api/admin/*` request
  resolves a real session and enforces a contributor+ baseline before
  the page/route runs; `/admin/login` is the one exempted path.
  Individual pages/routes still do their own finer role check (editor
  for publish/delete, admin for user management) — the baseline is
  never the only gate (CLAUDE.md §8).
- `src/layouts/BaseLayout.astro` gained an opt-in `hideChrome` prop
  (skips the public Nav/Footer) so `/admin` reuses the same
  theme/meta/CSP-nonce/skip-link machinery instead of a duplicated
  `<html>` shell.

### Admin dashboard

- `src/lib/admin/{queries,validation,mutations,users}.ts` — read
  queries (status counts, evidence gaps, unsupported/contradicted
  legacy-claim counts via the existing `reconciliation.ts` parser,
  expert-review flags via the existing static list, revision/audit-log
  reads), field validation mirroring every CHECK constraint in
  `20260806144903_research_schema.sql` by hand (no generated-types
  pipeline exists here — same reasoning as `database.types.ts`), and
  Blueprint v2 §17's pre-publish checks (every claim needs ≥1 citation;
  a set evidence quality needs a rationale; every regulatory record
  needs a source) as real hard blockers, not just client-side hints.
- `src/pages/api/admin/content/[table].ts` — one allow-listed,
  RLS-enforced CRUD route covering nine editorial tables (compounds,
  aliases, stack components, claims, claim sources, sources, source
  identifiers, studies, regulatory records). Every write goes through
  the caller's own JWT; column allow-lists prevent mass-assignment
  (`compounds.status`/`claims` deletion are deliberately excluded —
  see below). `src/pages/api/admin/compounds/[id]/status.ts` is the
  one place a compound's status ever changes — runs the §17 blocker
  check before attempting the write, sets `last_reviewed_at`/
  `reviewed_by` on a successful publish.
- Deliberately not built: a "delete compound" UI. Not requested, and
  far less reversible than anything else here — archiving via the
  status route is the supported way to remove a compound from public
  view. Deleting an individual claim is supported (editor+, per RLS).
- Pages: `/admin` (dashboard), `/admin/compounds` (search/filter/
  paginate) + `/admin/compounds/[id]` (identity, aliases, stack
  components, regulatory records, claims, publish workflow) +
  `/admin/compounds/[id]/claims/{new,[claimId]}` (claim + claim-source
  citation management) + `/admin/compounds/[id]/history` (revision
  snapshots), `/admin/sources` + `/admin/sources/{new,[id]}` (incl.
  identifiers), `/admin/studies` + `/admin/studies/{new,[id]}`,
  `/admin/audit-log` (admin-only), `/admin/users` (admin-only — create
  user, change role). Every list page: real search/filter/pagination
  via query params (no client JS required), loading is inherent to SSR,
  and explicit empty/error/success states throughout
  (`EmptyState`/`ErrorState` reused from Phase 3).
- `src/pages/api/admin/users/index.ts` (create) and
  `[id]/role.ts` (change role) are the only two service-role routes —
  rate-limited, audit-logged (`audit_log`, via the acting admin's own
  user id), and **refuse any self-role-change outright** (not just
  self-elevation — the simplest rule that fully satisfies the
  "editor/admin cannot grant themselves admin" requirement with no
  edge case, and sidesteps a "last admin locks themselves out" footgun
  without a separate check). User creation sets `email_confirm: true`
  — no confirmation/invite email is ever sent (CLAUDE.md §9: sending
  real external email needs separate explicit approval, and there's no
  product need for one here); the creating admin relays the password
  out of band.
- One shared client script (`src/scripts/admin-form.ts`) drives every
  create/update/delete form across every entity via `data-*` attributes
  against the generic content route — avoided ~15 hand-written
  near-duplicate fetch handlers.

### Testing — real, not asserted

- **Unit (Vitest):** 28 new tests — `src/lib/auth.ts`'s pure helpers
  (role ranking, same-origin/CSRF check, cookie build/clear/read) and
  `src/lib/admin/validation.ts` (field validation, the
  quality-rationale-required rule, `checkPublishReadiness`). Added a
  `cloudflare:workers` Vitest alias (`tests/mocks/cloudflare-workers.ts`)
  so `auth.ts` — the one file that imports the real Workers-only virtual
  module — is unit-testable at all. **96/96 unit tests pass** (68
  pre-existing + 28 new).
- **`scripts/migration/verify-admin-security.mjs`** (new) — HTTP-level
  integration suite, driving a real locally-built-and-previewed copy of
  the app through real `fetch()` calls against the real staging
  Supabase project (disposable test users + a disposable fully-cited
  compound, cleaned up after). Temporarily writes
  `SUPABASE_SERVICE_ROLE_KEY` into `.dev.vars` for the run only
  (verified byte-for-byte restored afterward — confirmed directly, not
  assumed). **18/18 checks passed**, proving: unauthenticated requests
  are rejected by both `/admin` pages and `/api/admin/*`; a `member`
  cannot obtain a dashboard session; a `contributor` cannot publish
  even a compound with zero content blockers (isolates the role check
  from the completeness check); an `editor` CAN publish a fully-cited
  compound and the database reflects it; only an `admin` can create
  users or change roles (`contributor`/`editor` both rejected); nobody
  — including an admin acting on themselves — can change their own
  role, verified both by response status and by re-reading the actual
  database state afterward.
- **`scripts/migration/verify-security.mjs` (existing suite) re-run: 14/14
  passed**, including two checks fixed this session — both were stale
  assumptions from when every compound was still `draft` (before the
  Phase 3.5 publish step), not security regressions: "contributor can
  read drafts" now checks against a disposable draft compound created
  for the purpose rather than assuming a real one exists; "every
  compound is draft" is now a before/after non-draft-count comparison
  (proves the test run itself changed nothing) instead of a stale global
  assertion.
- **Existing suites re-run clean:** `npm run lint` (0 issues), `npm run
  typecheck` (0 errors/warnings/hints across 194 files), `npm run
  format:check` (clean on every file touched this session — pre-existing
  unformatted files elsewhere in the repo, e.g. `scripts/enrichment/
  data/*.mjs`, were left untouched, out of scope), `npm test` (96/96),
  `npm run test:e2e` (24/24, the full pre-existing Playwright+axe suite,
  unaffected by the middleware changes), `npm run build` (clean),
  `npm run check:secrets` (clean).
- **`npm run check:links`: 3 pre-existing broken external citation
  URLs found** (an FDA consumer-update page now 404s, a JAMA DOI now
  403s for two different compounds' claims) — live third-party sources
  going stale/bot-blocked, exactly the category Blueprint v2 §18
  describes as a low-priority editorial warning, not a defect in this
  session's work. Not fixed here: editing research-claim citation
  content is outside this phase's scope.

### Known limitations, disclosed

- Role changes take effect on next token refresh/re-login, not
  instantly for an already-open session — inherent to JWT-claim-based
  RBAC (Supabase's own documented pattern, not a bug introduced here).
- No automated link-health-check job exists yet (Blueprint v2 §18 —
  explicitly later-phase infrastructure), so `checkPublishReadiness()`
  never factors in source reachability; the 3 links above were only
  caught by the unrelated `check:links` script, not the publish
  workflow itself.
- `docs/implementation-log.md`'s pre-existing gap for the Phase 3.5
  enrichment/publish/launch-hardening commits (noted above) was not
  backfilled — flagged, not fixed, per this phase's scope.

**Manual step required from you (nothing else is blocked):** see the
end-of-turn chat report for exactly one step — bootstrapping the first
admin account, since no admin exists yet to use the in-app user
management screen.

## Phase 2/3 Closeout — Correction & Completion (2026-08-06)

**Correction:** the Phase 2 entry below states "48 imported, 8 correctly held
back for human review" — that data-integrity claim was true, but this log's
earlier closeout summary elsewhere had framed the migration as "48/48
imported" without equal billing for the 8 held-back pages, which read as
"the migration is done" rather than "48 of 56 candidate pages are done, 8
are pending classification." Full explanation, root cause, and every
verified number: [docs/migration/legacy-import-correction-2026-08-06.md](migration/legacy-import-correction-2026-08-06.md).

**What changed:** the 8 held-back compounds (`5-amino-1mq`, `aicar`,
`bpc-157-tb-500`, `cerebrolysin`, `cjc-1295-no-dac-ipamorelin`,
`glutathione`, `nad-plus`, `semax`) received explicit human-reviewed
`entity_kind` classifications and were imported as `draft` — same
extraction/insert pipeline as the original 48, same "never invent claims"
rule (`semax` has zero claims, deliberately, because its legacy page is a
content-free stub; flagged both in the report and in its own
`raw_import_metadata.import_warnings`). Blend component lists for
`bpc-157-tb-500` (→ `bpc-157`, `tb-500`) and `cjc-1295-no-dac-ipamorelin`
(→ `cjc-1295-no-dac`, `ipamorelin`) were extracted from each page's
"Compounds Included" section (previously never attempted for non-stack
pages) and linked via `stack_components`. This also resolved the 3 links
that were correctly unresolved in the original Phase 2 run
(`calm-focus-stack`/`neuro-cognitive-stack` → `semax`,
`upgraded-glow-stack` → `glutathione`), now that those compounds exist.

**Verified directly against the live staging project:**
- 56 total `compounds` rows, 56 `draft`, 0 `published`.
- All 8 target slugs present with the approved `entity_kind`; claims/sources
  totals reconcile exactly (507 claims, 56 sources, 507 `claim_sources`).
- 24 `stack_components` rows (15 original + 9 newly resolved); every
  resolvable blend/stack link is now linked, nothing invented for the one
  page (`klow-blend`) that has no itemized component list to extract.
- Anonymous (`anon` key) reads return zero rows across all 56 compounds —
  checked by direct query, not inferred from RLS policy text.
- Full 14-check RLS/security suite: 14/14 passed.

**Script fixes made along the way** (both real, durable bugfixes, not
one-off hacks): `import-to-supabase.mjs`'s stack/blend-component pass
wasn't idempotent (a second run would hit primary-key conflicts on already-
linked pairs and silently undercount); fixed to check-before-insert.
`extract-legacy-compounds.mjs`'s component-name extraction was scoped only
to stack-type pages even though ordinary compound pages can have the same
"Compounds Included" section (`bpc-157-tb-500`, `cjc-1295-no-dac-ipamorelin`)
— broadened to an exact section-label match, verified against the raw HTML
that a loose match would have misattributed unrelated tag lists (e.g.
`nad-plus.html`'s `.compounds` div lists "Mitochondria", "ATP Production" —
not compounds) as component links.

**CI/deploy status:** see the note at the end of this log (or the latest
entry above it, if since appended) for the live GitHub Actions/staging
deployment result checked as part of this closeout.

## Phase 3 — Public Compound Directory & Profile Pages (complete)

**Routes (both on-demand, `prerender: false` — everything else stays static):** `/research/compounds` (search/filter/sort directory) and `/research/compounds/[slug]` (full profile: identity, overview, mechanism, evidence-by-type grid, safety, regulatory, citations, stack components).

**Data layer:** `src/lib/supabase.ts` (anon key only), `src/lib/database.types.ts` (hand-maintained against the migration SQL — generating it needs a Management API token, deliberately not kept around). RLS (Phase 2) is the actual enforcement; explicit `.eq('status','published')` filters are defense-in-depth.

**Components:** `EmptyState`/`ErrorState`/`Skeleton` (design handoff §29 state system, hollow-cloud motif per §19), `EvidenceBadge`/`InterpretationBadge` (§20), `RegulatoryRow` (§21), `ClaimBlock`, `StudyCard`, `CompoundCard`, `SearchFilterBar` + framework-free `compound-search.ts` (same minimal-JS approach as `nav.ts`/`theme-toggle.ts` — deliberately not a React island; filtering a card grid by data-attributes doesn't meet CLAUDE.md's bar for genuine interaction complexity).

**Real bugs found and fixed via live testing, not assumed correct:**
- The compound-not-found page had no `<h1>` at all — caught by axe (`page-has-heading-one`), fixed by adding a `headingLevel` prop to `EmptyState`.
- `check:links` crawled the static `dist/client` output, which has no file for an on-demand route — false-positive broken-link report. Rewrote it to crawl a live preview server instead (`scripts/lib/preview-server.mjs`, shared with the e2e global setup/teardown).
- The security-verification script's RLS check depended on a Management API token that's deliberately not kept around after Phase 2 — switched to the `check_rls_enabled` RPC as the primary path (service-role key only), CLI as fallback.
- The service-role key in `.env.local` was rejected mid-phase ("Invalid API key") — confirmed via direct REST calls that only the service-role key was affected (the anon key, what the deployed site actually uses, was unaffected throughout); resolved by refreshing the key value from the dashboard.

**Draft-safety, verified directly against the live project, not assumed:**
- Zero compounds are published (48 remain `draft`, unchanged) — the directory and every profile page render their real, honest empty/not-found states.
- A real imported draft (`bpc-157`) and a genuinely nonexistent slug both return HTTP 404 identically, including a raw anon-key REST check with the exact nested-join query Phase 3 introduces (bypassing the page entirely) — confirmed empty result even without any status filter applied client-side.
- A dev-only template-preview path (`import.meta.env.DEV` gated, clearly-fictional fixture data, `src/lib/fixtures.ts`) was verified to be completely inert in a production build — same slug 404s normally once built.
- Full Phase 2 RLS security suite re-run: 14/14 checks still pass.

**Testing:** 9 unit tests (search/filter/sort against a simulated DOM, happy-dom — the only way to test this without publishing anything), 9 e2e tests (empty state desktop/mobile, draft-leakage boundary ×2, axe on 4 page states), all passing. `check:secrets` clean throughout.

## Phase 2 — Supabase Staging Database (complete)

> **See the "Phase 2/3 Closeout — Correction & Completion" entry above:**
> the "48 imported... 8 correctly held back" framing below was accurate but
> was later summarized elsewhere as "48/48 imported" without equal billing
> for the 8 — corrected 2026-08-06, all 8 since imported as `draft`.

**Project:** `cloudpeptides-staging` (Supabase, separate from any other project on the account, free tier).

- Full Blueprint v2 §5–16 research schema (9 migrations, all validated against a real Postgres parser before ever touching the live project): `compounds`, `compound_aliases`, `stack_components`, `studies`, `sources`, `source_identifiers`, `claims`, `claim_sources`, `regulatory_records`, `content_revisions`, `link_health_checks`, plus the structurally-separate `batch_coas` commerce stub. Locked-down `user_roles` + Custom Access Token Hook + JWT-claim `authorize()` helpers per §16. RLS enabled and policied on all 14 tables; explicit GRANTs (current Supabase default no longer auto-exposes new tables).
- Legacy compound migration: parsed all 87 `legacy-site/*.html` pages with a real HTML parser, classified by breadcrumb parent (99.9% reliable rule, one manual-title-pattern exception caught for a genuine content stub — see below). 56 compounds/stacks identified, 48 imported as **draft**, 8 correctly held back for human review (ambiguous `entity_kind`, never guessed).
- **Real bugs found and fixed via live testing against the actual staging project, not assumed correct:**
  - `semax.html` has no breadcrumb (a stub placeholder in the legacy site itself) — the classifier would have silently bucketed it as a non-compound hub page. Caught via its title still matching every real compound page's pattern; now correctly flagged as an importable-but-stub compound needing real content, never silently dropped.
  - FAQ answers were extracted twice (generic paragraph + proper Q/A pair) — fixed.
  - `SUPABASE_URL` initially included a `/rest/v1/` suffix (copied from the dashboard's "Data API" field) — every request doubled the path and 404'd with a misleading `PGRST125` error that looked like an RLS/schema-cache problem but wasn't. Diagnosed by testing the raw REST endpoint directly.
  - `custom_access_token_hook` wasn't `SECURITY DEFINER`, so it ran as `supabase_auth_admin` — which was never granted `SELECT` on `user_roles` — and every login failed. Fixed; matches Supabase's own documented pattern for this hook.
  - The security-verification script initially treated "UPDATE returned no error" as proof a write succeeded. For `user_roles` (no UPDATE policy at all), an RLS-filtered UPDATE matches zero rows and returns success with no error — a false-failure signal, not a real hole. Fixed to re-verify actual row state via the service-role client.
- **Final verified state:** 48 compounds (all `draft`), 446 claims, 48 provenance sources (one per legacy page, `source_type='other'`, documenting where the text came from — never a fabricated scientific citation), 446 claim_sources, 15/18 stack_components resolved (3 correctly unresolved, referencing the two held-back compounds).
- **Security verification: 14/14 automated checks passed** against the real project — RLS enabled on all 14 tables, anon/member cannot read drafts, contributor can, nobody can write their own role (verified by re-reading actual DB state, not just error absence), contributor cannot publish but editor can, cross-user `user_roles` access blocked, every compound confirmed `draft`.
- Credentials: `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_ANON_KEY` in local `.env.local` (gitignored) for the migration scripts only; `SUPABASE_URL`/`SUPABASE_ANON_KEY` also as GitHub Actions variables/secret for future CI use; a temporary Supabase personal access token (account-wide, used only to link/push migrations via CLI) was recommended for revocation once Phase 2 finished.

## Phase 0 — Planning (complete)

- 2026-08-06 — Repository inspected; `docs/planning/cloudpeptides-platform-blueprint-v2_2.md` confirmed as the authoritative Blueprint v2 and renamed to `cloudpeptides-platform-blueprint-v2.md` via a Git-aware rename (history preserved, `R100`, no content change).
- 2026-08-06 — `CLAUDE.md` drafted from the Blueprint and design handoff, approved verbatim, committed (`19272ad`), pushed to `origin/rebuild/astro-platform`. `main`/production untouched throughout.

## Phase 1B — Staging Deployment (complete)

| Commit | What | Verification |
| --- | --- | --- |
| `fe40994` | Fixed `wrangler.jsonc`: `assets.directory` was `./dist` but the real static-output root for `output: "static"` builds is `./dist/client` (confirmed via `wrangler deploy --dry-run` and the adapter's own generated `dist/client/wrangler.json`, not assumed from generic docs). Renamed the Worker to `cloudpeptides-staging`, set `workers_dev: true`. Disabled the adapter's automatic Cloudflare Images and Session-KV binding provisioning (`imageService: 'passthrough'`, `session: false`) — nothing uses either, and Images can be a paid product; `--dry-run` confirmed "No bindings found" afterward. | Local build + `wrangler deploy --dry-run` clean; full local check suite (format/lint/typecheck/unit/e2e+axe) re-passed. |
| `c5eb6c0` | Added a `deploy-staging` job to `ci.yml`, gated on `ci` passing, push-to-`rebuild/astro-platform` only, skipped entirely if `vars.CLOUDFLARE_ACCOUNT_ID` isn't set. Uses `cloudflare/wrangler-action@v4` with `secrets.CLOUDFLARE_API_TOKEN` + `vars.CLOUDFLARE_ACCOUNT_ID`. | You created a new Cloudflare account and a custom API token scoped to exactly `Account → Workers Scripts → Edit` (no Zone permissions, no KV/D1/R2) and added it as `CLOUDFLARE_API_TOKEN` (secret); the Account ID was added as `CLOUDFLARE_ACCOUNT_ID` (variable, non-secret identifier). |

**Deployed:** `https://cloudpeptides-staging.jessica-holsopple3.workers.dev` — a Cloudflare-provided `*.workers.dev` URL, no custom domain, no production Worker.

**Live-staging verification performed** (against the deployed URL, not just local):
- Smoke: HTTP 200, correct title/content.
- Navigation: brand link, nav link work.
- Mobile: hamburger visible at mobile width, native `<dialog>` opens focus-trapped.
- Dark theme: toggle flips `data-theme` and background color correctly (verified starting from system-preference dark, toggling to light).
- Accessibility: real Playwright + axe-core scan against the live URL — **0 violations**.
- Console errors: **0**.
- Assets: favicon (`.ico`/`.svg`), all 4 brand SVGs, and the built CSS all return 200.
- Broken links: `linkinator --recurse` against the live URL — 4/4 links, 0 broken.

**Known limitation carried forward, unchanged:** the `undici` `npm audit` findings (4 moderate, 1 high), transitive through Cloudflare's own dev-tooling chain, remain unresolved — no non-breaking fix exists yet, `wrangler` was not downgraded. Confined to the local dev/build toolchain; does not affect the deployed Worker's runtime (Cloudflare's own `workerd`, not `undici`). Revisit when Cloudflare ships a compatible patch.

## Phase 1A — Repository Foundation (complete)

All commits below are on `rebuild/astro-platform` only. `main` and the live GitHub Pages site were never touched. No Cloudflare, Supabase, or Resend connection was made.

| Commit | What | Verification |
| --- | --- | --- |
| `a2a0dd7` | Relocated all 99 legacy static-site files into `legacy-site/` via `git mv`, removed the obsolete root `research/stacks/.gitkeep` placeholder | 99/99 files confirmed `R100` pure renames; independent SHA-256 re-hash of all 99 files matched the pre-move manifest exactly; representative relative-link spot checks passed. See [docs/migration/legacy-site-manifest.md](migration/legacy-site-manifest.md). |
| `4f9eb83` | Scaffolded Astro (via an isolated temp-directory `create-astro` run, inspected file-by-file before copying) with TypeScript strict and the official `@astrojs/cloudflare` adapter | `npm run build` and local Cloudflare-runtime preview (`npm run preview`) both verified working; `output: "static"` confirmed as the default (no route opts into on-demand rendering yet). |
| `df92f15` | Added Tailwind v4 (`@tailwindcss/vite`) and the full design-token system from the design handoff (§15–17) | Build verified; compiled CSS spot-checked to confirm approved hex values and the dark-theme override made it through. |
| `c61c50b` | Added `BaseLayout`, `Logo` (all 4 approved variants, inlined for CSS-var theme reactivity), `Nav` (plain Astro + native `<dialog>` mobile menu, no React), `Footer`, and base `Button`/`Card`/`Badge` primitives | Verified live in-browser: desktop/mobile nav behavior, focus-trapped dialog open/close, dark-theme toggle with system-preference fallback and persistence, zero console errors. **Two real bugs found and fixed during this verification, not just asserted correct:** a CSS specificity bug that kept the mobile hamburger button visible at desktop width, and a reliance on the native `<dialog>` `close` event (which this environment's browser did not reliably fire) for `aria-expanded` sync — reworked to set it explicitly at every point the code itself closes the dialog. |
| `e340033` | Added ESLint (flat config, `eslint-plugin-astro` + `typescript-eslint`) and Prettier (+ `prettier-plugin-astro`, `prettier-plugin-tailwindcss`) | `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run build` all pass. `eslint-plugin-jsx-a11y` deliberately omitted — see "Known deviations" below. A Prettier run initially reformatted `CLAUDE.md`/`README.md`/the planning docs; reverted immediately and `.prettierignore` scoped to exclude documentation content from Prettier entirely so this can't recur. |
| `025ce5c` | Added Vitest (unit) and Playwright + `@axe-core/playwright` (e2e/accessibility, Chromium only) | 5/5 unit tests pass (`src/lib/theme.ts`'s pure theme-resolution logic, extracted from `src/scripts/theme-toggle.ts` for testability). 3/3 e2e tests pass, including zero axe violations on the placeholder page. `astro preview` was found to self-detach immediately rather than staying in the foreground — `tests/e2e/global-setup.ts`/`global-teardown.ts` manage its lifecycle explicitly instead of relying on Playwright's automatic `webServer` process tracking; verified clean start/stop across multiple runs. |
| `fd8cdf7` | Added the GitHub Actions CI workflow (format, lint, typecheck, unit tests, build, cached-Chromium e2e/axe, link check) | No deployment job, per Phase 1A/1B split. Not yet verified running on GitHub itself — first real signal comes from the push in this session's final step. |

### Known deviations from the approved Phase 1A plan

- **`eslint-plugin-jsx-a11y` omitted.** Its latest published version (6.10.2) only supports ESLint `^9`, while `eslint-plugin-astro`'s latest (3.1.0) requires ESLint `>=10` — an unresolved upstream peer-dependency conflict as of this writing, not something fixable from this project. Since the project has no JSX/React (CLAUDE.md §4), `jsx-a11y`'s rules would have had nothing to lint here regardless; `eslint-plugin-astro`'s own recommended ruleset still lints `.astro` templates.
- **`.env.example` / `src/env.d.ts` not created.** Nothing in Phase 1A reads an environment variable — inventing placeholder names now would document nothing real. Deferred to whichever later phase first actually needs one.
- **`npm audit` reports 5 vulnerabilities (4 moderate, 1 high) in `undici`**, pulled in transitively through Cloudflare's own dev-tooling chain (`wrangler` → `miniflare` → `@cloudflare/vite-plugin` → `@astrojs/cloudflare`). `npm audit fix --force` would downgrade `wrangler` from `^4.119.0` to `4.35.0` — a breaking regression of the just-verified official adapter setup. Not applied. This tooling only runs locally during dev/build in Phase 1A (nothing is deployed); worth re-checking whenever Cloudflare/Astro ship a fix that doesn't require the downgrade.
- **`wrangler.jsonc`'s `assets.directory` is `./dist`, but the actual Cloudflare-adapter build output is nested under `dist/client/`** (confirmed by inspecting the real build output, not assumed from generic docs, which describe `./dist` directly). `check:links` was pointed at the verified-correct `dist/client`. The `wrangler.jsonc` value itself was left as `astro add cloudflare` generated it, since actually deploying (and confirming the correct value against a real Cloudflare target) is Phase 1B's concern, not Phase 1A's — flagging it here so Phase 1B verifies this before a real deploy is attempted, rather than assuming the auto-generated value is correct.
