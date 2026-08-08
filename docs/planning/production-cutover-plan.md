# Production cutover plan

Status: **plan only — nothing in this document has been executed.**
`cloudpeptides.org` was purchased 2026-08-07; its nameservers are
propagating to Cloudflare, but no DNS record has been created, no
route/custom-domain has been attached to any Worker, no production
Supabase project exists, no production Worker exists, `main` is
untouched, and GitHub Pages is still live and unmodified. This is the
reference to work from when cutover is actually approved (Blueprint v2
§26 Phase 12), written against the real, currently-inspected state of
the repo, Supabase staging project, and Cloudflare account — not a
generic template.

## 0. Honest readiness check first

Blueprint §26 makes Phase 12 (Cutover) depend on Phases 1–9. Against
that (updated 2026-08-08 — Phase 5/6 and Resend/Turnstile activation
completed since this table was first written; see
docs/implementation-log.md's "Combined Phase" entries for the full
detail):

| Phase | Status |
|---|---|
| 1 Repo scaffold, staging deploy, CI | Done |
| 2 Schema + RLS + legacy import | Done |
| 3 Public directory + profiles | Done — 56/56 published on staging |
| 4 Shop/cart parity | Done (existing static-catalog rebuild); checkout stays deliberately disabled (`COMMERCE_ENABLED = false`) — a launch decision, not a readiness gap |
| 5 Auth (staff/editorial) | Done — Supabase Auth email/password, cookie session, server-verified on every request. Public favorites/reading-list/comparisons were never requested and remain out of scope |
| 6 Admin dashboard (draft→review→published UI) | Done — full editorial dashboard (compounds/claims/sources/studies, publish workflow with pre-flight checks, revision history, audit log, admin-only user/role management), live-verified against the deployed staging Worker (18/18 + 7/7 checks) |
| 7 Resend integration | Done, **activated on staging** — contact form live-tested end to end |
| 8 SEO: sitemap/OG/structured data | Done; policy/trust pages added to the sitemap this phase |
| 9 Accessibility & testing hardening | Done, ongoing |

**Every phase 1–9 dependency for cutover is now satisfied on staging.**
What remains before cutover is genuinely production-specific
work — a separate Supabase project, DNS/domain attachment, and the
explicit approvals CLAUDE.md §9 requires for each — not another
feature phase. See docs/planning/production-cutover-checklist.md for
the exact ordered steps and docs/planning/production-readiness-audit.md
for the full pre-launch audit this phase performed.

## 1. Does production need its own Supabase project?

**No — decided 2026-08-08, superseding everything this section said
before.** The existing CloudPeptides Supabase project
(`riuxojncmnhogclrhoys`) becomes the real production database. It
already holds the complete published research database, RLS, Auth,
the custom access-token hook, and the admin account
(`jessica.holsopple3@gmail.com`) — there is nothing left to migrate.
Explicit, confirmed constraints behind this decision:

- The **Jess Bakes** Supabase organization/project is unrelated and
  stays completely untouched by anything in this document.
- **No Supabase Pro purchase.** Production launches on the Free tier.
- **No second Supabase project.** One project serves both staging and
  production traffic going forward.

This replaces the "clean reviewed export into a fresh project"
approach the rest of this section originally described (§2 below,
also rewritten) — since there's no second project, there's no export
to do; the data that would have been exported is already the live
data in the one project that now serves both roles.

**What this changes, and what it doesn't:**

- Anon key, `PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` are
  now the *same values* on both the staging and production Workers
  (previously planned as distinct per-project values) — see §4.
- RLS, roles, and the custom access-token hook were already exercised
  against real production-shaped traffic on staging throughout this
  entire build; nothing about the security model itself changes at
  cutover.
