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

test.describe('product detail + cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shop/ghk-cu');
    await page.evaluate(() => localStorage.removeItem('cp-shop-cart'));
  });

  test('selecting an option updates price, and add-to-cart persists it', async ({ page }) => {
    await page.selectOption('[data-option-select]', '1'); // 100mg option
    await expect(page.locator('[data-price]')).toHaveText('$170.00');

    await page.locator('[data-add-to-cart]').click();
    await expect(page.locator('[data-add-feedback]')).toBeVisible();

    const cart = await page.evaluate(() => localStorage.getItem('cp-shop-cart'));
    expect(JSON.parse(cart ?? '[]')).toEqual([
      { productId: 'ghk-cu', optionCode: 'CU100', name: 'GHK-CU', spec: '100mg • 10 vial kit', price: 170, quantity: 1 },
    ]);
  });

  test('cart page computes totals correctly and enforces the 2-kit minimum', async ({ page }) => {
    await page.locator('[data-add-to-cart]').click(); // 1x 50mg = $120

    await page.goto('/shop/cart');
    await expect(page.getByText('$120.00', { exact: true })).toBeVisible(); // subtotal
    await expect(page.locator('#shipping')).toHaveText('$15.00'); // 1 kit, under free-shipping threshold
    await expect(page.locator('#total')).toHaveText('$135.00');

    // Below the 2-kit minimum — submitting should be rejected client-side
    // before any network call, with the cart still intact.
    await page.fill('#customerName', 'Jane Doe');
    await page.fill('#customerEmail', 'jane@example.com');
    await page.fill('#customerContact', 'discord#1234');
    await page.selectOption('#paymentMethod', 'Zelle');
    await page.locator('#checkoutForm button[type="submit"]').click();
    await expect(page.locator('#checkoutFormMessage')).toContainText('Minimum order is 2 kits');
  });

  test('increasing quantity to 3 kits gives free shipping', async ({ page }) => {
    await page.locator('[data-add-to-cart]').click();
    await page.goto('/shop/cart');
    await page.locator('[data-qty-increase="0"]').click();
    await page.locator('[data-qty-increase="0"]').click();
    await expect(page.locator('#shipping')).toHaveText('FREE');
  });

  test('empty cart shows the honest empty state, not a fake $0 order form', async ({ page }) => {
    await page.goto('/shop/cart');
    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await expect(page.locator('#checkoutForm')).toBeHidden();
  });

  test('checkout with no Resend key configured shows an honest error, never a fake success', async ({
    page,
  }) => {
    await page.locator('[data-add-to-cart]').click();
    await page.locator('[data-add-to-cart]').click(); // 2 kits, meets minimum
    await page.goto('/shop/cart');
    await page.fill('#customerName', 'Jane Doe');
    await page.fill('#customerEmail', 'jane@example.com');
    await page.fill('#customerContact', 'discord#1234');
    await page.selectOption('#paymentMethod', 'Zelle');
    await page.locator('#checkoutForm button[type="submit"]').click();
    await expect(page.locator('#checkoutFormMessage')).toContainText('not configured');
    await expect(page.locator('#successMessage')).toBeHidden();
  });

  test('product page has no detectable automated accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('cart page (populated) has no detectable automated accessibility violations', async ({
    page,
  }) => {
    await page.locator('[data-add-to-cart]').click();
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
