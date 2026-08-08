# Production Cutover Checklist

The literal, ordered "do this" list. `docs/planning/production-cutover-plan.md`
explains *why* each step exists and what depends on what — read that
first if anything here is unclear. Every step below requires **your**
explicit approval or action per CLAUDE.md §9; nothing here is
performed automatically by any session, including this one. Check
items off in order — later steps assume earlier ones are genuinely
done, not just started.

## Phase A — Accounts and domain (your action)

- [ ] **Decided 2026-08-08 — nothing to create here anymore.** No
      production Supabase project, no Pro tier purchase. The existing
      CloudPeptides project (`riuxojncmnhogclrhoys`) becomes production
      directly (production-cutover-plan.md §1). Confirm you still want
      this before proceeding past Phase B — it's the one substantive
      account decision left, and everything below assumes it.
- [ ] Confirm `cloudpeptides.org`'s Cloudflare zone shows "Active" in
      the Cloudflare dashboard (nameserver propagation complete).
- [ ] `www.cloudpeptides.org` behavior — **decided 2026-08-08:**
      permanently redirects (301) to the apex via a Cloudflare
      zone-level Redirect Rule, not a Worker route (see
      `wrangler.production.jsonc`'s own comment). Nothing to decide
      here anymore; Phase D creates the actual rule.

## Phase B — Verify the existing database and take the pre-cutover backup

**Rewritten 2026-08-08 — no schema push, no data export.** There is no
second project to prepare; what's left is confirming the one project
that's about to start serving production traffic is in the state you
expect, and backing it up before anything changes.

- [ ] `supabase migration list` (fresh personal access token, scoped
      for this one check, then revoked) against `riuxojncmnhogclrhoys`
      — confirm all 11 existing migrations show as applied, nothing
      pending.
- [ ] Run `npm run db:verify-security` and
      `npm run db:verify-admin-security` one more time against this
      project as it actually exists today — require the same clean
      results already established (14/14, 18/18) as a final
      confirmation, not a re-derivation from an export.
- [ ] **Take the pre-cutover backup — hard gate, not optional:**
      `npm run db:backup-production` (needs `pg_dump` installed
      locally; point `PROD_DATABASE_URL` at this same project's direct
      Postgres connection string). Move the resulting file to
      encrypted storage outside this repo.
- [ ] **Verify the backup actually restores** — load it into a
      local/throwaway Postgres (`supabase start`) and spot-check row
      counts against a few key tables (`compounds`, `claims`,
      `user_roles`) before treating this phase as complete. This is
      the *only* backup this project will have (Free tier — no
      automatic/point-in-time recovery), so "the file exists" is not
      sufficient; "it's been proven to restore" is the actual bar.

## Phase C — Production secrets and environment

Set as Cloudflare Worker secrets/vars on the **production** Worker
(`cloudpeptides`) — never in a committed file. **Updated 2026-08-08:**
the Supabase-related values are now the *same values* already
configured on staging (one shared project — production-cutover-plan.md
§1/§4), not distinct production-only values — copy them across
deliberately, don't generate new ones:

| Name | Kind | Value |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | build-time var | **Same value as staging's** — one shared Supabase project |
| `PUBLIC_SUPABASE_ANON_KEY` | build-time var | **Same value as staging's** — one shared Supabase project |
| `RESEND_API_KEY` | Worker secret | Can reuse the same Resend account as staging |
| `RESEND_FROM_ADDRESS` | Worker secret | Same verified sending domain as staging |
| `TURNSTILE_SECRET_KEY` | Worker secret | Same Turnstile widget as staging (see next item) |
| `PUBLIC_TURNSTILE_SITE_KEY` | build-time var | Same sitekey as staging |

- [ ] Add `cloudpeptides.org` and `www.cloudpeptides.org` to the
      existing Turnstile widget's allowed-hostnames list (Cloudflare
      dashboard → Turnstile) — same sitekey, no rotation needed.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — **corrected 2026-08-08, twice now:
      this DOES need to be set**, on production same as staging, and
      as of the shared-database decision, it's the **identical value**
      already set on staging (one project, one service-role key — not
      a new one to generate). It's required for admin user/role
      management (`src/pages/api/admin/users/*` —
      `auth.admin.createUser`/`listUsers` and writes to `user_roles`
      have no non-service-role path at all, by Blueprint v2 §16's own
      explicit design). This is the one approved exception, not a
      leak: strictly server-side, used only inside those two routes
      (each independently re-verifies the caller is `admin` via their
      own JWT before ever constructing a service client — never a
      general-purpose passthrough), rate-limited, audit-logged, and
      covered by negative tests (`npm run db:verify-admin-security`)
      proving `member`/`contributor`/`editor`/unauthenticated callers
      are all rejected. Set it as a **Worker secret** on the
      production Worker (`wrangler secret put
      SUPABASE_SERVICE_ROLE_KEY --config wrangler.production.jsonc`,
      piping the value in — never typed/echoed) — never in a
      committed file, never as a `PUBLIC_` var, never referenced from
      client code.
- [ ] **`STAGING_READ_ONLY` is deliberately NOT set here** — it's a
      staging-only Worker var (`wrangler.jsonc`), never on production.
      Its cutover-day flip happens in Phase E below, on the *staging*
      Worker, after production is confirmed live.

### GitHub Actions — repo-level secrets/variables

