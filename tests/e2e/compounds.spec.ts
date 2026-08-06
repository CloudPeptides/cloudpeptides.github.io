import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('compound directory', () => {
  test('renders the empty state honestly (nothing is published yet)', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/research/compounds');
    await expect(page).toHaveTitle(/Compound Directory/);
    await expect(page.getByRole('heading', { name: 'Compound Directory' })).toBeVisible();
    await expect(page.getByText('No published compounds yet')).toBeVisible();
    // The search/filter bar only renders when there's at least one
    // compound to search — confirms it isn't rendered against an empty
    // dataset in a broken way.
    await expect(page.locator('[data-compound-search]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('mobile viewport renders the empty state correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/research/compounds');
    await expect(page.getByText('No published compounds yet')).toBeVisible();
  });

  test('has no detectable automated accessibility violations', async ({ page }) => {
    await page.goto('/research/compounds');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('compound profile — draft-leakage boundary', () => {
  test('a real draft compound is not reachable by direct URL', async ({ page }) => {
    // bpc-157 exists in the database as a real, imported draft compound
    // (Phase 2). This must 404 exactly like a slug that doesn't exist at
    // all — no signal to an anonymous visitor that draft content exists.
    const response = await page.goto('/research/compounds/bpc-157');
    expect(response?.status()).toBe(404);
    await expect(page.getByText('Compound not found')).toBeVisible();
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('BPC-157');
    expect(bodyText?.toLowerCase()).not.toContain('tissue repair');
  });

  test('a genuinely nonexistent slug renders identically to a draft slug', async ({ page }) => {
    const response = await page.goto('/research/compounds/this-slug-does-not-exist-anywhere');
    expect(response?.status()).toBe(404);
    await expect(page.getByText('Compound not found')).toBeVisible();
  });

  test('404 page has no detectable automated accessibility violations', async ({ page }) => {
    await page.goto('/research/compounds/bpc-157');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