- **What used to be "separate databases" as the staging/production
  isolation boundary is now an application-level boundary instead:**
  a `STAGING_READ_ONLY` Worker var, checked centrally in
  `src/middleware.ts`, refuses every mutating `/api/admin/*` request
  from the staging Worker once it's set to `"true"` — regardless of
  the caller's role. RLS itself has no way to tell which Worker
  (staging vs. production) issued a request when both hold valid
  credentials against the same project, so this check has to live in
  the application, not the database. It ships off by default
  (`"false"` in `wrangler.jsonc` today, preserving staging's normal
  read-write editorial use) and gets flipped to `"true"` — with
  staging redeployed — as an explicit, late step in
  docs/planning/production-cutover-checklist.md, only once production
  is actually live. See `src/lib/site-env.ts`'s `isStagingReadOnly()`
  and its accompanying tests
  (`tests/unit/site-env.test.ts`,
  `scripts/migration/verify-staging-read-only.mjs`) for the full
  mechanism and its proof.
- **Free-tier limits, honestly stated, not glossed over:**
  - The project can auto-pause after 7 days with zero requests of any
    kind. Real visitor traffic to a live production site makes this
    unlikely in practice, but it's a real possibility worth knowing
    about, unlike on the Pro tier.
  - No Point-in-Time Recovery and no automatic daily backups are
    included — both are Pro-tier-only. The only backup this project
    has is the manual one taken via `scripts/migration/
    backup-production.mjs` (a `pg_dump` wrapper, independent of
    Supabase's own systems) — see §12. **A verified backup
    immediately before cutover is not optional under this plan; it is
    the only safety net that exists.**
  - Standard Free-tier resource limits (database size, monthly active
    users, egress, edge-function invocations) apply — none of them
    are close to being approached at this project's current scale
    (56 published compounds, a handful of staff accounts), but revisit
    this note if that changes materially.
- Future database/migration testing (schema changes, data
  backfills, anything experimental) should use a **local Supabase
  instance** (`supabase start`, already available via this repo's
  `supabase` devDependency) rather than the live hosted project, now
  that the live project is real production data with no staging
  buffer in front of it.

## 2. Verifying current state + taking a pre-cutover backup

There is no schema or data migration step anymore — the project that
will serve production traffic already has the current schema and the
current published content. What's left, immediately before cutover:

1. Confirm all 11 existing migrations (`supabase/migrations/`) are
   applied and match what's live — `supabase migration list` against
   the project (using a fresh personal access token scoped for that
   one check, then revoked, same pattern as before) should show no
   pending migrations.
2. Re-run `scripts/migration/verify-security.mjs` and
   `scripts/migration/verify-admin-security.mjs` (both already exist
   and already pass — see docs/implementation-log.md) one more time,
   immediately before cutover, as a final confirmation that RLS and
   admin authorization still hold against the project as it actually
   exists today — not re-derived from an export, the real thing.
3. Take a verified `pg_dump` backup
   (`npm run db:backup-production`, i.e.
   `scripts/migration/backup-production.mjs`) and confirm it restores
   cleanly (see §12 for the exact verification step) — this is the
   one and only backup this project will have, so "verified" here
   means actually test-restored somewhere, not just "the file exists."
4. Commerce tables (`products`, `orders`, `batch_coas`) remain unused
   — the shop is still the static-catalog rebuild, checkout stays
   disabled (`COMMERCE_ENABLED = false`); nothing to reconcile there.

## 3. Production Worker

A prepared-but-not-deployed config already exists:
`wrangler.production.jsonc` (created this phase, never referenced by
any deploy command or workflow yet). Key points, matching what's
actually in that file:

- `name: "cloudpeptides"` — distinct from `cloudpeptides-staging`.
- `routes`: `cloudpeptides.org/*` and `www.cloudpeptides.org/*`, both
  commented out until DNS is actually live and you approve attaching
  them (CLAUDE.md §9) — activating them is the literal act of cutover,
  not preparation.
- `workers_dev: false` — production should not also be reachable at a
  `*.workers.dev` URL (staging is the one and only such deployment;
  one fewer indexable duplicate surface).
- Its own `FORM_RATE_LIMITER` rate-limit binding (a new
  `namespace_id`, not shared with staging) — this stays Worker-scoped
  and separate even though the database is now shared; rate limiting
  is about protecting each Worker's own request handling, not the
  database.
- **Does not, and should not, set `STAGING_READ_ONLY`** — that var only
  ever applies to the staging Worker's config (`wrangler.jsonc`).
  Leaving it unset on production is correct and required: an unset
  value evaluates to `false` (`isStagingReadOnly()`'s fail-safe
  default), meaning production is always writable, which is the whole
  point of it being production.
- Needs `"not_found_handling": "none"` added to its `assets` block, to
  match staging's fix — the same Cloudflare Workers Static Assets
  bypass issue documented at the top of `src/middleware.ts` applies
  identically to production once it's live, and the legacy-URL
  redirects (§8 below) depend on it.
- `astro.config.mjs`'s `site` field is **already** `https://
  cloudpeptides.org` (updated this phase, ahead of DNS/attachment —
  safe, because src/lib/site-env.ts's `isIndexableHost()` gates
  indexing/HSTS on the *live request's actual hostname* matching
  `site`, not on `site`'s value alone; staging's real
  `*.workers.dev` hostname never matches it, so staging stays
  noindexed regardless). No further `site` change needed at cutover.
- Build step must set `SITE_ENV=production` (see
  scripts/postbuild-headers.mjs — this only affects the static-route
  `_headers` file's noindex/HSTS lines; the on-demand middleware path
  is already fully automatic based on hostname and needs no flag).

## 4. Environment variables / secrets, by name only

**Amended 2026-08-08:** since staging and production now share the
same Supabase project (§1), the Supabase-related values below are the
*same values* on both Workers — not distinct per-environment values as
originally planned. Resend/Turnstile/Cloudflare values were already
planned to be reused; that part is unchanged. Set as Cloudflare Worker
secrets/vars against the production Worker, never in a committed file
— never print any actual value while doing this:

- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` — **the same
  values already configured on staging** (one project, one anon key).
  Not copied into a new project's own keys; there is no new project.
- `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`, `TURNSTILE_SECRET_KEY` —
  reuse the same Resend/Turnstile accounts created for staging (see
  docs/planning/resend-turnstile-setup.md — Turnstile explicitly
  supports multiple associated hostnames on one sitekey, avoiding a
  rotation; Resend's sending domain, once verified, works for any
  Worker that has the API key).
- `PUBLIC_TURNSTILE_SITE_KEY` — same sitekey as staging, once the
  production hostname is added to that widget's allowed hostnames.
- GitHub Actions repo config, matching the `deploy-production` job
  already prepared in `.github/workflows/ci.yml` (§5 below) by exact
  name:
  - `secrets.CLOUDFLARE_API_TOKEN_PRODUCTION` — a separate token,
    scoped to the production Worker only (least privilege — not
    `secrets.CLOUDFLARE_API_TOKEN`, which `deploy-staging` uses). This
    stays Worker-scoped and distinct even though the database is
    shared — it controls which Cloudflare deployment target the token
    can touch, unrelated to which database is behind it.
  - `vars.CLOUDFLARE_ACCOUNT_ID` — same Cloudflare account, already
    configured for `deploy-staging`, reused as-is.
  - **`vars.PROD_SUPABASE_URL`/`vars.PROD_SUPABASE_ANON_KEY` are no
    longer needed and should not be created.** `deploy-production`'s
    build step now reuses `vars.SUPABASE_URL`/`vars.SUPABASE_ANON_KEY`
    — the exact same two repo variables `deploy-staging` already
    uses — since both jobs now build against the one shared project.
    This simplifies the checklist: two fewer GitHub variables to ever
    create or keep in sync.
- `SUPABASE_SERVICE_ROLE_KEY` — **corrected 2026-08-08, twice now.**
  This document originally said this key must never appear in any
  Worker config, staging or production; that was wrong (see Blueprint
  v2 §16's explicit design and CLAUDE.md §8's approved exception —
  admin user creation and role management have no non-service-role
  path at all). It **is** set as a Worker secret on staging today. At
  cutover, set the **identical value** (same project, so there is only
  one real service-role key to use — not a new one to generate) as a
  Worker secret on production too, via `wrangler secret put
  SUPABASE_SERVICE_ROLE_KEY --config wrangler.production.jsonc`,
  piping the value in rather than typing/echoing it. See
  docs/planning/production-cutover-checklist.md's Phase C for the
  full safeguard list (auth, admin-role re-check, rate limiting,
  audit logging, narrow scope, negative tests) that makes this the
  approved exception rather than a leak.
- **`STAGING_READ_ONLY` is deliberately absent from this list** — it's
  a staging-only Worker var (see §1 and §3 above), never set on
  production.

## 5. Branch and pull-request strategy

- Continue building on `rebuild/astro-platform` until cutover is
  approved; keep `main` as the untouched static-site rollback exactly
  as CLAUDE.md §2 requires.
- At cutover: open a pull request from `rebuild/astro-platform` into
  `main`, reviewed and explicitly approved by you before merge
  (CLAUDE.md §9 — merging to main requires explicit approval every
  time, this is not a one-time exception).
- After merge, `main` becomes the source for both the (retiring)
  GitHub Pages static site and the new production Worker build —
  GitHub Pages naturally stops receiving *new* content the moment its
  own source files stop being edited, but it isn't retired by the
  merge itself (see §7).
- The second GitHub Actions job — `deploy-production` — already exists
  in `.github/workflows/ci.yml`, gated on `github.ref ==
  'refs/heads/main'` and an `environment: production` block. It has no
  effect yet: the `production` GitHub Environment doesn't exist in repo
  Settings until you create it (Settings → Environments → New
  environment → "production" → add required reviewers), and `main`
  isn't being pushed to. Creating that Environment with required
  reviewers is what turns the gate on — without it, GitHub treats an
  environment reference to a nonexistent environment as a hard stop,
  which is the safe default in the meantime.

## 6. Custom domain and DNS transition

Domain decided: `cloudpeptides.org`, purchased 2026-08-07. Its
nameservers are currently propagating to Cloudflare (meaning it's
already been added as a Cloudflare zone — that's what generates the
nameservers you point the registrar at). Nothing further happens on
its own; every step below still needs your explicit action/approval
(CLAUDE.md §9), and none of them are done yet:

1. Confirm nameserver propagation is complete (Cloudflare's dashboard
   shows the zone as "Active") — not polled or checked repeatedly by
   me per your instruction; check it yourself when convenient.
2. **Decided 2026-08-08:** `www.cloudpeptides.org` permanently
   redirects to `https://cloudpeptides.org` (301) — it does not serve
   content directly. Implemented as a Cloudflare zone-level Redirect
   Rule, not a Worker route (see `wrangler.production.jsonc`'s own
   comment on why: no reason to spend Worker request time or risk
   duplicate-content drift on a path that only ever needs to redirect).
   Still not created — this is the record of the decision, not the
   execution of it; creating the actual Redirect Rule is a cutover-day
   action requiring your explicit approval same as everything else
   here.
3. Attach the `routes` entry in `wrangler.production.jsonc` (present
   but requires your explicit go-ahead to become live) — binding the
   apex domain to the production Worker. This is the actual "custom
   domain attachment" step, still not done. (`www` is handled entirely
   by the Redirect Rule in step 2, not this file.)
