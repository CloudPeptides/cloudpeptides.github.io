# Cloud Peptides — Platform Rebuild

Cloud Peptides is being rebuilt from a static HTML site into a comprehensive research platform (Astro + Cloudflare Workers + Supabase). This branch (`rebuild/astro-platform`) contains that in-progress rebuild.

**Start here:** [CLAUDE.md](CLAUDE.md) — binding project rules for any AI-assisted work in this repo, referencing the two authoritative planning documents:

- [docs/planning/cloudpeptides-platform-blueprint-v2.md](docs/planning/cloudpeptides-platform-blueprint-v2.md)
- [docs/planning/cloudpeptides-design-handoff.md](docs/planning/cloudpeptides-design-handoff.md)

## Repository layout

- `src/` — the Astro application (Phase 1A foundation: layout, nav, footer, design tokens; real page content ships in later phases).
- `legacy-site/` — the original static site, preserved verbatim as the migration source and production rollback reference. See [docs/migration/legacy-site-manifest.md](docs/migration/legacy-site-manifest.md) for its verified inventory.
- `docs/` — planning, brand assets, and the migration manifest.
- `docs/implementation-log.md` — running log of what's been built, when, and why.

The live production site (GitHub Pages, served from `main`) is untouched by any of this — it stays live until an approved cutover phase replaces it.

## Local development

Requires Node.js 24 (see `.nvmrc`).

```bash
npm install
npm run dev
```

| Command | Action |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build to `./dist` |
| `npm run preview` | Preview the build locally via the Cloudflare adapter's runtime |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run typecheck` | `astro check` + `tsc --noEmit` |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | E2E + accessibility tests (Playwright + axe) |
| `npm run check:links` | Broken-link check against the built output |
