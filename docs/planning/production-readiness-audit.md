# Production Readiness Audit

Performed 2026-08-08, against the real staging deployment
(`https://cloudpeptides-staging.jessica-holsopple3.workers.dev`) and
the real repository state on `rebuild/astro-platform`. Every finding
below is checked against actual code/config/live behavior — nothing
is assumed. Where a finding was verified by an automated suite, the
suite and its result are named; the exact numbers for this session's
run are in the final chat report, not duplicated here (they'll go
stale here, the report is the point-in-time record).

Legend: ✅ Ready — 🟡 Deferred/needs a decision or production-only step — 🔴 Gap found (see fix)

## 1. Canonical URLs and sitemap — ✅

- `astro.config.mjs`'s `site: 'https://cloudpeptides.org'` is already
  set (ahead of DNS attachment — safe, see §3 below).
- `BaseLayout.astro` emits `<link rel="canonical">` on every page,
  defaulting to `new URL(Astro.url.pathname, Astro.site)` unless a page
  passes an explicit override.
- `src/pages/sitemap.xml.ts` is on-demand and lists: static routes,
  every shop product, every `status='published'` compound (queried the
  same RLS-bounded way the directory page is — never a draft). **Fixed
  this phase:** the 7 new policy pages weren't in it; added.

## 2. robots / indexability behavior — ✅

- `src/pages/robots.txt.ts` is on-demand and environment-aware via
  `src/lib/site-env.ts`'s `isIndexableHost()`: `Allow: /` (+ sitemap
  reference) only when the live request's hostname matches
  `astro.config.mjs`'s `site`; `Disallow: /` on every other host
  (concretely, the staging `*.workers.dev` Worker, right now).
- `src/middleware.ts` sets `X-Robots-Tag: noindex, nofollow` on the
  same non-indexable condition, plus unconditionally on every
  `/admin*` path regardless of host (an editorial dashboard should
  never be indexed, even in production).
- Net effect: staging is fully noindexed today; flipping to indexable
  happens automatically the moment the production Worker's real
  request hostname equals `site` — no code change needed at cutover.

## 3. Domain and www handling — 🟡 deferred decision

- `cloudpeptides.org` purchased 2026-08-07; nameserver propagation to
  Cloudflare was in progress as of this Blueprint's writing — **not
  independently re-checked this session** (production-cutover-plan.md
  §6 explicitly says not to poll this repeatedly; check the Cloudflare
  dashboard directly when convenient).
- `wrangler.production.jsonc` has both `cloudpeptides.org/*` and
  `www.cloudpeptides.org/*` routes prepared but commented out.
- **Open decision, not yet made:** does `www` serve the same content
  directly, or redirect to the apex (or vice versa)? Both routes exist
  in the prepared config either way; picking one and not serving full
  content at both is a cutover-day decision, not a code change.

## 4. Redirects from every legacy GitHub Pages URL — ✅ (upgraded this phase)

- Previously: `docs/planning/legacy-redirect-map.md` existed as a
  **documented mapping only** — no redirect logic existed anywhere.
- **This phase:** implemented `src/lib/legacy-redirects.ts` (all 56
  compound/stack pages, shop/cart/contact/home, and the
  `/product.html?id=X` → `/shop/X` pattern — every entry transcribed
  from that document, unit-tested for fidelity).
- **Real implementation detail, found live, not assumed:** the first
  attempt wired this into `src/middleware.ts`, which turned out to
  never actually run for these paths — Cloudflare's Workers Static
  Assets binding intercepts any path with no matching static file
  (every legacy `.html` URL, since this app never had a real file at
  those paths) and serves the static `404.html` directly, before the
  Worker itself runs, confirmed via both `astro preview` and `wrangler
  dev` and unaffected by `wrangler.jsonc`'s `not_found_handling`
  setting. **Fixed** by making each legacy path a real, matched Astro
  route instead (`src/pages/product.html.astro`,
  `src/pages/[legacy].html.astro`) — a matched route is handled by
  Astro's own on-demand rendering, never the assets-binding fallback.
  Verified end-to-end via `wrangler dev` directly (not just unit
  tests) and via new Playwright e2e tests asserting real 301 status
  codes and `Location` headers.