Set in GitHub repo Settings → Secrets and variables → Actions, exact
names the already-prepared `deploy-production` job in
`.github/workflows/ci.yml` reads. **Updated 2026-08-08:** no separate
`PROD_SUPABASE_URL`/`PROD_SUPABASE_ANON_KEY` variables — removed from
this checklist entirely; `deploy-production`'s build step now reuses
the same `SUPABASE_URL`/`SUPABASE_ANON_KEY` variables `deploy-staging`
already uses (one shared project, nothing to duplicate):

| Name | Kind | Notes |
|---|---|---|
| `CLOUDFLARE_API_TOKEN_PRODUCTION` | secret | A **separate** token from staging's `CLOUDFLARE_API_TOKEN`, scoped to the production Worker only (least privilege) |
| `CLOUDFLARE_ACCOUNT_ID` | variable | Same Cloudflare account already configured for staging — reused as-is |

- [ ] Confirm `SUPABASE_URL` and `SUPABASE_ANON_KEY` (already set for
      `deploy-staging`) exist as repo variables — no new ones to add;
      `deploy-production` now reads these same two.

### GitHub Environment (the manual-approval gate)

- [ ] Settings → Environments → New environment → name it exactly
      `production` → add required reviewers. Until this exists, the
      `deploy-production` job cannot run at all (GitHub's safe
      default) — creating it is what turns the gate on, not a
      formality.

## Phase D — Attach the domain (the literal act of cutover)

- [ ] Uncomment the `routes` entry in `wrangler.production.jsonc`
      (currently commented out on purpose) — apex domain only, `www`
      is never a Worker route (see next step).
- [ ] Create the `www.cloudpeptides.org` → `https://cloudpeptides.org`
      Redirect Rule at the Cloudflare zone level (Rules → Redirect
      Rules, or a Bulk Redirect — either works; a single-rule Redirect
      Rule is simplest for exactly one pattern). 301, preserve path.
- [ ] Merge `rebuild/astro-platform` into `main` via a reviewed,
      explicitly-approved pull request (CLAUDE.md §9 — every time, not
      a one-time exception).
- [ ] Push to `main` (or merge triggers it) → `ci` job runs → 
      `deploy-production` job waits at the `production` Environment
      approval gate → you approve the run in the Actions UI.
- [ ] Confirm the apex domain resolves to the production Worker and
      serves the expected content, and that `www.cloudpeptides.org`
      redirects to it, **before** moving to Phase E.

## Phase E — Redirects, legacy site, and the staging read-only flip

- [ ] The legacy-URL redirects (`src/pages/product.html.astro`,
      `src/pages/[legacy].html.astro`, both reading
      `src/lib/legacy-redirects.ts`) are already live in every deploy,
      staging and production alike — no extra activation step.
      Spot-check a handful of legacy URLs against the live production
      domain anyway (Phase F below covers the full automated check).
- [ ] Leave GitHub Pages (`cloudpeptides.github.io`) live and
      untouched — do not disable it, do not delete `main`'s static
      HTML files. It stays the documented rollback source for **30
      days** minimum (Blueprint §26 Phase 12 / production-cutover-plan.md §7).
- [ ] **New step, 2026-08-08 — flip staging to read-only.** Now that
      production is confirmed live and serving real traffic from the
      shared database, staging must stop being able to write to it:
      1. Edit `wrangler.jsonc` — set `"STAGING_READ_ONLY": "true"`
         (currently `"false"`).
      2. Redeploy staging (`npm run build` + `wrangler deploy`, or push
         to `rebuild/astro-platform` and let `deploy-staging` run it).
      3. Verify: `npm run db:verify-staging-read-only` (or by hand —
         sign in on the staging URL as an editor/admin and attempt a
         publish/user-management action; expect a 403 with a
         read-only message), and confirm `/admin` on staging still
         loads (GET requests are unaffected — only writes are
         blocked).
      4. Confirm the equivalent action still succeeds against the
         **production** URL by a properly authorized account — the
         boundary should block staging specifically, not admin
         mutations everywhere.
      This step is not optional and not deferrable past this phase —
      until it's done, staging remains fully read-write against what
      is now the real production database.

## Phase F — Post-launch verification

- [ ] Run through `docs/planning/post-launch-smoke-test-checklist.md`
      in full against the real production URL — including its
      staging-read-only check, added 2026-08-08.

## Phase G — Monitoring window

- [ ] Watch Cloudflare Worker observability (error rate/latency) for
      the first 24–48 hours.
- [ ] Confirmed rollback path if anything goes wrong, cheapest first:
      1. `wrangler rollback --config wrangler.production.jsonc` — fixes
         any bad-code-only deploy with no bad writes involved (the
         database is untouched by this step either way).
      2. Revert the DNS/custom-domain binding back to GitHub Pages
      3. **No point-in-time recovery exists (Free tier) —** restore
         the Phase B `pg_dump` backup as the only data-level recovery
         option, accepting the loss of anything written since it was
         taken. Never fix forward against production with the
         service-role key under time pressure.
      4. If the problem might involve staging having written something
         it shouldn't have, re-confirm `STAGING_READ_ONLY` is actually
         `"true"` on the live staging deployment before investigating
         further.

## Phase H — 30 days later

- [ ] Confirm production traffic has been stable for 30 days.
- [ ] Disable GitHub Pages (repo Settings → Pages → source "None") —
      stops the free hosting without deleting any file. Do not delete
      `main`'s static HTML files even after this step.
- [ ] `git tag cutover-YYYY-MM-DD` on the commit that was actually
      merged to `main` and deployed, so "what was live at cutover" is
      unambiguous independent of Cloudflare's own deployment history.
