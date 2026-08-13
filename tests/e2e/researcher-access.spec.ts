import { expect, test } from '@playwright/test';

// Uses the default authenticated researcher storageState from
// playwright.config.ts (a real, already-certified test account signed
// in via /api/account/login during global setup) — these tests confirm
// a genuine researcher account reaches exactly what it should.

test('a signed-in researcher reaches the homepage, research directory, and shop', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.goto('/research/compounds');
  await expect(page).toHaveURL('/research/compounds');

  await page.goto('/shop');
  await expect(page).toHaveURL('/shop');
});

test('signing out returns to the login gate on the next protected request', async ({ browser }) => {
  // Deliberately NOT the shared default storageState fixture: every
  // other spec file's context is seeded from the SAME underlying
  // Supabase session (one real account, one access/refresh token pair,
  // captured once in global-setup.ts) — calling the real sign-out route
  // against that shared session revokes it server-side (Supabase's
  // signOut() invalidates the session, not just the local cookie),
  // which would then fail every other in-flight test still relying on
  // that same session. Found live: this exact test caused a cluster of
  // unrelated failures across other spec files before this fix. A
  // fresh, independent login here keeps the sign-out under test fully
  // isolated to its own session.
  const context = await browser.newContext();
  const page = await context.newPage();
  const loginResponse = await context.request.post('/api/account/login', {
    data: {
      email: 'e2e-researcher-test@cloudpeptides.invalid',
      password: 'E2eResearcherTestAccount!2026',
    },
  });
  expect(loginResponse.ok()).toBe(true);

  await page.goto('/');
  await expect(page).toHaveURL('/');

  await page.getByRole('button', { name: 'Sign out' }).first().click();
  await page.waitForURL('/login');
  await page.goto('/');
  await expect(page).toHaveURL(/\/login\?next=/);

  await context.close();
});
