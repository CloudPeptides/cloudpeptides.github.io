# Post-Launch Smoke Test Checklist

Run against the real **production** URL (`https://cloudpeptides.org`)
immediately after DNS cuts over (production-cutover-checklist.md
Phase F). Mirrors the same categories already exercised on staging
this phase — the point is confirming production actually behaves the
same way, not re-inventing new checks.

## Core pages

- [ ] Homepage loads, nav/footer render, theme toggle works.
- [ ] `/research/compounds` — directory renders real published
      compounds (not fixtures), search/filter/sort/pagination work.
- [ ] A real compound profile renders claims, citations, evidence
      badges, regulatory section.
- [ ] `/shop` and a product page render (commerce still intentionally
      disabled unless a separate, explicit decision changed that).
- [ ] All 7 policy pages load: `/privacy`, `/terms`, `/disclaimer`,
      `/accessibility`, `/shipping`, `/returns`, `/shop-terms` — and
      are linked from the footer.
- [ ] `/contact` renders; a real test submission delivers to
      `info.order.thecloud@proton.me` (only if Resend/Turnstile are
      confirmed configured for production per the cutover checklist).
- [ ] A genuinely nonexistent path 404s with the branded 404 page, not
      a raw error.

## Admin

- [ ] `/admin` with no session redirects to `/admin/login`.
- [ ] **Updated 2026-08-08 — no bootstrap needed.** Production shares
      staging's Supabase project (production-cutover-plan.md §1), so
      the existing admin account (`jessica.holsopple3@gmail.com`) and
      `user_roles` table already carry over as-is — sign in with the
      same credentials already in use on staging.
- [ ] Sign in, confirm the dashboard loads with the real published
      compound counts (the same ones already visible on staging — one
      shared database, not a fresh/migrated copy).
- [ ] Confirm a contributor-role test account cannot publish; an
      editor-role test account can. `scripts/migration/
      verify-admin-security.mjs` already runs against this exact
      project (it always has, since it's the same one) — re-running it
      here confirms production's own Worker/middleware enforces the
      same boundaries, not just that the database rules do.

## SEO / indexability (the inverse of staging's checks)

- [ ] `/robots.txt` now shows `Allow: /` (not `Disallow: /`).
- [ ] `/sitemap.xml` is reachable and lists real published routes,
      including the 7 policy pages.
- [ ] View-source on the homepage: `<link rel="canonical">` points at
      `https://cloudpeptides.org/...`, not the staging Worker.
- [ ] `X-Robots-Tag` header is **absent** (or explicitly allowing) on
      public pages; still `noindex` on every `/admin*` path.
- [ ] Submit the sitemap URL to Google Search Console / Bing Webmaster
      Tools (manual, one-time, your account).

## Security

- [ ] Response headers present: CSP, `Referrer-Policy`,
      `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`.
- [ ] `Strict-Transport-Security` is now **present** (staging
      deliberately never sends it — production, on its own real
      domain, should).
- [ ] `npm run check:secrets` clean against the production build
      artifact.
- [ ] `npm run db:verify-security` — 14/14 — against the shared
      Supabase project (same one behind both staging and production —
      production-cutover-plan.md §1).

## Staging read-only boundary (new, 2026-08-08)

Confirm staging can no longer write to what is now the live production
database — see production-cutover-checklist.md Phase E for the flip
step this depends on:

- [ ] `STAGING_READ_ONLY` is `"true"` in staging's deployed
      `wrangler.jsonc` and staging has been redeployed since.
- [ ] `npm run db:verify-staging-read-only` passes (10/10 as of this
      writing) — or, run by hand: sign in on the **staging** URL as an
      editor/admin and attempt a publish or user-management action;
      expect a 403 with a message mentioning read-only, and confirm
      the underlying row is unchanged in the database.
- [ ] `/admin` still loads on staging (GET requests are unaffected —
      confirms this is a write boundary, not staging being fully
      broken).
- [ ] The identical action, performed by a properly authorized account
      against the **production** URL, still succeeds — confirms the
      boundary is scoped to staging specifically, not a global outage.

## Legacy redirects

- [ ] Spot-check at least 10 legacy URLs against the live production
      domain and confirm a real 301 with the correct `Location`
      header, e.g.:
      `curl -I https://cloudpeptides.org/bpc-157.html` → 301 →
      `/research/compounds/bpc-157`
- [ ] `curl -I "https://cloudpeptides.org/product.html?id=ghk-cu"` →
      301 → `/shop/ghk-cu`
- [ ] `curl -I https://cloudpeptides.org/about.html` → 301 → `/about`
      (rebuilt 2026-08-08 — no longer "not yet migrated").
- [ ] Confirm a still-"not yet migrated" legacy path (e.g. `/faq.html`)
      does **not** redirect (by design — no replacement page exists
      yet) and instead 404s honestly on the new domain, while the
      original still works at `cloudpeptides.github.io/faq.html`.

## Links and content

- [ ] `npm run check:links` against the production URL — no new
      broken links introduced by the cutover itself (the 3
      pre-existing external citation issues noted in
      production-readiness-audit.md §11 are a separate, known,
      editorial-content item, not a cutover regression).

## Layout / accessibility

- [ ] Spot-check mobile and desktop layouts on the real domain (a
      real device or responsive dev tools, not just staging's earlier
      pass).
- [ ] Run the axe browser extension (or re-point the Playwright e2e
      suite's `baseURL` at production for one manual run) against the
      homepage, directory, a compound profile, and the contact page.

## www

- [ ] Confirm `www.cloudpeptides.org` behaves as decided
      (production-cutover-checklist.md Phase A) — either serves the
      same content or redirects to the apex, never a broken/mismatched
      experience.
