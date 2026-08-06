import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home page renders the base layout with working nav and footer', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Cloud Peptides/);
  await expect(page.getByRole('link', { name: 'Cloud Peptides home' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cloud Peptides');
  await expect(page.locator('footer')).toBeVisible();
});

test('mobile nav toggle opens a focus-trapped dialog', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  const toggle = page.getByRole('button', { name: 'Open menu' });
  await toggle.click();

  const dialog = page.locator('[data-nav-dialog]');
  await expect(dialog).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
});

test('home page has no detectable automated accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
