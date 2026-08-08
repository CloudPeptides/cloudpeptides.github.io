# CLAUDE.md

This file guides all AI-assisted work in the Cloud Peptides repository. It is binding for every session.

## 1. Project Purpose

Cloud Peptides is being rebuilt from a static HTML site into a comprehensive research platform (Astro + Cloudflare Workers + Supabase). The existing live static site (root-level `.html` files, `css/`, `js/`, `assets/`) is both the **migration source** and the **production fallback** — it stays live and untouched until an approved cutover phase replaces it.

The authoritative specs for this rebuild are:
- **[docs/planning/cloudpeptides-platform-blueprint-v2.md](docs/planning/cloudpeptides-platform-blueprint-v2.md)** — architecture, data model, security model, editorial/commerce policy, phased roadmap.
- **[docs/planning/cloudpeptides-design-handoff.md](docs/planning/cloudpeptides-design-handoff.md)** — brand mark, design tokens, component and accessibility rules.

If an implementation decision conflicts with either document, **stop and ask** — never silently deviate or "improve on" an approved decision.

## 2. Git and Branch Safety

- Work only on `rebuild/astro-platform` unless explicitly told otherwise.
- Never modify, merge into, push to, force-push, rebase, or delete `main` without explicit approval.
- Never rewrite shared Git history.
- Never delete branches or tags without explicit approval.
- Never deploy to production without explicit approval.
- Keep commits small, logical, descriptive, and scoped to one phase/step.
- Show the diff and test results before committing.
- Never push or open a pull request unless explicitly instructed.
- Preserve the existing production site (the current static HTML) throughout development.

## 3. Implementation Phases

- Follow the Blueprint's phased roadmap (§26) and its stated dependencies between phases.
- Work only on the phase explicitly approved for the current session — never start a later phase because it looks convenient.
- Restate the phase's acceptance criteria before beginning work on it.
- Do not silently expand scope beyond what was approved.
- Stop and wait for approval at the end of every phase.
- Maintain an implementation and migration log (what changed, when, and why) as work proceeds.

## 4. Approved Architecture

- Astro (hybrid rendering)
- TypeScript, strict mode
- React islands only where real client interactivity is needed — static content is never made an island by default
- Tailwind CSS with the approved semantic design tokens (design handoff §15–17)
- Cloudflare Workers via the official `@astrojs/cloudflare` adapter (not Pages)
- Supabase: Postgres, Auth, RLS, Storage
- Resend, called only from server-side Worker routes — never from client code
- Search: Postgres full-text search + `pg_trgm` initially (Meilisearch is a documented future upgrade path, not in scope now)
- Fixed brand assets live in the repository; administrator-uploaded assets live in Supabase Storage
- No Cloudflare R2 unless a demonstrated need is explicitly approved (Blueprint §2)
- No production services touched during local/staging development

## 5. Brand and Visual Requirements

- The design handoff is authoritative for all visual decisions.
- Use the approved hidden-origin **Molecular Lightning Cloud** mark (`docs/brand/logo-*.svg`) exactly as specified — chain drawn behind, cloud drawn in front, z-order only, no masking.
- Do not redesign, recolor outside the approved combinations, or replace the logo without approval.
- Preserve the approved forest / sage / mint / cream / charcoal / blush / terracotta token system (design handoff §15).
- Keep Research and Shop visually distinct modes (forest/mint vs. terracotta accents) at all times.
- Meet WCAG AA contrast on every color pairing actually used.
- Support responsive layouts, full keyboard navigation, visible focus states, dark theme, and `prefers-reduced-motion`.
- This is a full redesign per the design handoff — not a recolor of the existing static site.

## 6. Scientific and Editorial Integrity

- Never invent claims, studies, citations, identifiers, approval statuses, mechanisms, risks, or regulatory information.
- Every substantive scientific claim requires a traceable, cited source (Blueprint §6–7).
- Keep evidence type, evidence quality, and interpretation status as independent fields — never conflate or auto-derive one from another (Blueprint §5).
- Preserve claim-level citations; no uncited free-text paragraphs.
- Clearly distinguish human, animal, in-vitro, mechanistic, regulatory, database, review, and anecdotal evidence.
- Never imply an experimental compound is proven safe or effective.
- Do not generate personalized medical advice, treatment plans, cycles, injection instructions, or purchasing recommendations.
- Published study doses may appear only as clearly contextualized study data, never as usage instructions.
- Surface uncertainty, conflicts, limitations, corrections, and retractions rather than smoothing over them.
- Never use Janoshik or other batch COAs as clinical/scientific evidence (Blueprint §14) — they live only in the separate `batch_coas` commerce model.
- Follow the draft → in review → published editorial workflow (Blueprint §17). Never publish generated research content without that review.

## 7. Research and Commerce Separation

