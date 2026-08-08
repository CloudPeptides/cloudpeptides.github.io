#!/usr/bin/env node
/**
 * Broken-link check against a live preview server rather than the
 * static dist/client output — Phase 3 introduced on-demand routes
 * (src/pages/research/compounds/**), which have no corresponding static
 * HTML file for a pure filesystem crawler to find. Crawling the running
 * server (real Cloudflare-adapter runtime, same as `npm run preview`)
 * resolves both static and on-demand routes correctly.
 *
 * `linksToSkip` excludes the real production domain (astro.config.mjs's
 * `site`, cloudpeptides.org — purchased 2026-08-07, DNS/custom-domain
 * attachment still pending) from live-reachability checks: every page
 * now carries an absolute canonical/og:url/og:image pointing there
 * (correct — that's the production identity, not the staging Worker),
 * but nothing has actually been deployed to that domain yet pre-cutover
 * (CLAUDE.md §9), so linkinator would otherwise fail on every single
 * page's own canonical tag. Confirmed via a full run that every
 * failure without this skip was exactly that pattern, nothing else.
 *
 * Broken results are further split by scripts/lib/link-check-allowlist.mjs
 * into a small, individually-verified set of known-flaky external
 * citation links (warned, not failed) versus everything else (still
 * fails the build) — see that file's own comment for the full
 * reasoning and tests/unit/link-check-allowlist.test.ts for the
 * behavior this depends on.
 */
import { check } from 'linkinator';
import { startPreviewServer, stopPreviewServer } from './lib/preview-server.mjs';
import { classifyBrokenLinks } from './lib/link-check-allowlist.mjs';

const PRODUCTION_DOMAIN = 'https://cloudpeptides.org';

async function main() {
  const url = await startPreviewServer();
  let result;
  try {
    result = await check({
      path: url,
      recurse: true,
      linksToSkip: [PRODUCTION_DOMAIN],
    });
  } finally {
    stopPreviewServer();
  }

  const { allowlistedBroken, realBroken } = classifyBrokenLinks(result.links);

  for (const link of allowlistedBroken) {
    console.warn(
      `WARNING (known flaky, not failing the build): [${link.status}] ${link.url} (linked from ${link.parent})`,
    );
  }
  for (const link of realBroken) {
    console.error(`[${link.status}] ${link.url} (linked from ${link.parent})`);
  }

  const okCount = result.links.length - allowlistedBroken.length - realBroken.length;
  console.log(
    `\nScanned ${result.links.length} links: ${realBroken.length} broken, ${allowlistedBroken.length} known-flaky (allowlisted, not failing), ${okCount} ok.`,
  );

  if (realBroken.length > 0) {
    console.error(`\nERROR: Detected ${realBroken.length} broken link(s).`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  stopPreviewServer();
  process.exit(1);
});