4. Cloudflare provisions the TLS certificate automatically once the
   route/zone is active — no manual cert step.
5. **No DNS record is created and no route is attached until this
   exact step, and only with your explicit approval** — confirmed
   nothing beyond nameserver-level propagation (which you already
   initiated at the registrar, not me) has happened.
6. Verify the domain resolves to the production Worker and serves the
   expected content *before* the redirect/Pages-retirement steps below
   — those steps assume the new domain is already live and correct.

## 7. GitHub Pages retirement

- Not retired until 30 days after cutover (Blueprint §26 Phase 12
  acceptance criteria: "GitHub Pages kept as untouched rollback for 30
  days"). During that window, GitHub Pages keeps serving the old
  static site at `cloudpeptides.github.io` unless/until DNS/traffic
  has fully moved to the new custom domain.
- After 30 days of confirmed-stable production traffic: disable Pages
  in repo Settings → Pages ("None" as the source), which stops the
  free hosting without deleting any file — `main`'s static HTML stays
  in git history regardless.
- Do not delete the static HTML files from `main` at this step either
  — CLAUDE.md §11: "Do not delete old static files until the
  replacement is validated and cutover is explicitly approved" refers
  to the *files*, and there's no reason to remove them from history
  even after Pages itself is turned off; they remain the documented
  rollback source.

## 8. Redirect activation

**Done, not just planned — corrected 2026-08-08.** Every legacy URL
with a rebuilt equivalent already 301s to it, live on staging today,
no cutover-day step required:

- `src/lib/legacy-redirects.ts` holds the full mapping (56 compound/
  stack pages, shop/cart/contact/home/about, the
  `/product.html?id=X` → `/shop/X` pattern) — see
  `docs/planning/legacy-redirect-map.md` for the human-readable table
  it's transcribed from.
- Implementation is two real, matched Astro routes
  (`src/pages/product.html.astro`, `src/pages/[legacy].html.astro`),
  **not** Worker middleware and **not** a Cloudflare Bulk Redirect
  List as originally planned here — found live that Cloudflare's
  Workers Static Assets binding intercepts any path with no matching
  static file before the Worker itself runs, which would have made
  both of those approaches silently no-op. A matched Astro route
  sidesteps that entirely.
- `/about.html` → `/about` was the one legacy URL genuinely still
  unresolved as of the last correction pass — `src/pages/about.astro`
  now exists (content carried forward from the legacy page's own
  established mission language) and the redirect is live.
- Still deliberately unmapped: `/faq.html`, `/research.html`,
  `/compound-directory.html`, `/stacks.html`, and the ~20 category-
  listing pages (`/aging-cellular-senescence.html` etc.) — no rebuilt
  equivalent exists for any of them yet (see
  `docs/planning/legacy-redirect-map.md`'s "Not yet migrated" list).
  Redirecting them now would send a visitor to a 404 instead of
  GitHub Pages' still-live original; add each one only once its real
  replacement page ships.
- Verified via `npm run check:links` (crawls a live preview server)
  plus dedicated Playwright e2e tests (`tests/e2e/policy-pages.spec.ts`)
  asserting real 301 status codes and `Location` headers for every
  mapped legacy path — not just asserted, actually run.

## 9. Cache behavior

- Static assets (`/_astro/*`) already get `Cache-Control: public,
  max-age=31536000, immutable` (content-hashed filenames make this
  safe — a new deploy never reuses an old hash) — unchanged at
  cutover, same mechanism in the production `_headers` file.
- HTML responses (on-demand research pages) are not cached by
  Cloudflare by default for Worker-generated responses — intentional,
  since compound content can change after an editorial update; revisit
  only if traffic volume ever makes this a real cost/latency issue,
  with an explicit cache-invalidation story (e.g. purge-on-publish)
  designed at that point, not assumed now.
- Sitemap/robots.txt: on-demand, never cached at the edge, for the
  same reason — they reflect the live published set.

## 10. Sitemap and robots transition

Both are already environment-aware and require **no code change** at
cutover, only the `astro.config.mjs` `site` update in §3 above:

- `src/pages/robots.txt.ts` — once the production Worker's request
  hostname equals the (now-updated) `site` config, it automatically
  serves `Allow: /` + the real sitemap reference instead of staging's
  `Disallow: /`.
- `src/pages/sitemap.xml.ts` — already lists every published compound
  from the live database plus static/shop routes; unaffected by
  cutover except that it'll now be reachable at the real domain and
  actually get crawled (staging's copy is intentionally excluded via
  robots.txt, per this phase's own noindex work).
- Submit the new sitemap URL to Google Search Console / Bing Webmaster
  Tools after cutover (manual, one-time, your account).

## 11. Monitoring and rollback

- Cloudflare's built-in Worker `observability` is already enabled
  (`wrangler.jsonc`) — carry the same setting into the production
  config; use it to watch error rates/latency immediately after
  cutover.
- Rollback path, cheapest first:
  1. `wrangler rollback --config wrangler.production.jsonc` to the
     previous production Worker version
     (Cloudflare keeps prior deployments) — for a bad code deploy.
     Since the database is shared, this alone fixes any problem that's
     purely in Worker code with no bad writes involved — the more
     common case.
  2. Revert the DNS/Custom-Domain binding back to GitHub Pages if the
     Worker itself is unhealthy and (1) doesn't resolve it — this is
     exactly why Pages stays live and untouched for 30 days (§7).
  3. **Amended 2026-08-08 — no Pro-tier point-in-time recovery
     exists.** The Free tier has no automatic backups at all (§1), so
     a data-level problem can only be fixed by restoring the manual
     `pg_dump` taken immediately before cutover (§12) — there is no
     "restore to 10 minutes ago" option the way there would be on Pro.
     This makes the pre-cutover backup materially more important than
     it would be under the original plan, not just a nice-to-have:
     never fix forward by writing directly against production with
     the service-role key under time pressure; restore from that
     backup instead, accepting the loss of anything written since it
     was taken.
  4. Because staging and production share a database, rolling back the
     *production Worker* does not by itself stop the *staging Worker*
     from having already written something unwanted — confirm
     `STAGING_READ_ONLY` is (and stays) `"true"` on staging as part of
     any rollback investigation, not just at initial cutover.
- Define an explicit rollback owner and communication step before
  cutover day, not during it — this plan doesn't prescribe who, that's
  your call.

## 12. Backup/export immediately before cutover

**Amended 2026-08-08 — rewritten for the shared-project architecture
(§1).** There is no data migration step to bracket anymore; the one
thing that must happen, without exception, immediately before DNS
cuts over:

- Run `npm run db:backup-production`
  (`scripts/migration/backup-production.mjs`) — a `pg_dump` of the
  live project to a location outside Supabase itself (this script
  already exists and already works; nothing new to build). This *is*
  the backup — there is no Supabase-native automatic backup to
  additionally trigger or confirm on the Free tier (§1), unlike the
  original plan's assumption of a Pro-tier daily backup underneath it.
- **Verify the backup is actually restorable**, not just that the
  file was written — e.g. restore it into a local/throwaway Postgres
  instance (`supabase start` gives you one) and spot-check row counts
  against the live project for a few key tables (`compounds`,
  `claims`, `user_roles`). A backup nobody has ever restored is a
  hope, not a backup.
- Store the dump somewhere durable and outside Supabase (encrypted
  local storage or similar) — a backup that depends on the same
  provider you're protecting against isn't a complete backup story.
- Git: tag the exact commit merged to `main` at cutover (e.g. `git tag
  cutover-2026-XX-XX`) so "what was actually deployed" is unambiguous
  later, independent of Cloudflare's own deployment history.
- This backup step is a hard prerequisite for cutover, not a
  parallel/optional task — see
  docs/planning/production-cutover-checklist.md, which now sequences
  it as its own gating phase before DNS/domain steps.

## 13. Post-launch verification

Re-run this project's existing, already-proven verification suite
against the *production* URL once DNS has propagated, the same
categories already exercised on staging this phase:

- All 56 (or however many are published by then) compound profiles
  render with real data, no fixtures.
- Search/filter/sort/pagination work.
- Anon RLS boundaries hold (published readable, draft/internal not).
- Security headers present (CSP/HSTS-now-enabled/Referrer-Policy/etc.)
  — HSTS specifically should now be present, unlike on staging.
- Sitemap/robots now indexable (the inverse of this phase's staging
  check).
- No secrets in the production build's client or server artifacts.
- Every legacy URL 301s correctly (§8).
- Mobile/desktop, light/dark themes, accessibility scan.
- Contact/checkout forms — if Resend/Turnstile are active by then —
  actually deliver a real test email end-to-end, not just "route
  responds."
- `scripts/check-links.mjs` clean against the production URL.
- **New for the shared-database architecture:** confirm
  `STAGING_READ_ONLY` was flipped to `"true"` and staging redeployed
  (docs/planning/production-cutover-checklist.md's dedicated step),
  then run `npm run db:verify-staging-read-only` (or attempt a real
  mutation against the staging URL by hand) and confirm it's refused
  with a 403 — while the same action against the production URL, by a
  properly authorized editor/admin, still succeeds.