- Research data (`compounds`, `claims`, `sources`, `studies`, `regulatory_records`) and commerce data (`products`, `orders`, `batch_coas`, cart) stay structurally separate — no foreign keys from evidence tables into commerce tables (Blueprint §15).
- No pricing, purchase prompts, or sales calls-to-action inside Evidence, Safety, or Regulatory sections.
- When a compound discussed in Research is also sold in the Shop, disclose that explicitly via the dedicated disclosure module — never an inline mention.
- Do not expand payment processing, add automated sales flows, or introduce medical-marketing claims.
- Preserve existing shop/cart behavior exactly until an approved migration phase replaces it (Blueprint Phase 4).
- Treat **AOD9605** as `identity_confidence = 'unverified'` — never silently alias it to AOD-9604 (Blueprint §12, §27.3).

## 8. Database and Security

- **Updated 2026-08-08:** production does not use a separate Supabase project. The existing CloudPeptides project (`riuxojncmnhogclrhoys`) transitions from staging to also serving as production (docs/planning/production-cutover-plan.md §1) — no Pro tier, no second project, by explicit decision. The Jess Bakes Supabase organization/project is unrelated and must stay completely untouched under all circumstances. Once production is live, staging and production share this one database; the write boundary between them is enforced in application code (the `STAGING_READ_ONLY` flag, checked centrally in `src/middleware.ts`), not by having separate databases — see `src/lib/site-env.ts`'s `isStagingReadOnly()`. Future schema/migration testing must use a local Supabase instance (`supabase start`), never the live hosted project, now that it holds real production data.
- Never connect to, query, migrate, or modify the production Supabase project without explicit authorization — this still applies fully once staging and production are the same project; "authorized as staging work" is not "authorized as production work."
- Every exposed table requires RLS.
- Roles use the approved protected RBAC/custom-claims approach (`user_roles` table + Custom Access Token Auth Hook + JWT claim) — never a client-editable role column (Blueprint §16).
- Ordinary editorial actions (draft, edit, submit for review) use the acting user's own JWT under RLS — not service-role access.
- Service-role access is limited to narrowly scoped, trusted Worker routes, each requiring auth, explicit authorization, input validation, rate limiting, audit logging, narrow scope, and negative tests before shipping (Blueprint §16 table). The one implemented instance is admin user/role management (`src/pages/api/admin/users/*`, backed by `src/lib/auth.ts`'s `createServiceClient()`) — the service-role secret is genuinely present as a Worker secret on the staging Worker (and will be the identical value on production too, since it's the same project) for exactly this reason; that is expected, not a leak, as long as every requirement above still holds.
- Never expose service-role, Resend, Cloudflare, or any other private credential to browser-reachable code.
- Never commit secrets, of any kind, to the repository.
- All schema changes go through reviewed, versioned SQL migrations.
- Never run a destructive database operation without explicit approval; back up and validate before any migration.
- Test every RLS/authorization boundary defined in Blueprint §16's security test table.

## 9. Destructive and External Actions — Explicit Permission Required

Before any of the following, stop and get explicit approval in chat:
- Production deployments
- DNS changes
- Domain registration or transfer
- Activating a paid service or changing billing
- Production database access
- Destructive migrations
- Deleting files, tables, buckets, users, branches, projects, or deployed resources
- Sending real external emails
- Creating external accounts
- Changing authentication providers
- Rotating or revoking credentials
- Merging or pushing Git changes

## 10. Code Quality and Testing

- Use semantic HTML and accessible components throughout.
- Reuse shared components and the centralized design tokens rather than one-off styling.
- Avoid unnecessary client-side JavaScript and dependencies; explain any new dependency before adding it.
- TypeScript strict mode, no exceptions.
- Run formatting, linting, type checking, unit tests, integration tests, Playwright end-to-end tests, accessibility checks, broken-link checks, and Cloudflare-runtime previews as applicable to the change.
- Never claim a phase is complete without reporting the actual test results (pass/fail counts, not "should work").
- Visually inspect both desktop and mobile layouts before calling UI work done.
- Preserve every legacy URL via documented permanent (301) redirects at cutover.
- Add regression tests for existing shop/cart behavior before touching it.

## 11. Working with Existing Files

- Preserve current content during migration — the existing `.html` pages are the source material, not disposable.
- Do not silently overwrite, summarize, or discard existing research text; import it as draft material for editorial review (Blueprint §26 Phase 2).
- Preserve unknown or ambiguous content rather than guessing at its meaning.
- Do not modify files unrelated to the current task/phase.
- Do not delete old static files until the replacement is validated and cutover is explicitly approved.
- Treat the current GitHub Pages static site as the rollback source (kept live for 30 days post-cutover per Blueprint §26 Phase 12).

## 12. Reporting Requirements

**Before a change:** state the phase, its goal, its acceptance criteria, the files/services/migrations/dependencies it touches, and any risks.

**After a change:** list files changed; list commands and migrations run; report actual test results; report security and accessibility implications; report known limitations; show `git status`; then wait for approval before committing, pushing, deploying, or starting another phase.
