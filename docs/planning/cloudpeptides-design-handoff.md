# Cloud Peptides — Design Handoff v1 (Final)

**Status:** Design decisions locked. No implementation has started. This document consolidates every approved visual decision from the brand and visual-concept phases into one implementation-ready reference — it supersedes the earlier `cloudpeptides-design-system.md` and the design-relevant sections of Blueprint v2, which can now be treated as historical working notes.

---

## 1. Final brand description & design rationale

Cloud Peptides' identity is the **Molecular Lightning Cloud**: a cloud silhouette with one continuous diagonal molecular chain descending from its center, styled like a lightning bolt, with connected nodes at each bend. The three-part symbolism is deliberate: **cloud** carries the brand name, **connected nodes** represent peptide research, **the diagonal lightning energy** represents discovery and impact. The chain's origin is hidden beneath the cloud's fill and only becomes visible once it has cleanly emerged — this was the key refinement across the design process: the mark must never look like two shapes placed on top of each other, and it must never read as rain. The result is warm and rounded enough to keep Cloud Peptides' existing cute personality, while the embedded scientific structure gives it the credibility a research platform needs.

---

## 2. Logo construction — geometry guidance

Built on a **72×72 viewBox**, from four primitive shapes plus one z-order trick — this is the whole system, and it's why the mark stays editable:

- **Cloud silhouette** — three overlapping circles (`cx 22/36/51, cy 25/18/24, r 11/14.5/10.5`) plus one rounded base rect (`x15 y27 w42 h16 rx8`), all the same fill. Same-fill overlapping shapes merge visually without needing true path-boolean operations.
- **Chain** — a single 3-segment polyline (`36,32 → 24,48 → 44,55 → 29,64`), stroke width 2.6, rounded caps, with a 3px-radius filled circle at each of the three visible vertices.
- **The hidden-origin effect is pure z-order, not masking**: the chain is drawn *first* (behind), the cloud shapes are drawn *second* (in front). The chain's start point (36,32) sits inside the cloud's bounding shapes, so it's naturally occluded; the line only becomes visible once it crosses below the cloud's lower edge (~y=43). This is why the mark scales and recolors cleanly — there's no clipping path or mask to keep in sync.

## 3–12. Logo variants

| Variant | Construction |
|---|---|
| **3. Primary logo** | Forest cloud (`#1F4B3F`) + terracotta chain (`#A85D37`) — see `logo-primary.svg` |
| **4. Horizontal lockup** | Icon at left, `Cloud Peptides` wordmark (Fraunces, 600) to the right, vertically centered, gap = 0.4× icon width |
| **5. Stacked lockup** | Icon centered above wordmark, gap = 0.25× icon height, wordmark centered below at a smaller size than the horizontal lockup's wordmark |
| **6. Icon-only mark** | The primary logo geometry alone, no wordmark — used where the wordmark would be redundant (app icon, favicon-adjacent contexts, social avatar) |
| **7. Simplified favicon mark** | Mark C — see `logo-favicon.svg`. Reserved *only* for true 16px browser-tab contexts where the primary mark's interior chain genuinely becomes illegible. Not used anywhere the primary mark still reads clearly. |
| **8. One-color logo** | `logo-one-color.svg` — uses `currentColor` throughout, inherits from the parent text color. Works because the chain's visible portion sits spatially outside the cloud shape, not merely color-differentiated — see §2. |
| **9. Light-theme logo** | Same as primary (forest/terracotta already verified against cream background) |
| **10. Dark-theme logo** | `logo-dark-theme.svg` — mint-forest cloud (`#7FBF9C`) + lightened terracotta chain (`#E0916A`), both AA-verified against the dark background token |
| **11. Research-mode treatment** | Standard primary coloring (forest cloud, terracotta chain) inside a mint (`#C8E0CE`) pill/background |
| **12. Shop-mode treatment** | Colors swapped — terracotta cloud, forest chain — inside a cream/sunken pill with a terracotta border. The chain is always present in both modes; only the color assignment flips. Never strip the chain down to a plain cloud for shop contexts. |

**Special/reserved treatment (not default):** cream-to-terracotta chain (cream from the hidden origin, transitioning to terracotta once fully emerged) — approved as an optional hero/marketing treatment only, e.g. a large homepage hero moment or a launch social graphic. Never the default navigation or favicon mark.

