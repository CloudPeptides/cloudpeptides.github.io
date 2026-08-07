# Production cutover plan

Status: **plan only — nothing in this document has been executed.**
No production Supabase project exists, no production Worker exists, no
DNS has changed, `main` is untouched, GitHub Pages is still live and
unmodified. This is the reference to work from when cutover is
actually approved (Blueprint v2 §26 Phase 12), written against the
real, currently-inspected state of the repo, Supabase staging project,
and Cloudflare account — not a generic template.

## 0. Honest readiness check first

Blueprint §26 makes Phase 12 (Cutover) depend on Phases 1–9. Against
that:

| Phase | Status |
|---|---|
| 1 Repo scaffold, staging deploy, CI | Done |
| 2 Schema + RLS + legacy import | Done |
| 3 Public directory + profiles | Done — 56/56 published on staging |
| 4 Shop/cart parity | Done (existing static-catalog rebuild) |
| 5 Auth + favorites/reading list/comparisons | **Not started** |
| 6 Admin dashboard (draft→review→published UI) | **Not started** — publishing is currently done via one-off scripts under service-role, not an editor UI |
| 7 Resend integration | Code done, **not activated** — see docs/planning/resend-turnstile-setup.md |
| 8 SEO: sitemap/OG/structured data | Done |
| 9 Accessibility & testing hardening | Done, ongoing |

**This plan documents how to execute cutover once you decide to — it
does not claim Phases 5–6 are done, and cutover per the Blueprint's
own dependency chain should wait for them (or for an explicit decision
to cut over without an admin UI, publishing continuing to be a manual
service-role-script process in production too, which carries more
operational risk than the Blueprint intended). Flagging this
explicitly rather than writing a plan that implies today is launch-
ready.**

## 1. Does production need its own Supabase project?

**Yes.** CLAUDE.md §8 and Blueprint §26 both treat staging and
production as separate Supabase projects — never point a production
domain at the staging database. Reasons specific to this project, not
generic caution:

- The staging project (`riuxojncmnhogclrhoys`) currently holds 56
  compounds that are real, cited, published content — but it also has
  every draft/reconciliation/audit-log artifact from the entire
  enrichment build process. Production should start from a clean,
  reviewed export, not the staging project's full history.
- The staging project's free tier auto-pauses after 7 days of
  inactivity (Blueprint §26 cost table) — unacceptable for production
  uptime. Production needs the Pro tier ($25/month base) for backups
  and to avoid auto-pause.
- Anon/service-role keys differ per project; keeping them separate is
  what makes "never expose the service-role key" enforceable per
  environment.

## 2. Schema + data migration, staging → production

1. Create the production Supabase project (your action — CLAUDE.md
   §9 requires explicit approval for this and for activating a paid
   tier).
