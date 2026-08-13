import { expect, test } from '@playwright/test';

// Full authenticated-content/wizard-flow coverage isn't exercised here,
// matching this repo's established pattern for other admin-only pages
// (see pricing-catalog.spec.ts) — that's what
// scripts/migration/verify-product-wizard.mjs is for (16/16 passing
// against real Supabase, including transactional rollback proof).
test.describe('Add Product / Peptide wizard + management', () => {
  for (const path of ['/admin/products', '/admin/products/new']) {
    test(`${path} requires authentication`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login/);
    });
  }

  test.describe('genuinely unauthenticated (no session at all)', () => {
    // Mandatory researcher-account gate (2026-08-13): the rest of this
    // suite runs with the default authenticated researcher storageState
    // (playwright.config.ts) — overridden back to no session here, so
    // this asserts real 401 ("not signed in"), not 403 ("signed in but
    // not contributor+"), which is what a researcher session would now
    // otherwise produce against an admin-only route.
    test.use({ storageState: { cookies: [], origins: [] } });

    test('unauthenticated writes to the product API are rejected', async ({ request }) => {
      const createRes = await request.post('/api/admin/products', { data: {} });
      expect(createRes.status()).toBe(401);
      const categoryRes = await request.post('/api/admin/products/categories', {
        data: { name: 'x' },
      });
      expect(categoryRes.status()).toBe(401);
    });
  });

  test('is not linked from any public page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/admin/products"]')).toHaveCount(0);
    await expect(page.locator('a[href="/admin/products/new"]')).toHaveCount(0);
    await page.goto('/shop');
    await expect(page.locator('a[href="/admin/products"]')).toHaveCount(0);
  });
});