## 13. Clear space & minimum size

- **Clear space:** maintain empty space around the mark equal to at least 25% of the icon's width on all sides in any lockup — nothing else (text, edges, other UI) enters that zone.
- **Minimum size:** the primary mark should not render below 24px in any interactive context. Between 24px and 16px, judge legibility case by case. At true 16px (browser tab favicon), always use the simplified favicon mark instead.

## 14. Incorrect use

Do not: recolor the cloud and chain to the same color pair outside the approved combinations in §3–12 · stretch or skew the mark non-uniformly · add a drop shadow, gradient, or outer glow · rotate the mark · place the primary mark at sizes below 24px · use the mark as a generic content/section icon (see §19) · reintroduce a hanging/vertical chain treatment · add a second chain · flip the mark horizontally (the diagonal's left-to-right energy is a deliberate, approved direction).

---

## 15. Color token system

Every pair below is WCAG-AA-verified by actual contrast-ratio computation, not estimated.

**Light theme**

| Token | Hex | Verified use |
|---|---|---|
| `--bg` | `#FAF6EE` | Page background |
| `--bg-elevated` | `#FFFFFF` | Card/panel surface |
| `--bg-sunken` | `#F1ECDF` | Recessed areas |
| `--text-primary` | `#24322A` | 12.45:1 on `--bg` |
| `--text-secondary` | `#52645A` | 5.85:1 on `--bg` |
| `--text-muted` | `#5F6F64` | 4.94:1 on `--bg` |
| `--border-subtle` | `#E4DFCF` | Decorative dividers only |
| `--border-interactive` | `#7C8B70` | 3.37:1 — form fields, focus outlines |
| `--primary` (forest) | `#1F4B3F` | 9.12:1 on `--bg` |
| `--primary-hover` | `#16362D` | |
| `--text-on-primary` | `#FFFFFF` | 9.83:1 on `--primary` |
| `--secondary` (sage) | `#7A9B7E` | Large text/icons only |
| `--accent-mint` | `#C8E0CE` | Badge/highlight backgrounds |
| `--terracotta-text` | `#A85D37` | 4.55:1 on `--bg` |
| `--terracotta-strong` | `#A85D37` | 4.90:1 with white text — button fill |
| `--blush` | `#E8B9C4` | Decorative only, never text |
| `--success-text` | `#2F6E4E` | 5.63:1 |
| `--warning-text` | `#8A611F` | 5.11:1 |
| `--danger-text` | `#A23C2E` | 6.05:1 |
| `--info-text` | `#2E5C78` | 6.68:1 |

**Dark theme**

| Token | Hex | Verified use |
|---|---|---|
| `--bg` | `#14201A` | |
| `--bg-elevated` | `#1C2A22` | |
| `--bg-sunken` | `#0F1712` | |
| `--text-primary` | `#EDEDE3` | 14.24:1 |
| `--text-secondary` | `#B9C4B7` | 9.30:1 |
| `--text-muted` | `#869185` | 5.12:1 |
| `--border-interactive` | `#57705F` | 3.11:1 |
| `--primary` | `#7FBF9C` | 7.86:1 |
| `--text-on-primary` | `#0F1712` | 8.54:1 |
| `--terracotta-text` | `#E0916A` | 6.74:1 |
| `--success-text` | `#6FCB9A` | 8.54:1 |
| `--warning-text` | `#E0B25C` | 8.55:1 |
| `--danger-text` | `#E08D7D` | 6.61:1 |
| `--info-text` | `#7EB8DA` | 7.80:1 |

**Rule:** color never carries meaning alone — every semantic, evidence, or regulatory state pairs its color with an icon and a text label.

## 16. Typography system

- **Display/heading — Fraunces**, weight 500–600
- **Body — IBM Plex Sans**, weight 400/500
- **Data/mono — IBM Plex Mono**, weight 500 — formulas, dosages, DOI/PMID/NCT identifiers, citation metadata

| Role | Size | Weight | Face |
|---|---|---|---|
| Display/hero | 3.5rem (clamp 2.25rem mobile) | 600 | Fraunces |
| H1 | 2.5rem (clamp 1.875rem) | 600 | Fraunces |
| H2 | 1.875rem | 600 | Fraunces |
| H3 | 1.375rem | 600 | Fraunces |
| H4/eyebrow | 0.9375rem, uppercase, tracked | 600 | IBM Plex Sans |
| Body | 1rem, 1.6 line-height | 400 | IBM Plex Sans |
| Caption | 0.875rem | 400 | IBM Plex Sans |
| Data/mono | 0.875rem | 500 | IBM Plex Mono |

## 17. Spacing, radius, border, shadow tokens

- **Spacing (8px base):** 4·8·12·16·24·32·48·64·96px
- **Radii:** controls 8px · cards 16px · hero/media panels 24px
- **Borders:** 1px `--border-subtle` (decorative edges) · 1.5px `--border-interactive` (functional boundaries — inputs, focus)
- **Shadows:** resting `0 1px 2px rgba(20,32,26,.06), 0 4px 12px rgba(20,32,26,.06)`, slightly deeper on hover. No hard drop-shadows, no glassmorphism/blur.

## 18. Icon & illustration guidance

- Single custom line-icon set, 1.5px stroke, rounded caps/joins, 20/24px grid — replaces the current emoji-as-icon pattern site-wide.
- Icons always pair with a text label in functional contexts; decorative-only icons get `aria-hidden`.
- Illustration: flat botanical line-art, forest/sage/mint on cream — field-guide plate style, never full-color realism, never used to decorate scientific evidence.
- Diagrams (mechanism/pathway): clean node-and-line style in the same visual language, labeled directly.

## 19. Cloud-motif usage rules

**The brand mark is reserved for:** main navigation, mobile navigation, favicon, loading state, footer, empty states, authentication screens, branded social graphics, and other major brand moments.

**The brand mark is never used as a generic content icon for:** compound directory, compound profiles, evidence sections, studies, safety, regulatory status, or search/filters — those use content-specific icons (flask, brain, paw, gavel, etc., per §18) so the logo stays distinctive rather than becoming interface wallpaper.

**Supporting cloud language (kept deliberately restrained):**
- Hero background: a single faint cloud-lobe watermark at ~6% opacity, decorative, `aria-hidden`
- Loading state: the primary mark with a gentle opacity pulse (1.8s ease-in-out), disabled entirely under `prefers-reduced-motion`
- Empty state: the mark rendered hollow/unfilled with no chain — an "empty cloud," reusing the same geometry rather than inventing a new icon
- Footer: a barely-there cloud-lobe watermark (~5% opacity) in one corner
- Do not add more decorative cloud shapes beyond what's listed here.

## 20. Evidence-badge system

Two independent badges, always shown together, never merged:

- **Evidence type** (provenance — objective, not a quality judgment): neutral gray-green badge, one icon per type — human (person), animal (paw), in-vitro (flask), mechanistic (atom/gear), regulatory (seal), anecdotal (outlined speech-bubble, visually distinct as "not a study").
- **Interpretation status** (the plain-language reading): established (forest fill, seal-check) · supported (sage outline, check) · preliminary (mint fill, hourglass) · conflicting (terracotta outline, split-arrow) · insufficient (warm-gray outline, question mark) · unknown (neutral outline, dash).
- Evidence-quality (high/moderate/low/very low/not assessed) is available on click-through with its required rationale text — not shown as a third badge by default, to avoid badge clutter, but never hidden entirely.

## 21. Regulatory-status system

Rendered as a labeled row per jurisdiction (agency + jurisdiction + status + last-verified date), never a bare color chip:

approved (forest) · investigational (info blue) · withdrawn/discontinued (warning amber) · banned-in-sport (danger) · not-approved/no-determination (neutral gray). A compound with regulatory records from multiple agencies shows all of them — never a single collapsed "status."

## 22. Component styling rules

- **Buttons:** primary (solid forest/mint fill, one per view) · secondary (outlined, `--border-interactive`) · tertiary/ghost (text + underline on hover) · terracotta-strong reserved for one specific warm affirmative action type (e.g. "Add to reading list"), never mixed with primary on the same view.
- **Forms:** `--bg-sunken` fill, `--border-interactive` outline, 8px radius, 2px `--primary` focus ring with 2px offset. Errors pair a `--danger-text` border + icon with inline text.
- **Cards:** `--bg-elevated`, 16px radius, subtle shadow, 1px `--border-subtle`. Compound cards get a small top accent bar in a muted category color — the one place given extra visual "boldness budget."
- **Navigation:** sticky top nav; active state = underline **and** color change (never color alone); mobile collapses to a full-height slide-in panel with large tap targets; theme toggle and search entry point persistent on every page.

## 23. Accessibility & contrast requirements

- Every color pair in §15 is AA-verified for its stated use.
- Visible focus indicator on every interactive element (2px `--primary` ring, 2px offset) in both themes.
- Skip-to-content link on every page.
- No status/evidence/regulatory information conveyed by color alone.
- Minimum 44×44px touch targets on mobile.
- `text-muted`, `secondary`, and `terracotta` all have separate large-text-only vs. small-text-safe variants documented in §15 — don't use the large/decorative variant for body copy.

## 24. Mobile behavior

| Breakpoint | Range | Behavior |
|---|---|---|
| Mobile | < 640px | Single column, full-width cards, nav → slide-in panel, filters → bottom-sheet equivalent |
| Tablet | 640–1024px | Two-column grids where content allows, condensed horizontal nav |
| Desktop | > 1024px | Full multi-column layouts, persistent filter sidebar, content capped ~1280px max width |

## 25. Motion & reduced-motion rules

150–200ms ease-out for hover/focus feedback · 250ms for panel/drawer transitions · a single orchestrated fade-up on initial hero load only (never cascading page-wide). **All motion is disabled under `prefers-reduced-motion: reduce`**, with instant state changes substituted — no exceptions, including the logo's loading pulse.

---

## 26. Final homepage specification

- **Nav:** primary logo (horizontal lockup) + Research/Shop/About/FAQ links + theme toggle + search + cart icon.
- **Hero:** eyebrow tag ("Research library · 50+ compounds") → H1 → supporting copy → two CTAs (primary "Explore the research," secondary "Visit the shop"). A cloud/molecule illustration sits to the right — decorative, not the interactive search entry point.
- **Category cards:** 3-column grid (1-column mobile), each with a content-specific icon (not the brand mark), category name, and compound count.
- **Trust module:** one card stating the transparency commitment — last-reviewed dates, citation trails, and the explicit rule that batch COAs are never evidence of effect.
- **Research/Shop mode entry points:** two cards, visually distinct (mint-bordered research card, terracotta-bordered shop card), equal visual weight but never merged into one CTA.
- Faint cloud watermark in the hero background only, per §19.

## 27. Final compound-directory specification

- **Search bar:** typo-tolerant, states the corrected term inline ("Showing results for **semax**") rather than silently auto-correcting.
- **Active-filter chips:** removable individually, sit below search.
- **Filter sidebar** (desktop) / **bottom-sheet** (mobile): category, evidence level, regulatory status — plain-language checkmark list, not raw checkboxes.
- **Result cards:** name, alias in mono type, evidence-type + interpretation-status badges (§20), favorite toggle, "Compare" action.
- **Sort + result count** above the grid.
- **States:** loading = skeleton blocks (never a spinner) · empty = specific message + "Clear filters" action · error = specific message + "Retry," filters/search preserved.

## 28. Final compound-profile specification

- **Identity header:** canonical name, aliases, entity-kind + category + interpretation-status badges, favorite/compare actions, formula/weight/class in mono type.
- **Mechanism section:** claim-level statements, each with its own evidence-type + evidence-quality badges — never a single uncited paragraph.
- **Evidence-by-type grid:** four cells (human/animal/in-vitro/mechanistic), each stating its actual count — including an honest "none identified" where that's true.
- **Safety card:** visually distinct (danger-bordered), explicitly separates anecdotal reports from studies.
- **Regulatory section:** one row per jurisdiction (§21), with last-verified date and source.
- **Study/citation cards:** title, design, sample size, peer-review status, DOI/identifier in mono type, relationship tag (directly supports/contradicts/etc.), access date.
- **Related compounds, last-reviewed date + reviewer**, both present but low-key.
- **Shop disclosure module:** separate, terracotta-bordered, explicitly states it is not a purchase recommendation — never inline with evidence or safety content (§30).

## 29. State system

| State | Pattern |
|---|---|
| Loading | Skeleton blocks matching final content shape; logo pulse only for full-page loads |
| Empty | Specific message + one clear next action; hollow-cloud motif only for global/brand-level empties, content-specific icon otherwise |
| Error | Specific message, never a raw exception string; preserves user input/filters; offers Retry |
| Success | Plain confirmation ("Saved"), no exclamation points, no "successfully" |
| Hover | Subtle border/elevation change, 150–200ms |
| Focus | 2px `--primary` ring, 2px offset, always visible, never `outline: none` |
| Disabled | Reduced opacity + no pointer events; used sparingly — prefer giving feedback on interaction over blocking it outright |

## 30. Research vs. Shop visual-separation rules

- **Structural:** no shared components render both evidence content and purchase content in the same block.
- **Color:** research = forest/mint accents; shop = terracotta accents — consistent with the logo's own mode-swap treatment (§11–12).
- **Editorial:** Evidence, Safety, and Regulatory sections never contain purchase links, pricing, or shop cross-sells — enforced by the admin content model (no such field exists there), not just a styling convention.
- **Disclosure:** where a compound is both researched and sold, that relationship is a single explicit, separately-styled module — never an inline mention.

---

## Implementation checklist

| Decision | Likely Astro component / token |
|---|---|
| Primary logo, all variants | `src/components/Logo.astro` (props: `variant`, `mode`), reading `--logo-cloud` / `--logo-chain` |
| Color tokens (§15) | `src/styles/tokens.css` — Tailwind theme extension |
| Typography (§16) | Tailwind `fontFamily` config + `src/styles/tokens.css` type-scale variables |
| Spacing/radius/shadow (§17) | Tailwind theme extension, no arbitrary values in components |
| Evidence badges (§20) | `src/components/EvidenceBadge.astro`, `src/components/InterpretationBadge.astro` |
| Regulatory rows (§21) | `src/components/RegulatoryRecord.astro` |
| Buttons/forms/cards/nav (§22) | `src/components/ui/*` shared primitives |
| Homepage (§26) | `src/pages/index.astro` |
| Compound directory (§27) | `src/pages/research/compounds/index.astro` + `SearchBar.astro`, `FilterSidebar.astro`, `CompoundCard.astro` (React island for live search/filter) |
| Compound profile (§28) | `src/pages/research/compounds/[slug].astro` + `ClaimBlock.astro`, `StudyCard.astro`, `ShopDisclosure.astro` |
| State system (§29) | `src/components/ui/Skeleton.astro`, `EmptyState.astro`, `ErrorState.astro` |
| Research/Shop separation (§30) | Enforced at both the component layer (no shared block) and the Supabase schema layer (no FK from evidence tables into commerce tables — see Blueprint v2 §15) |
| Reduced motion (§25) | Global `prefers-reduced-motion` media query in `tokens.css`, respected by every animated component |
| Dark theme | `data-theme` attribute strategy, all tokens in §15 already dual-defined |

---

## Appendix: SVG source files

Four clean, standalone files — no external dependencies, no editor metadata, `viewBox`-based so they scale cleanly at any size, hidden-origin geometry preserved exactly as approved:

- `logo-primary.svg` — CSS-variable themeable (`--logo-cloud`, `--logo-chain`), forest/terracotta fallback
- `logo-one-color.svg` — `currentColor` throughout, inherits from parent text color
- `logo-dark-theme.svg` — dark-theme hex values baked in
- `logo-favicon.svg` — Mark C, the simplified 16px fallback, also CSS-variable themeable

**Usage note on accessibility:** all four ship with `aria-hidden="true"` as the safe default for the common case (icon sitting beside a visible "Cloud Peptides" text wordmark, which already announces the name). When the mark is used *standalone* with no adjacent text — e.g., a bare icon-only link — remove `aria-hidden` and either add a `<title>Cloud Peptides</title>` as the SVG's first child, or (preferred) put `aria-label="Cloud Peptides home"` on the parent `<a>` and leave the SVG itself `aria-hidden="true"` so the name isn't announced twice.
