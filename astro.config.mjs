// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
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