2. Apply all 11 existing migrations (`supabase/migrations/`, in
   filename order — they're already timestamp-ordered and this repo's
   `supabase db push` already applies them idempotently) to the new
   project via `supabase link` + `supabase db push` against the
   production project ref, using a fresh personal access token scoped
   for that one operation (this repo's existing pattern: use once,
   then revoke — see docs/implementation-log.md's Phase 2 entry and
   this session's own use of that exact pattern).
3. Data: **do not copy the whole staging database.** Export only the
   reviewed, approved rows:
   - `compounds`, `compound_aliases`, `claims`, `claim_sources`,
     `sources`, `source_identifiers`, `studies`, `regulatory_records`,
     `stack_components` — filtered to `status = 'published'` on
     `compounds`/`claims` (currently: all 56/609, but re-filter at
     actual cutover time in case new drafts exist by then).
   - Do **not** carry over `content_revisions`, `audit_log`, or
     `link_health_checks` from staging — production starts its own
     revision/audit history from a clean slate at the moment of
     import, not inheriting staging's build-process noise.
   - `user_roles` — do not copy; production roles are assigned fresh
     to real accounts once Phase 5 (auth) exists.
   - Commerce tables (`products`, `orders`, `batch_coas`) — currently
     unused (the shop is still the static-catalog rebuild, not yet
     backed by these tables); nothing to migrate there yet.
   - Use `pg_dump --data-only --table=...` per table (or a small
     Node script using the service-role key against staging to read,
     production to write, mirroring this project's existing
     `scripts/migration/import-to-supabase.mjs` pattern) rather than a
     full database clone.
4. Re-run `scripts/migration/verify-security.mjs` (already exists)
   against the production project before any traffic reaches it.

## 3. Production Worker

- New wrangler config, not a repurposed staging one — e.g.
  `wrangler.production.jsonc`, with `name: "cloudpeptides"` (or
  whatever final name you choose), the eventual custom domain under
  `routes`, and `workers_dev: false` (staging is the one and only
  `*.workers.dev` deployment; production should not also be reachable
  at a `*.workers.dev` URL — one fewer indexable duplicate surface).
- Its own `FORM_RATE_LIMITER` rate-limit binding (a new
  `namespace_id`, not shared with staging).
- Build step must set `SITE_ENV=production` (see
  scripts/postbuild-headers.mjs and src/middleware.ts's
  `isIndexableHost` — indexing/HSTS both key off this being the
  actual production hostname; `SITE_ENV=production` only affects the
  static-route `_headers` file, the on-demand middleware path is
  already fully automatic based on hostname and needs no flag).
- `astro.config.mjs`'s `site` field must be updated from
  `https://cloudpeptides.github.io` to the real chosen custom domain
  (still undecided per Blueprint §27.1) **before** the production
  build — this one field is what canonical URLs, the sitemap, and the
  indexability check all key off, by design (see src/lib/site-env.ts's
  comment) — no other code changes needed once it's set correctly.

## 4. Environment variables / secrets, by name only

Production Worker needs its own values (never copied from staging)
for every name below — set as Cloudflare Worker secrets/vars against
the production Worker, never in a committed file:

- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` — production
  project's own anon key.
- `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`, `TURNSTILE_SECRET_KEY` —
  can reuse the same Resend/Turnstile accounts created for staging
  (see docs/planning/resend-turnstile-setup.md — Turnstile explicitly
  supports multiple associated hostnames on one sitekey, avoiding a
  rotation; Resend's sending domain, once verified, works for any
  Worker that has the API key).
- `PUBLIC_TURNSTILE_SITE_KEY` — same sitekey as staging, once the
  production hostname is added to that widget's allowed hostnames.
- GitHub Actions repo config (for a production deploy job, §5 below):
  a separate `CLOUDFLARE_API_TOKEN` secret scoped to the production
  Worker only (least privilege — not the same broad token used for
  staging deploys), and `CLOUDFLARE_ACCOUNT_ID` (same Cloudflare
  account, already configured).
- No `SUPABASE_SERVICE_ROLE_KEY` in any Worker config, staging or
  production — it's used only by local one-off scripts, per
  CLAUDE.md §8, and that stays true at cutover.

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
- Add a second GitHub Actions job (alongside the existing
  `deploy-staging` in `.github/workflows/ci.yml`) — `deploy-
  production`, gated on `github.ref == 'refs/heads/main'` and requiring
  a GitHub Environment with manual approval (Settings → Environments →
  "production", required reviewers) so a merge alone can never
  auto-deploy production without a second, explicit human click.

## 6. Custom domain and DNS transition

Blocked on a decision that hasn't been made yet (Blueprint §27.1:
"still undecided, confirmed non-blocking"). Once a domain is chosen:

1. Register/confirm ownership (your action — CLAUDE.md §9).
2. Add the domain to the Cloudflare account (as a zone, if not
   already there) — this is how Workers custom domains and DNS both
   get managed from one place.
3. Add a `routes` entry (or Cloudflare's "Custom Domains" UI, which
   manages the DNS record for you) binding the domain to the
   production Worker.
4. Cloudflare provisions the TLS certificate automatically once the
   zone is active — no manual cert step.
5. **DNS itself is not touched until this exact step, and only with
   your explicit per-change approval** — CLAUDE.md §9 requires
   approval for every DNS change, not just the first one.
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

Every legacy URL must 301 to its new equivalent (CLAUDE.md §10: "Preserve every legacy URL via documented permanent (301) redirects at cutover"). Concretely, from the current `main` branch's flat file list:

- `/<slug>.html` (peptide/compound pages, e.g. `/bpc-157.html`) →
  `/research/compounds/<slug>` where a research profile exists for
  that slug, or `/shop/<slug>` where it was a shop-only page, per the
  existing slug mapping already encoded in `src/lib/shop-products.ts`
  and the 56 published compound slugs.
- `/cart.html` → `/shop/cart`.
- `/about.html`, category-listing pages (e.g.
  `/aging-cellular-senescence.html`) → their nearest new-site
  equivalent, or `/research/compounds` with a filter if no direct
  1:1 page exists — needs a page-by-page mapping table built from the
  actual `main`-branch file list (180 commits, dozens of files) before
  cutover, not guessed here.
- Implementation: Cloudflare Workers can serve redirects directly (a
  small route table in the Worker, checked before the normal Astro
  routing, or a Cloudflare Bulk Redirect List at the zone level once
  the custom domain is on Cloudflare) — bulk redirect lists are
  preferable here since they don't consume Worker request time and
  are easy to audit as a flat list.
- Verify with `scripts/check-links.mjs` (already exists, already run
  in CI) plus a dedicated pass hitting every legacy URL and asserting
  a 301 with the correct `Location`, before cutover is called done.

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
  1. `wrangler rollback` to the previous production Worker version
     (Cloudflare keeps prior deployments) — for a bad code deploy.
  2. Revert the DNS/Custom-Domain binding back to GitHub Pages if the
     Worker itself is unhealthy and (1) doesn't resolve it — this is
     exactly why Pages stays live and untouched for 30 days (§7).
  3. Supabase: production project's own point-in-time backups (see
     §12) for a data-level problem — never fix forward by writing
     directly against production with the service-role key under
     time pressure; restore from backup instead.
- Define an explicit rollback owner and communication step before
  cutover day, not during it — this plan doesn't prescribe who, that's
  your call.

## 12. Backup/export immediately before cutover

- Supabase: trigger a manual backup (or confirm the Pro tier's
  automatic daily backup has run) on the production project
  immediately after the data migration (§2) completes and immediately
  before DNS cuts over — a clean, known-good restore point bracketing
  the actual switch.
- Also export a plain SQL dump (`pg_dump`) of the production
  database to a location outside Supabase itself (encrypted local
  storage or similar) — a backup that depends on the same provider
  you're protecting against isn't a complete backup story.
- Git: tag the exact commit merged to `main` at cutover (e.g. `git tag
  cutover-2026-XX-XX`) so "what was actually deployed" is unambiguous
  later, independent of Cloudflare's own deployment history.

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
