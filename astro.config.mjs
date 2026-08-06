// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // The eventual production domain (CLAUDE.md §1: the live GitHub Pages
  // site stays the production identity until an approved cutover) —
  // used to build absolute canonical URLs and the sitemap, even though
  // this currently only ever deploys to the *.workers.dev staging
  // Worker (CLAUDE.md §9: no custom domain, no production deploy
  // without explicit approval). Canonical tags pointing at the real
  // eventual domain rather than the staging URL is standard practice
  // and needs no code change at cutover.
  site: 'https://cloudpeptides.github.io',
  adapter: cloudflare({
    // Nothing in this project uses Astro's <Image> component or
    // optimization yet — 'passthrough' avoids the adapter auto-
    // provisioning a Cloudflare Images binding for a feature that isn't
    // in use, keeping the Worker's footprint (and any billing surface)
    // minimal per CLAUDE.md's "no paid resources without approval" rule.
    imageService: 'passthrough',
  }),
  // Same reasoning — nothing uses Astro's Sessions API, so don't have the
  // adapter auto-provision a KV namespace for it.
  session: false,
  vite: {
    plugins: [tailwindcss()],
  },
});
