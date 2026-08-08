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

// Commerce Activation phase (2026-08-08): COMMERCE_ENABLED is now true
// (src/lib/launch-config.ts) — this is an order-*request* workflow,
// not payment processing (no payment-method field exists anywhere in
// the form). src/pages/api/checkout.ts's own Resend+Turnstile
// activation gate still falls through to an honest "not configured"
// response in local/CI, since .dev.vars has no real secrets — same
// established pattern as the contact-form tests below, which is why a
// full successful submission (through Turnstile) isn't exercised here
// either; src/lib/form-validation.ts's own unit tests already cover
// the server-side price-recomputation/validation logic exhaustively.
test.describe('product detail + cart (commerce enabled)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shop/ghk-cu');
    await page.evaluate(() => localStorage.removeItem('cp-shop-cart'));
  });

  test('the option selector updates the displayed price', async ({ page }) => {
    await page.selectOption('[data-option-select]', '1'); // 100mg option
    await expect(page.locator('[data-price]')).toHaveText('$170.00');
  });

  test('Add to Cart is enabled and adds a real item to the cart', async ({ page }) => {
    const button = page.locator('[data-add-to-cart]');
    await expect(button).toBeEnabled();
    await expect(button).toHaveText('Add To Cart');
    await button.click();
    await expect(page.locator('[data-add-feedback]')).toBeVisible();
    const cart = await page.evaluate(() => localStorage.getItem('cp-shop-cart'));
    expect(cart).not.toBeNull();
    expect(JSON.parse(cart as string)).toHaveLength(1);
  });

  test('cart page renders the real order-request form with no payment-method field anywhere', async ({
    page,
  }) => {
    await page.locator('[data-add-to-cart]').click();
    await page.goto('/shop/cart');
    await expect(page.locator('#checkoutForm')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit order request' })).toBeVisible();
    // The approved product decision: no payment-method field exists.
    await expect(page.locator('#paymentMethod')).toHaveCount(0);
    await expect(page.getByText('Preferred Payment')).toHaveCount(0);
    // Required order-request fields are present.
    await expect(page.locator('#customerName')).toBeVisible();
    await expect(page.locator('#customerEmail')).toBeVisible();
    await expect(page.locator('#customerPhone')).toBeVisible(); // optional
    await expect(page.locator('#addressLine1')).toBeVisible();
    await expect(page.locator('#ageAttestation')).toBeVisible();
    await expect(page.locator('#termsAccepted')).toBeVisible();
    await expect(
      page.getByText('it is not an accepted order or a completed purchase'),
    ).toBeVisible();
  });

  test('this staging deployment visibly labels the order form as a test environment', async ({
    page,
  }) => {
    await page.goto('/shop/cart');
    await expect(page.getByText('Test environment.')).toBeVisible();
  });

  test('a submission with no Resend key configured shows an honest error, never a fake success', async ({
    page,
  }) => {
    // Two kits — meets the client-side minimum-order check (src/lib/
    // shop.ts's meetsMinimumOrder) so the submit handler actually
    // reaches the server instead of stopping at that check first.
    await page.locator('[data-add-to-cart]').click();
    await page.locator('[data-add-to-cart]').click();
    await page.goto('/shop/cart');
    await page.fill('#customerName', 'Jane Doe');
    await page.fill('#customerEmail', 'jane@example.com');
    await page.fill('#addressLine1', '123 Main St');
    await page.fill('#addressCity', 'Springfield');
    await page.fill('#addressRegion', 'IL');
    await page.fill('#addressPostalCode', '62704');
    await page.fill('#addressCountry', 'US');
    await page.check('#ageAttestation');
    await page.check('#termsAccepted');
    await page.locator('#checkoutForm button[type="submit"]').click();
    await expect(page.locator('#checkoutFormMessage')).toContainText('not configured');
  });

  test('the checkout API requires the 18+/research-use attestation and Shop Terms acceptance', async ({
    request,
  }) => {
    // Still reaches the honest "not configured" 503 (same reasoning as
    // above) since .dev.vars has no real secrets in this environment —
    // this only confirms the route is live and gated, not a payment
    // flow. Field-level validation (missing attestation, etc.) is
    // covered exhaustively by tests/unit/form-validation.test.ts.
    const response = await request.post('/api/checkout', {
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        address: {
          line1: '123 Main St',
          line2: '',
          city: 'Springfield',
          region: 'IL',
          postalCode: '62704',
          country: 'US',
        },
        ageAttestation: true,
        termsAccepted: true,
        items: [{ productId: 'ghk-cu', optionCode: 'CU50', quantity: 2 }],
      },
    });
    expect(response.status()).toBe(503);
    const body = (await response.json()) as { success: boolean; error?: string };
    expect(body.success).toBe(false);
    expect(body.error).toContain('not configured');
  });

  test('product page has no detectable automated accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('cart page has no detectable automated accessibility violations', async ({ page }) => {
    await page.locator('[data-add-to-cart]').click();
    await page.goto('/shop/cart');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('COA gallery', () => {
  test('the public gallery page loads and links from nav/footer', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/coas"]').first()).toBeVisible();
    await page.goto('/coas');
    await expect(page.getByRole('heading', { name: 'Certificates of Analysis' })).toBeVisible();
    await expect(page.getByText('not scientific evidence')).toBeVisible();
  });

  test('has no detectable automated accessibility violations', async ({ page }) => {
    await page.goto('/coas');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('/admin/coas requires authentication, same as every other admin route', async ({ page }) => {
    await page.goto('/admin/coas');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('unauthenticated writes to the COA admin API are rejected', async ({ request }) => {
    // Middleware's baseline contributor+ gate runs before this route
    // ever parses a body — an empty/malformed body is fine here, the
    // point is proving the request never gets that far unauthenticated.
    const response = await request.post('/api/admin/coas', { data: {} });
    expect(response.status()).toBe(401);
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
