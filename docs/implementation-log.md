# Implementation & Migration Log

Append-only. One entry per meaningful step, per [CLAUDE.md](../CLAUDE.md) §3/§11/§12.

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
