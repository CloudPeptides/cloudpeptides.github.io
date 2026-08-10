import { expect, test } from '@playwright/test';

// Full authenticated-content coverage isn't exercised here, matching
// this repo's existing pattern for other admin-only pages (e.g.
// shop.spec.ts's own /admin/coas check below) — that would require
// real credentials, which no e2e test in this suite fabricates.
//
// This page was staging-only during development (an explicit
// indexable-host 404 guard, on top of never being merged past
// rebuild/astro-platform) — both lifted 2026-08-08 once production
// promotion was explicitly approved. It's now reachable on production
// too, gated the same way as every other admin page: authentication +
// admin role + RLS.
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
