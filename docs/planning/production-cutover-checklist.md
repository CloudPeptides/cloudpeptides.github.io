# Production Cutover Checklist

The literal, ordered "do this" list. `docs/planning/production-cutover-plan.md`
explains *why* each step exists and what depends on what — read that
first if anything here is unclear. Every step below requires **your**
explicit approval or action per CLAUDE.md §9; nothing here is
performed automatically by any session, including this one. Check
items off in order — later steps assume earlier ones are genuinely
done, not just started.

## Phase A — Accounts and paid services (your action)

- [ ] Create the production Supabase project (separate from staging's
      `riuxojncmnhogclrhoys`). Approve/activate its Pro tier (~$25/month
      base — production-cutover-plan.md §12/Blueprint §25).
- [ ] Confirm `cloudpeptides.org`'s Cloudflare zone shows "Active" in
      the Cloudflare dashboard (nameserver propagation complete).
- [ ] `www.cloudpeptides.org` behavior — **decided 2026-08-08:**
      permanently redirects (301) to the apex via a Cloudflare
      zone-level Redirect Rule, not a Worker route (see
      `wrangler.production.jsonc`'s own comment). Nothing to decide
      here anymore; Phase D creates the actual rule.

## Phase B — Production database

- [ ] Link the CLI to the new project and push schema:
      `supabase link --project-ref <prod-ref>` then `supabase db push`
      (applies all migrations in `supabase/migrations/`, already
      timestamp-ordered and idempotent) — use a fresh personal access
      token scoped for this one operation, then revoke it.
- [ ] Enable the Custom Access Token Hook in the production project's
      Dashboard → Authentication → Hooks (SQL migration alone cannot
      enable it — same manual step Phase 2 needed on staging).
- [ ] Run the data export (prepared, not yet run — see
      `scripts/migration/export-published-for-production.mjs`'s own
      header for exact invocation): copies only `status='published'`
      compounds/claims and their supporting rows; explicitly skips
      `content_revisions`/`audit_log`/`link_health_checks`/`user_roles`.
- [ ] Run `npm run db:verify-security` against the **production**
      project (point its env vars at production, not staging) —
      require 14/14 before any traffic reaches it.
- [ ] Take the first production backup:
      `npm run db:backup-production` (needs `pg_dump` installed
      locally). Move the resulting file to encrypted storage outside
      this repo.

## Phase C — Production secrets and environment

Set as Cloudflare Worker secrets/vars on the **production** Worker
(`cloudpeptides`) — never in a committed file, never copied verbatim
from staging's values:

| Name | Kind | Value |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | build-time var | Production Supabase project's URL |
| `PUBLIC_SUPABASE_ANON_KEY` | build-time var | Production project's own anon key |
| `RESEND_API_KEY` | Worker secret | Can reuse the same Resend account as staging |
| `RESEND_FROM_ADDRESS` | Worker secret | Same verified sending domain as staging |
| `TURNSTILE_SECRET_KEY` | Worker secret | Same Turnstile widget as staging (see next item) |
| `PUBLIC_TURNSTILE_SITE_KEY` | build-time var | Same sitekey as staging |

- [ ] Add `cloudpeptides.org` and `www.cloudpeptides.org` to the
      existing Turnstile widget's allowed-hostnames list (Cloudflare
      dashboard → Turnstile) — same sitekey, no rotation needed.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — **corrected 2026-08-08: this DOES
      need to be set**, on production same as staging. It's required
      for admin user/role management (`src/pages/api/admin/users/*` —
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
      production Worker the same way it was set on staging
      (`wrangler secret put SUPABASE_SERVICE_ROLE_KEY`) — never in a
      committed file, never as a `PUBLIC_` var, never referenced from
      client code.

### GitHub Actions — repo-level secrets/variables

Set in GitHub repo Settings → Secrets and variables → Actions, exact
names the already-prepared `deploy-production` job in
`.github/workflows/ci.yml` reads:

| Name | Kind | Notes |
|---|---|---|
| `CLOUDFLARE_API_TOKEN_PRODUCTION` | secret | A **separate** token from staging's `CLOUDFLARE_API_TOKEN`, scoped to the production Worker only (least privilege) |
| `CLOUDFLARE_ACCOUNT_ID` | variable | Same Cloudflare account already configured for staging — reused as-is |
| `PROD_SUPABASE_URL` | variable | Production project's URL |
| `PROD_SUPABASE_ANON_KEY` | variable | Production project's anon key |

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

## Phase E — Redirects and legacy site

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

## Phase F — Post-launch verification

- [ ] Run through `docs/planning/post-launch-smoke-test-checklist.md`
      in full against the real production URL.

## Phase G — Monitoring window

- [ ] Watch Cloudflare Worker observability (error rate/latency) for
      the first 24–48 hours.
- [ ] Confirmed rollback path if anything goes wrong, cheapest first:
      1. `wrangler rollback --config wrangler.production.jsonc`
      2. Revert the DNS/custom-domain binding back to GitHub Pages
      3. Restore the production database from the Phase B backup —
         never fix forward against production with the service-role
         key under time pressure

## Phase H — 30 days later

- [ ] Confirm production traffic has been stable for 30 days.
- [ ] Disable GitHub Pages (repo Settings → Pages → source "None") —
      stops the free hosting without deleting any file. Do not delete
      `main`'s static HTML files even after this step.
- [ ] `git tag cutover-YYYY-MM-DD` on the commit that was actually
      merged to `main` and deployed, so "what was live at cutover" is
      unambiguous independent of Cloudflare's own deployment history.
