# Legacy Site Manifest

**Purpose:** Verified inventory of every file that made up the pre-rebuild static site, captured immediately before relocating them into `legacy-site/` on `rebuild/astro-platform`. Used to prove the relocation was byte-identical and to serve as the restoration point for rollback, per [CLAUDE.md](../../CLAUDE.md) §2/§8/§11.

**Scope:** 99 tracked files — 87 `.html` pages at the (former) repository root, `css/research.css`, `css/style.css`, `js/app.js`, `js/cart.js`, `js/product.js`, `js/products.js`, `js/shop.js`, and `assets/beauty.png`, `assets/empty-vial.png`, `assets/logo.png`, `assets/repair.png`, `assets/weightloss.png`.

**Explicitly out of scope** (not legacy-site content, stayed at repo root): `README.md`, `CLAUDE.md`, `.gitignore`, `docs/**`. The pre-existing `research/stacks/.gitkeep` placeholder was removed in the same commit as this relocation — it was never legacy content, and the future Astro route lives under `src/pages/research/stacks/` instead.

**Verification method:** two independent hashes recorded per file in [legacy-site-manifest.csv](legacy-site-manifest.csv):
- `sha256` — a standalone content checksum (`sha256sum`), independent of Git's own object model.
- `git_blob_sha` — the file's tracked Git blob OID (`git ls-files -s`) at the moment of capture.

**Verification performed:**
1. Captured this manifest against the 99 files at their original root-level paths.
2. Relocated all 99 files via `git mv` into `legacy-site/` at identical relative paths, in a single commit.
3. Re-counted the relocated files — confirmed still 99.
4. Re-hashed every relocated file (SHA-256) and confirmed each matches its pre-move row in this manifest exactly, path-for-path (accounting for the `legacy-site/` prefix).
5. Confirmed Git recorded every move as a 100%-similarity pure rename (`R100`) — i.e., zero content delta, `git log --follow` history fully preserved.
6. Spot-checked representative pages after the move (`index.html`, the `shop.html` → `js/shop.js` → `js/products.js` → `js/product.js` → `js/cart.js` chain, and `bpc-157.html` → `css/research.css`) to confirm every relative reference still resolves within `legacy-site/`.

The original root `README.md` is preserved both in Git history and as `legacy-site/README.md`, copied there before the root `README.md` is replaced with a rebuild-oriented version.
