import { expect, test } from '@playwright/test';

// Full authenticated-content coverage isn't exercised here, matching
// this repo's existing pattern for other admin-only pages (e.g.
// shop.spec.ts's own /admin/coas check below) — that would require
// real credentials, which no e2e test in this suite fabricates.
//
// The page's own indexable-host guard (404s when Astro.locals.
// indexable is true — i.e. on the real production hostname) can't be
// exercised end to end here either: locally and on staging, the
// request hostname never equals the configured production site
// (astro.config.mjs's `site`), so indexable is always false — which is
// itself correct and expected (this page must render on staging, not
// production). The guard's underlying isIndexableHost() logic is
// already unit-tested against a real 'cloudpeptides.org' hostname in
// tests/unit/site-env.test.ts; proving the 404 fires for real would
// require actually deploying this page to production, which defeats
// the point of the guard.
test.describe('private admin pricing catalog', () => {
  test('requires authentication, same as every other admin route', async ({ page }) => {
    await page.goto('/admin/pricing-catalog');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('is not linked from any public page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/admin/pricing-catalog"]')).toHaveCount(0);
    await page.goto('/shop');
    await expect(page.locator('a[href="/admin/pricing-catalog"]')).toHaveCount(0);
  });
});
