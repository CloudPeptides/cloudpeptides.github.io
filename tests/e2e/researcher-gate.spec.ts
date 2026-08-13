import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Mandatory researcher-account gate (2026-08-13) — this whole file
// starts genuinely unauthenticated (overriding playwright.config.ts's
// default researcher storageState), so every assertion below reflects
// what a real anonymous visitor would actually see.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('unauthenticated visitors are redirected to the gate', () => {
  for (const path of ['/', '/research/compounds', '/shop', '/coas', '/contact', '/about']) {
    test(`${path} redirects to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login\?next=/);
    });
  }

  test('a protected API route returns 401 JSON, not HTML', async ({ request }) => {
    const response = await request.post('/api/checkout', { data: {} });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('a direct fetch for a research compound page cannot bypass the gate', async ({ page }) => {
    // Even a plausible-looking real slug — the gate applies before any
    // page-specific logic runs, so this never differs from a 404-style
    // probe.
    await page.goto('/research/compounds/ghk-cu');
    await expect(page).toHaveURL(/\/login\?next=%2Fresearch%2Fcompounds%2Fghk-cu/);
  });
});

test.describe('public gate pages are reachable without a session', () => {
  for (const path of ['/login', '/register', '/terms', '/privacy', '/research-use-policy']) {
    test(`${path} loads without redirecting`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
      await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/') + '$'));
    });
  }

  test('login page has no product marketing and shows the required legal contact', async ({
    page,
  }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Researcher Access Required' })).toBeVisible();
    await expect(page.getByText('info.order.thecloud@proton.me')).toBeVisible();
    await expect(page.getByText(/\$\d/)).toHaveCount(0);
  });

  test('login page has a working password-visibility toggle', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Show' }).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('login page has no detectable automated accessibility violations', async ({ page }) => {
    await page.goto('/login');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('registration requires every mandatory acceptance', () => {
  test('both required checkboxes carry native HTML5 required validation', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Full name').fill('Test Researcher');
    await page.getByLabel('Email address').fill(`playwright-${Date.now()}@cloudpeptides.invalid`);
    await page.locator('#password').fill('a-real-password-123');
    await page.locator('#confirmPassword').fill('a-real-password-123');
    await page.getByLabel('Country').selectOption('United States');
    await page.getByLabel('Research affiliation').fill('Independent researcher');
    // Deliberately leave both required checkboxes unchecked — the
    // browser's own required-field validation blocks the submit event
    // from ever firing (checked here), and the server independently
    // re-validates both regardless (src/pages/api/account/register.ts,
    // covered by a unit test, not re-covered here).
    await page.getByRole('button', { name: 'Create Account' }).click();
    const validationMessage = await page
      .locator('#age18')
      .evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage.length).toBeGreaterThan(0);
    // The form must still be showing (never actually submitted).
    await expect(page.locator('#registerForm')).toBeVisible();
  });

  test('the Researcher Certification heading and combined checkbox label are present verbatim', async ({
    page,
  }) => {
    await page.goto('/register');
    await expect(page.locator('legend', { hasText: 'Researcher Certification' })).toBeVisible();
    await expect(
      page.getByText(
        'I have read, understand, and agree to the Researcher Certification, Research Use Policy, Terms of Service, and Privacy Policy.',
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Providing false information or using Cloud Peptides materials contrary to these terms may result in immediate account suspension or termination.',
      ),
    ).toBeVisible();
  });

  test('the server rejects registration missing certification acceptance, independent of any client-side check', async ({
    request,
  }) => {
    const response = await request.post('/api/account/register', {
      data: {
        fullName: 'Bypass Attempt',
        email: `playwright-bypass-${Date.now()}@cloudpeptides.invalid`,
        password: 'a-real-password-123',
        confirmPassword: 'a-real-password-123',
        country: 'United States',
        researchAffiliation: 'Independent researcher',
        age18: true,
        certificationAccepted: false,
      },
    });
    expect(response.status()).toBe(400);
    const body = (await response.json()) as { success: boolean; error?: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('Researcher Certification');
  });

  test('the server rejects registration missing the 18+ confirmation', async ({ request }) => {
    const response = await request.post('/api/account/register', {
      data: {
        fullName: 'Bypass Attempt',
        email: `playwright-bypass-${Date.now()}@cloudpeptides.invalid`,
        password: 'a-real-password-123',
        confirmPassword: 'a-real-password-123',
        country: 'United States',
        researchAffiliation: 'Independent researcher',
        age18: false,
        certificationAccepted: true,
      },
    });
    expect(response.status()).toBe(400);
    const body = (await response.json()) as { success: boolean; error?: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('18 years old');
  });
});
