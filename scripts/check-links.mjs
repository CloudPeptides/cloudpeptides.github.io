#!/usr/bin/env node
/**
 * Broken-link check against a live preview server rather than the
 * static dist/client output — Phase 3 introduced on-demand routes
 * (src/pages/research/compounds/**), which have no corresponding static
 * HTML file for a pure filesystem crawler to find. Crawling the running
 * server (real Cloudflare-adapter runtime, same as `npm run preview`)
 * resolves both static and on-demand routes correctly.
 *
 * `--skip` excludes the real production domain (astro.config.mjs's
 * `site`, cloudpeptides.org — purchased 2026-08-07, DNS/custom-domain
 * attachment still pending) from live-reachability checks: every page
 * now carries an absolute canonical/og:url/og:image pointing there
 * (correct — that's the production identity, not the staging Worker),
 * but nothing has actually been deployed to that domain yet pre-cutover
 * (CLAUDE.md §9), so linkinator would otherwise fail on every single
 * page's own canonical tag. Confirmed via a full run that every
 * failure without this skip was exactly that pattern, nothing else.
 */
import { execSync } from 'node:child_process';
import { startPreviewServer, stopPreviewServer } from './lib/preview-server.mjs';

const PRODUCTION_DOMAIN = 'https://cloudpeptides.org';

async function main() {
  const url = await startPreviewServer();
  try {
    execSync(`npx linkinator ${url} --recurse --silent --skip "${PRODUCTION_DOMAIN}"`, {
      stdio: 'inherit',
    });
  } finally {
    stopPreviewServer();
  }
}

main().catch((err) => {
  console.error(err);
  stopPreviewServer();
  process.exit(1);
});
