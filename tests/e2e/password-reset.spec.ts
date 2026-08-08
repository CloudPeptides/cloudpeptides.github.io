import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Unlike contact.ts/checkout.ts, src/pages/api/auth/forgot-password.ts
// has no "Resend not configured" fallback to hide behind — Supabase
// itself is configured everywhere (PUBLIC_SUPABASE_URL/ANON_KEY are
// non-secret build vars, present in local/CI too, unlike the Resend/
// Turnstile Worker secrets). Supabase's own mailer quota on this
// project is tight (2/hour, no custom SMTP configured) and must never
// be spent by test runs. The safe way to exercise this route for real
// without touching that quota: resetPasswordForEmail() is deliberately
// enumeration-safe — Supabase sends nothing at all for an email with no
// matching account, so every test below uses an address guaranteed not
// to correspond to a real admin user.
const NONEXISTENT_EMAIL = 'e2e-nonexistent-test-account@cloudpeptides.test';

test.describe('admin login — forgot password link', () => {
  test('the login page links to the forgot-password page', async ({ page }) => {
    await page.goto('/admin/login');
    const link = page.getByRole('link', { name: 'Forgot password?' });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/admin\/forgot-password/);
  });

  test('login page has no detectable automated accessibility violations', async ({ page }) => {
    await page.goto('/admin/login');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('forgot-password request page', () => {
  test('is reachable without a session', async ({ page }) => {
    const response = await page.goto('/admin/forgot-password');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  });

  test('rejects a malformed email server-side (dotless domain passes native type=email but fails our stricter check)', async ({
    page,
  }) => {
    await page.goto('/admin/forgot-password');
    // "a@b" satisfies the browser's native type="email" constraint (no
    // TLD required by the WHATWG spec), so the submit event actually
    // fires and reaches src/pages/api/auth/forgot-password.ts's own
    // stricter isValidEmail() check (src/lib/form-validation.ts, which
    // requires a dot in the domain) — a real server round trip, not a
    // client-only check.
    await page.fill('#email', 'a@b');
    await page.locator('#forgotPasswordForm button[type="submit"]').click();
    await expect(page.locator('#forgotFormError')).toContainText('valid email');
  });

  test('a well-formed but nonexistent email still gets the same generic success message — no account enumeration', async ({
    page,
  }) => {
    await page.goto('/admin/forgot-password');
    await page.fill('#email', NONEXISTENT_EMAIL);
    await page.locator('#forgotPasswordForm button[type="submit"]').click();
    await expect(page.locator('#forgotFormSuccess')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#forgotFormSuccess')).toContainText('If an account exists');
  });

  test('has no detectable automated accessibility violations', async ({ page }) => {
    await page.goto('/admin/forgot-password');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('reset-password completion page', () => {
  test('is reachable without a session', async ({ page }) => {
    const response = await page.goto('/admin/reset-password');
    expect(response?.status()).toBe(200);
  });

  test('a link with no token/code at all is immediately treated as invalid/expired', async ({
    page,
  }) => {
    await page.goto('/admin/reset-password');
    await expect(page.locator('#resetExpiredState')).toBeVisible();
    await expect(page.locator('#resetPasswordForm')).toBeHidden();
    await expect(page.getByRole('link', { name: 'Request a new link' })).toHaveAttribute(
      'href',
      '/admin/forgot-password',
    );
  });

  test('the token is stripped from the URL bar immediately (never lingers in history)', async ({
    page,
  }) => {
    await page.goto('/admin/reset-password#access_token=fake&refresh_token=fake&type=recovery');
    await page.waitForTimeout(300);
    expect(page.url()).not.toContain('access_token');
    expect(page.url()).not.toContain('fake');
  });

  test('client-side validation catches a too-short password before any request is sent', async ({
    page,
  }) => {
    await page.goto('/admin/reset-password#access_token=fake&refresh_token=fake&type=recovery');
    await expect(page.locator('#resetPasswordForm')).toBeVisible();
    await page.fill('#newPassword', 'short1');
    await page.fill('#confirmPassword', 'short1');
    await page.locator('#resetPasswordForm button[type="submit"]').click();
    await expect(page.locator('#resetFormError')).toContainText('at least 8 characters');
  });

  test('client-side validation catches a mismatched confirmation before any request is sent', async ({
    page,
  }) => {
    await page.goto('/admin/reset-password#access_token=fake&refresh_token=fake&type=recovery');
    await page.fill('#newPassword', 'longenough1');
    await page.fill('#confirmPassword', 'longenough2');
    await page.locator('#resetPasswordForm button[type="submit"]').click();
    await expect(page.locator('#resetFormError')).toContainText('do not match');
  });

  test('a fabricated (invalid) token pair is rejected by real Supabase verification, not faked locally', async ({
    page,
  }) => {
    // This does reach the real Supabase Auth REST API (setSession with
    // a garbage token) — safe to run repeatedly: an invalid token pair
    // is simply rejected, no email is sent, no account is touched.
    await page.goto(
      '/admin/reset-password#access_token=not-a-real-token&refresh_token=not-a-real-token&type=recovery',
    );
    await page.fill('#newPassword', 'longenough1');
    await page.fill('#confirmPassword', 'longenough1');
    await page.locator('#resetPasswordForm button[type="submit"]').click();
    await expect(page.locator('#resetExpiredState')).toBeVisible({ timeout: 15000 });
  });

  test('has no detectable automated accessibility violations', async ({ page }) => {
    await page.goto('/admin/reset-password');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('password-reset API routes — direct checks', () => {
  test('POST /api/auth/reset-password rejects a request with neither a code nor a token pair', async ({
    request,
  }) => {
    const response = await request.post('/api/auth/reset-password', {
      data: { password: 'longenough1', confirmPassword: 'longenough1' },
    });
    expect(response.status()).toBe(400);
    const body = (await response.json()) as { success: boolean; error?: string };
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/invalid or has expired/i);
  });

  test('POST /api/auth/reset-password validates password length/match before touching Supabase at all', async ({
    request,
  }) => {
    const response = await request.post('/api/auth/reset-password', {
      data: {
        accessToken: 'x',
        refreshToken: 'y',
        password: 'short',
        confirmPassword: 'short',
      },
    });
    expect(response.status()).toBe(400);
    const body = (await response.json()) as { success: boolean; error?: string };
    expect(body.error).toMatch(/at least 8 characters/i);
  });

  test('POST /api/auth/forgot-password requires same-origin', async ({ request }) => {
    const response = await request.post('/api/auth/forgot-password', {
      data: { email: NONEXISTENT_EMAIL },
      headers: { Origin: 'https://evil.example' },
    });
    expect(response.status()).toBe(403);
  });
});
