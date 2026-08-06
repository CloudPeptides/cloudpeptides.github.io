#!/usr/bin/env node
/**
 * Broken-link check against a live preview server rather than the
 * static dist/client output — Phase 3 introduced on-demand routes
 * (src/pages/research/compounds/**), which have no corresponding static
 * HTML file for a pure filesystem crawler to find. Crawling the running
 * server (real Cloudflare-adapter runtime, same as `npm run preview`)
 * resolves both static and on-demand routes correctly.
 */
import { execSync } from 'node:child_process';
import { startPreviewServer, stopPreviewServer } from './lib/preview-server.mjs';

async function main() {
  const url = await startPreviewServer();
  try {
    execSync(`npx linkinator ${url} --recurse --silent`, { stdio: 'inherit' });
  } finally {
    stopPreviewServer();
  }
}

main().catch((err) => {
  console.error(err);
  stopPreviewServer();
  process.exit(1);
});
