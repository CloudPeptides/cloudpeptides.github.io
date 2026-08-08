import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('shop directory', () => {
  test('lists all 47 products and supports search', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.getByRole('heading', { name: 'Shop 10 Vial Kits' })).toBeVisible();
    await expect(page.getByText('47 products')).toBeVisible();

    await page.locator('[data-shop-search]').fill('nad');
    const visible = page.locator('[data-shop-item]:not([hidden])');
    await expect(visible).toHaveCount(1);
    await expect(visible).toContainText('NAD+');
  });

  test('category filter narrows the grid', async ({ page }) => {
    await page.goto('/shop');
    await page.locator('[data-shop-filter="Beauty + Repair"]').click();
    const visible = page.locator('[data-shop-item]:not([hidden])');
    const count = await visible.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(47);
  });

  test('has no detectable automated accessibility violations', async ({ page }) => {
    await page.goto('/shop');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

// Rewritten for the research-platform-first launch: COMMERCE_ENABLED is
// false (src/lib/launch-config.ts) — Add to Cart is a genuinely disabled
// button (native `disabled`, not just visually styled), the cart page
// never renders the interactive cart/checkout markup at all, and
// src/pages/api/checkout.ts hard-rejects every request before any
// parsing/Resend/Turnstile work. The previous version of this file
// exercised the live add-to-cart/checkout flow, which no longer exists
// while commerce is disabled — this version tests the same underlying
// guarantee the task asked for instead: no order can be placed, no
// checkout email can be triggered, no misleading purchase CTA remains.
test.describe('product detail + cart (commerce disabled)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shop/ghk-cu');
    await page.evaluate(() => localStorage.removeItem('cp-shop-cart'));
  });

  test('the option selector still updates displayed price (informational only)', async ({
    page,
  }) => {
    await page.selectOption('[data-option-select]', '1'); // 100mg option
    await expect(page.locator('[data-price]')).toHaveText('$170.00');
    await expect(page.getByText('Coming soon — ordering is not yet available')).toBeVisible();
  });

  test('Add to Cart is a genuinely disabled control, not just styled to look inert', async ({
    page,
  }) => {
    const button = page.locator('[data-add-to-cart]');
    await expect(button).toBeDisabled();
    await expect(button).toHaveText('Coming Soon');

    // A disabled native <button> cannot dispatch a click event at all —
    // force:true bypasses Playwright's actionability check to prove
    // that even a forced click reaches nothing (no cart mutation).
    await button.click({ force: true }).catch(() => undefined);
    const cart = await page.evaluate(() => localStorage.getItem('cp-shop-cart'));
    expect(cart).toBeNull();
  });

  test('cart page shows a coming-soon notice, never a live cart or checkout form', async ({
    page,
  }) => {
    await page.goto('/shop/cart');
    await expect(page.getByText("Ordering isn't available yet")).toBeVisible();
    await expect(page.locator('#checkoutForm')).toHaveCount(0);
    await expect(page.locator('#cartItems')).toHaveCount(0);
  });

  test('the checkout API rejects every request while commerce is disabled, regardless of payload', async ({
    request,
  }) => {
    const response = await request.post('/api/checkout', {
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        contact: 'discord#1234',
        payment: 'Zelle',
        items: [{ name: 'GHK-Cu', spec: '50mg', price: 120, quantity: 2 }],
        subtotal: 240,
        shipping: 0,
        total: 240,
      },
    });
    expect(response.status()).toBe(503);
    const body = (await response.json()) as { success: boolean; error?: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('not yet available');
  });

  test('product page has no detectable automated accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('cart (coming-soon) page has no detectable automated accessibility violations', async ({
    page,
  }) => {
    await page.goto('/shop/cart');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('contact form', () => {
  test('honeypot-filled submissions are silently accepted without sending', async ({ page }) => {
    await page.goto('/contact');
    await page.fill('#name', 'Bot');
    await page.fill('#email', 'bot@example.com');
    await page.fill('#message', 'spam');
    // The honeypot field is visually hidden but not disabled — fill it
    // directly to simulate a bot that ignores styling.
    await page.locator('#contactHoneypot').fill('http://spam.example');
    await page.locator('#contactForm button[type="submit"]').click();
    await expect(page.locator('#contactFormSuccess')).toBeVisible();
  });

  test('a real submission with no Resend key configured shows an honest error', async ({
    page,
  }) => {
    // Still accurate locally/in CI even though CONTACT_FORM_ENABLED is
    // now true (src/lib/launch-config.ts) and the form is genuinely
    // active on staging: .dev.vars (the local/CI Worker-runtime secrets
    // file, distinct from .env.local) has no real RESEND_API_KEY/
    // RESEND_FROM_ADDRESS/TURNSTILE_SECRET_KEY, so contact.ts's own
    // Resend+Turnstile activation check still falls through to this
    // same "not configured" response here — the launch-phase gate and
    // the credential-activation gate are two independent checks.
    await page.goto('/contact');
    await page.fill('#name', 'Jane Doe');
    await page.fill('#email', 'jane@example.com');
    await page.fill('#message', 'Hello there');
    await page.locator('#contactForm button[type="submit"]').click();
    await expect(page.locator('#contactFormMessage')).toContainText('not configured');
  });

  test('has no detectable automated accessibility violations', async ({ page }) => {
    await page.goto('/contact');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
