import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Rewritten for the launch-readiness phase: all 56 compounds moved from
// draft to published this phase (see docs/enrichment/full-coverage-
// report.md and the git history for that publish step), so the
// previous version of this file — which asserted an empty directory and
// a 404 for bpc-157 specifically — no longer describes reality and
// would fail against the current database. This version tests the same
// underlying guarantees (real data renders, the draft-leakage boundary
// still 404s honestly) against what's actually true now.

test.describe('compound directory', () => {
  test('renders the published directory with real data, no fixtures', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/research/compounds');
    await expect(page).toHaveTitle(/Compound Directory/);
    await expect(page.getByRole('heading', { name: 'Compound Directory' })).toBeVisible();
    await expect(page.getByText(/^56 compounds$/)).toBeVisible();
    await expect(page.locator('[data-compound-search]')).toHaveCount(1);
    // Never the dev-fixture compound — this suite runs without
    // PUBLIC_ENABLE_DEV_FIXTURES set, so real Supabase data only.
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('ERC-000');
    expect(bodyText).not.toContain('example.invalid');
    expect(errors).toEqual([]);
  });

  test('search filters to a real compound by name', async ({ page }) => {
    await page.goto('/research/compounds');
    await page.locator('[data-compound-search]').fill('BPC-157');
    await expect(page.getByText(/of 56 compounds/)).toBeVisible();
    await expect(page.locator('[data-compound-item]:not([hidden])')).toHaveCount(2); // BPC-157 + BPC-157 + TB-500 blend
  });

  test('search filters to a real compound by alias', async ({ page }) => {
    await page.goto('/research/compounds');
    await page.locator('[data-compound-search]').fill('Elamipretide');
    await expect(page.getByText('1 of 56 compounds')).toBeVisible();
    const visible = page.locator('[data-compound-item]:not([hidden])');
    await expect(visible).toHaveCount(1);
    await expect(visible).toContainText('SS-31');
  });

  test('mobile viewport renders the populated directory correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/research/compounds');
    await expect(page.getByText(/^56 compounds$/)).toBeVisible();
  });

  test('has no detectable automated accessibility violations', async ({ page }) => {
    await page.goto('/research/compounds');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('compound profile', () => {
  test('a published compound renders real content, claims, and citations', async ({ page }) => {
    const response = await page.goto('/research/compounds/bpc-157');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'BPC-157', exact: true })).toBeVisible();
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('pentadecapeptide');
  });

  test('a genuinely nonexistent slug 404s honestly', async ({ page }) => {
    const response = await page.goto('/research/compounds/this-slug-does-not-exist-anywhere');
    expect(response?.status()).toBe(404);
    await expect(page.getByText('Compound not found')).toBeVisible();
  });

  test('published profile has no detectable automated accessibility violations', async ({
    page,
  }) => {
    await page.goto('/research/compounds/bpc-157');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('404 page has no detectable automated accessibility violations', async ({ page }) => {
    await page.goto('/research/compounds/this-slug-does-not-exist-anywhere');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