- **Deliberately excluded:** the ~25 "not yet migrated" legacy pages
  (about/FAQ/category-listing pages) — no rebuilt equivalent exists,
  so redirecting them now would send a visitor to a 404 instead of the
  still-live GitHub Pages original. They now render the same branded
  404 (not a bare error) when requested on the new site, since they
  still match the `.html` catch-all route. Tracked as a real,
  disclosed gap — not fixed this phase (would mean writing ~25 new
  content pages, outside this phase's scope).

## 5. Security headers and CSP — ✅

- `src/lib/security-headers.ts`: `Referrer-Policy`,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Permissions-Policy` (camera/mic/geolocation/payment/usb/interest-
  cohort all denied) on every response.
- CSP: per-request nonce'd `script-src` on-demand
  (`buildDynamicCsp()`), a separate static-route CSP
  (`scripts/postbuild-headers.mjs`, kept manually in sync — documented
  as such) for prerendered pages. Both allow only `'self'` +
  `fonts.googleapis.com`/`fonts.gstatic.com` + `challenges.cloudflare.com`
  (Turnstile). `frame-ancestors 'none'`, `object-src 'none'`,
  `base-uri 'none'`.
- HSTS sent only when `indexable && https:` — never on the shared
  `*.workers.dev` staging domain (this app doesn't own that whole
  domain; sending `includeSubDomains` there would be wrong).
- Admin routes add `X-Robots-Tag: noindex, nofollow` unconditionally
  (§2).

## 6. Supabase authentication and RLS — ✅

- Email/password via Supabase Auth; Custom Access Token Hook (embeds
  `user_role` as a verified JWT claim) confirmed live, not assumed.
- Every `/admin`/`/api/admin/*` request re-verifies the access-token
  cookie against Supabase Auth itself before trusting anything in it.
- RLS is the real authorization boundary for every ordinary editorial
  write (`createUserScopedClient()`); service-role
  (`createServiceClient()`) is reserved for the two tables
  (`user_roles`, `audit_log`) with zero client write grant.
- Verified this session via `npm run db:verify-security`: **14/14**
  (RLS enabled on all 14 tables, draft visibility boundaries,
  contributor-cannot-publish/editor-can, cross-user isolation, no
  client role self-write).

## 7. Admin authorization — ✅

- Baseline gate in `src/middleware.ts` (contributor+ required for any
  `/admin*`/`/api/admin/*` request) is explicitly **not** the only
  gate — every route/page re-checks the specific role its own action
  needs (editor for publish/claim-delete, admin for user/role
  management).
- Self-role-change is blocked outright for every role, including
  admin acting on themselves — eliminates the self-elevation class of
  bug structurally, not just by convention.
- Verified via `scripts/migration/verify-admin-security.mjs` against a
  real locally-previewed build talking to the real staging Supabase
  project, **and** separately against the live deployed staging
  Worker: unauthenticated blocked everywhere, member gets no
  dashboard session, contributor cannot publish (even a fully-cited
  compound — isolates the role check), editor can, only admin manages
  users, nobody can change their own role — checked against actual
  database state afterward, not just HTTP status.

## 8. Contact email delivery — ✅ (staging), 🟡 (production needs its own values)

- `src/pages/api/contact.ts` is layered: launch-config kill switch →
  body-size limit → honeypot → cookie cooldown → Cloudflare native
  rate limit → Resend+Turnstile-both-configured check → Turnstile
  siteverify → field validation/sanitization.
- **Live-verified end to end on staging** (prior session): a real
  submission produced the success UI and the email was confirmed
  received at `info.order.thecloud@proton.me`.
- 🟡 Production needs its own `RESEND_API_KEY` /
  `RESEND_FROM_ADDRESS` / `TURNSTILE_SECRET_KEY` set as secrets on the
  production Worker — never copied from staging's values into a file,
  set fresh at cutover (can reuse the same Resend/Turnstile *accounts*,
  per docs/planning/resend-turnstile-setup.md).

## 9. Turnstile — ✅ (staging), 🟡 (production hostname not yet added)

- Widget renders once `PUBLIC_TURNSTILE_SITE_KEY` is set (it is, on
  staging); CSP already allows `challenges.cloudflare.com` in both the
  dynamic and static variants — no header change needed at cutover.
- 🟡 The production hostnames (`cloudpeptides.org`,
  `www.cloudpeptides.org`) need to be added to the same Turnstile
  widget's allowed-hostnames list before real traffic there can solve
  a challenge (same sitekey, no rotation needed — Turnstile supports
  multiple hostnames per widget).

## 10. Error pages and 404 behavior — ✅ (fixed this phase)

- 🔴→✅ **Gap found and fixed:** no site-wide `404.astro` existed.
  Astro's own on-demand 404 fallback and the Cloudflare assets
  binding's static-404 convention both needed a real page to serve —
  added `src/pages/404.astro` (reuses the existing `EmptyState`
  component, `headingLevel="h1"`, `noindex`, real 404 status).
- The compound-profile 404 (`research/compounds/[slug].astro`, a
  genuinely nonexistent slug) already had its own tailored empty
  state from Phase 3 — unchanged, still correct, still distinct from
  the new catch-all.
- `/api/*` routes return structured JSON errors with real status
  codes (401/403/404/429/503 as appropriate) — never a raw stack
  trace or an HTML error page for an API caller.

## 11. Citation links and broken links — 🟡 3 pre-existing, unrelated findings

- `npm run check:links` crawls a real running preview server (not just
  static output — on-demand routes have no filesystem HTML file).
- **3 broken external citation URLs found** (carried over from before
  this phase, re-confirmed still present, not introduced by this
  phase's changes): an FDA consumer-update page now 404s
  (`lemon-bottle`'s claim), and one JAMA DOI now 403s for two
  different compounds' claims (`growth-hormone-fat-loss-stack`,
  `tesamorelin`). This is exactly the category Blueprint v2 §18
  describes as a low-priority editorial warning (a source going
  stale/bot-blocked says nothing about whether the underlying claim is
  wrong) — not a site defect, and not something this phase's scope
  covers fixing (that's editorial-content work, not platform work). No
  new broken links were introduced by any page/link added this phase.

## 12. Mobile and desktop layouts — ✅

- Verified via the existing Playwright suite (mobile-viewport tests
  for the directory, nav dialog focus-trap test) plus visual review of
  every new page (policy pages, footer) at both breakpoints — the
  shared design-token/component system (`Card`, `Button`, `Badge`,
  `EmptyState`) is reused throughout, not one-off styling, so
  responsive behavior is inherited, not reimplemented per page.

## 13. Accessibility — ✅

- Every page template already carries an axe-core check in the e2e
  suite (home, directory, profile ×2 states, shop ×3, cart, contact,
  404 pattern already covered via the existing not-found empty state).
  New pages (7 policy pages) use the same layout/typography components
  already axe-clean elsewhere — no new patterns introduced.
- New footer links: axe's `link-in-text-block` concern (a link
  distinguishable by color alone inside a text block) was specifically
  checked for every new inline link added this phase (shop
  disclaimers, research directory intro) — each got an explicit
  `text-decoration: underline` rule reusing an already-AA-verified
  color pairing, not a new unverified one.
- Full axe pass re-confirmed as part of this phase's final verification
  run (see chat report for the actual pass count).

## 14. Secret exposure — ✅

- `npm run check:secrets` scans every tracked file plus the built
  `dist/client` output for JWT-shaped strings, generic API-key
  assignments, AWS keys, private-key headers, and GitHub tokens. Clean
  before this phase; re-confirmed clean after it (final verification
  run).
- No secret was printed, logged, or committed at any point this
  phase — the two prior-session credential-handling incidents (a
  secret briefly appearing in a `grep` command's own output, and a
  password generated for the first-admin bootstrap) are both already
  documented in this project's own history/memory and are not
  repeated by anything added this phase.

## 15. Backup and rollback procedures — 🟡 prepared, not yet executable (no production project exists)

- Rollback path is already documented (production-cutover-plan.md
  §11): `wrangler rollback` for a bad code deploy; revert the DNS/
  custom-domain binding back to GitHub Pages (kept live untouched for
  30 days) if the Worker itself is unhealthy; restore-from-backup
  (never fix forward with the service-role key under time pressure)
  for a data-level problem.
- **This phase adds the actual scripts** (prepared, not run — no
  production Supabase project exists yet to run them against):
  `scripts/migration/export-published-for-production.mjs` (staging →
  production data export, published rows only, exact table scope
  matching production-cutover-plan.md §2) and
  `scripts/migration/backup-production.mjs` (a `pg_dump`-based export
  wrapper, prepared for post-cutover use). See
  docs/planning/production-cutover-checklist.md for exactly when each
  runs.

## 16. Staging vs. production environment separation — ✅

- Two separate `wrangler*.jsonc` configs (`name`, `workers_dev`,
  `routes`, and rate-limiter `namespace_id` all distinct) — confirmed
  by inspection, not assumed.
- Two separate GitHub Actions jobs (`deploy-staging` /
  `deploy-production`), gated on different branches, using different
  Cloudflare API token secrets by name
  (`CLOUDFLARE_API_TOKEN` vs. `CLOUDFLARE_API_TOKEN_PRODUCTION`).
  `deploy-production` additionally requires a `production` GitHub
  Environment with required reviewers — doesn't exist yet, so the job
  cannot currently run even if every other condition were met (the
  safe default).
- Production Supabase project doesn't exist yet — by design
  (production-cutover-plan.md §1); staging's project
  (`riuxojncmnhogclrhoys`) is never referenced by any production
  config, and no code path can point a production build at it (the
  build step reads `vars.PROD_SUPABASE_URL`/`PROD_SUPABASE_ANON_KEY`,
  distinct GitHub Actions variables from staging's).
- No `SUPABASE_SERVICE_ROLE_KEY` exists in any Worker config, staging
  or production, in either environment — confirmed by inspection of
  both `wrangler*.jsonc` files and both GitHub Actions jobs; it's read
  only by local one-off scripts and, for staging specifically, by the
  two narrowly-scoped `/api/admin/users/*` routes via a Worker secret
  set directly (never in a committed file).

---

## Deferred decisions requiring your input (not blockers for continued staging work)

1. **`www` behavior** — direct-serve or redirect to apex? (§3)
2. **Registered business entity / physical mailing address / governing
   law / jurisdiction** — none of these exist anywhere in this
   project's records. The 7 new policy pages state this honestly
   rather than inventing an answer; a lawyer should review all seven
   pages before they're treated as final legal language (this was
   already flagged as a requirement in Blueprint v2 §23, before this
   phase existed).
3. **Cookie-consent banner** — not implemented. The site currently
   sets only strictly-necessary functional cookies (form cooldown,
   staff-only admin session) — arguably exempt from consent
   requirements under many regimes, but that's a legal judgment call,
   not an engineering one; flagged for legal review rather than
   decided here.
4. **Production Supabase tier/cost approval** — Pro tier, ~$25/month,
   requires your explicit approval to activate a paid service
   (CLAUDE.md §9).
5. Every item in production-cutover-plan.md §6 (DNS/domain attachment)
   and §4 (production secrets) — all require your explicit
   per-CLAUDE.md-§9 approval and are not, and should not be, done
   automatically by any future session either.
