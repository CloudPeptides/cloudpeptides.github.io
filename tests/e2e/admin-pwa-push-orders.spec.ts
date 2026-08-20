import { expect, test } from '@playwright/test';

// Focused coverage for the 2026-08-19 batch: admin PWA installability,
// push-notification admin surface, and order-request persistence/admin
// surface. Full authenticated-content coverage for the admin pages
// themselves isn't exercised here, matching this repo's established
// pattern for other admin-only pages (see product-wizard.spec.ts,
// pricing-catalog.spec.ts) — these assert the auth boundary and the
// PWA-shell files' own public reachability/content, not full CRUD.

test.describe('Admin PWA shell', () => {
  test('manifest.webmanifest is reachable without a session and is valid', async ({ request }) => {
    const res = await request.get('/admin/manifest.webmanifest');
    expect(res.status()).toBe(200);
    const manifest = await res.json();
    expect(manifest.name).toBe('CloudPeptides Admin');
    expect(manifest.start_url).toBe('/admin');
    expect(manifest.scope).toBe('/admin/');
    expect(manifest.display).toBe('standalone');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('sw.js is reachable without a session and is real JavaScript, not HTML', async ({
    request,
  }) => {
    const res = await request.get('/admin/sw.js');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("addEventListener('install'");
    expect(body).toContain("addEventListener('push'");
    // The whole point of this service worker: its actual caching logic
    // must never touch anything beyond the fixed app-shell asset list —
    // checked directly against that list, not the whole file text
    // (whose comments legitimately discuss /api/* paths in prose).
    const assetsMatch = body.match(/APP_SHELL_ASSETS\s*=\s*\[([^\]]*)\]/);
    expect(assetsMatch).not.toBeNull();
    // Pulled out as individual quoted strings rather than JSON.parse —
    // the array literal is real JS (single-quoted, trailing comma
    // allowed), not JSON.
    const assets = [...assetsMatch![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(assets.length).toBeGreaterThan(0);
    for (const asset of assets) {
      expect(asset).not.toMatch(/\/api\//);
      expect(asset).not.toMatch(/^\/admin\/(?!manifest)/); // no admin page, only the manifest itself
    }
  });

  // Real bug, found live (2026-08-19): a user's very first touch point
  // with the admin realm is /admin/login — not an authenticated
  // AdminLayout page — and iOS reads the manifest/apple-touch-icon tags
  // from whichever page is on screen the moment "Add to Home Screen" is
  // tapped, with no fallback to any other page. /admin/login (and
  // forgot-password/reset-password, its own two unauthenticated
  // siblings) is intentionally NOT wrapped in AdminLayout (which would
  // redirect-loop on an unauthenticated visit — see AdminLayout.astro's
  // own guard), so it was missing `pwa` entirely, and "Add to Home
  // Screen" from the login screen produced iOS's generic-letter
  // fallback icon instead of the real brand mark. Fixed by passing
  // `pwa` directly to BaseLayout on all three of those pages (independent
  // of AdminLayout/session — the prop only adds head tags, it doesn't
  // gate anything) — asserted here on the one that's reachable without a
  // session at all in this test.
  for (const path of ['/admin/login', '/admin/forgot-password']) {
    test(`${path} declares the manifest link and Apple PWA meta tags (reachable pre-login)`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
        'href',
        '/admin/manifest.webmanifest',
      );
      await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute(
        'content',
        'yes',
      );
      await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
        'href',
        '/brand/apple-touch-icon.png',
      );
    });
  }

  test('the public/researcher-facing site does NOT declare the admin manifest', async ({
    page,
  }) => {
    await page.goto('/login');
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
  });
});

test.describe('Push-notification admin routes', () => {
  test('/admin/notifications requires admin authentication', async ({ page }) => {
    await page.goto('/admin/notifications');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test.describe('genuinely unauthenticated (no session at all)', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('push subscribe/unsubscribe/test all reject an unauthenticated caller', async ({
      request,
    }) => {
      // `data: {}` on every call, even though these two routes read no
      // body — omitting it leaves the request with no Content-Type at
      // all, which the Cloudflare Workers runtime itself rejects as a
      // "cross-site form submission" before this app's own middleware
      // ever runs (found live while diagnosing this test, not assumed).
      const subscribeRes = await request.post('/api/admin/push/subscribe', { data: {} });
      expect(subscribeRes.status()).toBe(401);
      const unsubscribeRes = await request.post('/api/admin/push/unsubscribe', { data: {} });
      expect(unsubscribeRes.status()).toBe(401);
      const testRes = await request.post('/api/admin/push/test', { data: {} });
      expect(testRes.status()).toBe(401);
    });
  });

  test('is not linked from any public page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/admin/notifications"]')).toHaveCount(0);
  });
});

test.describe('Order-request persistence + admin surface', () => {
  test('/admin/order-requests requires admin authentication', async ({ page }) => {
    await page.goto('/admin/order-requests');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('/admin/order-requests/<id> requires admin authentication', async ({ page }) => {
    await page.goto('/admin/order-requests/00000000-0000-0000-0000-000000000000');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test.describe('genuinely unauthenticated (no session at all)', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('the order-request status-change API rejects an unauthenticated caller', async ({
      request,
    }) => {
      const res = await request.post(
        '/api/admin/order-requests/00000000-0000-0000-0000-000000000000/status',
        { data: { status: 'reviewing' } },
      );
      expect(res.status()).toBe(401);
    });
  });

  test('is not linked from any public page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/admin/order-requests"]')).toHaveCount(0);
    await page.goto('/shop');
    await expect(page.locator('a[href="/admin/order-requests"]')).toHaveCount(0);
  });
});

test.describe('Contact-submission persistence + admin surface (2026-08-20 — email notification retired in favor of dashboard + push)', () => {
  test('/admin/contact-submissions requires admin authentication', async ({ page }) => {
    await page.goto('/admin/contact-submissions');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('/admin/contact-submissions/<id> requires admin authentication', async ({ page }) => {
    await page.goto('/admin/contact-submissions/00000000-0000-0000-0000-000000000000');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test.describe('genuinely unauthenticated (no session at all)', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('the public contact form page itself requires a signed-in session', async ({ page }) => {
      await page.goto('/contact');
      await expect(page).toHaveURL(/\/login/);
    });

    test('the contact-submission POST route rejects an unauthenticated caller', async ({
      request,
    }) => {
      const res = await request.post('/api/contact', {
        data: { name: 'Test', email: 'test@example.com', message: 'hi' },
      });
      expect(res.status()).toBe(401);
    });

    test('the admin reply API rejects an unauthenticated caller', async ({ request }) => {
      const res = await request.post(
        '/api/admin/contact-submissions/00000000-0000-0000-0000-000000000000/reply',
        { data: { body: 'reply' } },
      );
      expect(res.status()).toBe(401);
    });
  });

  test('is not linked from any public page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/admin/contact-submissions"]')).toHaveCount(0);
    await page.goto('/contact');
    await expect(page.locator('a[href="/admin/contact-submissions"]')).toHaveCount(0);
  });
});

test.describe('Research/shop separation holds for the 2026-08-19 batch', () => {
  // Every profile imported by scripts/research/import-batch-*.mjs was
  // originally inserted as status='draft' (CLAUDE.md's draft ->
  // in_review -> published workflow — nothing auto-published). The user
  // explicitly reviewed and approved publishing the full batch
  // afterward (scripts/research/publish-batch.mjs, which re-verifies
  // src/lib/admin/validation.ts's checkPublishReadiness — every claim
  // cited, every regulatory record sourced — before writing anything).
  // This test now asserts the batch is genuinely live for a signed-in
  // researcher, not just that it once correctly stayed hidden.
  test('a published batch compound (GHRP-2) is publicly visible with real content', async ({
    page,
  }) => {
    const res = await page.goto('/research/compounds/ghrp-2');
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'GHRP-2', exact: false }).first()).toBeVisible();
    // Claim-level citations render, not just the compound shell — the
    // whole point of also publishing every claim, not just the
    // compound row (CompoundProfileBody.astro filters claims by their
    // own status independently of the compound's).
    await expect(page.getByText('World Anti-Doping Agency', { exact: false })).toBeVisible();

    // Same client-side-search pattern compounds.spec.ts's own directory
    // tests already use ([data-compound-item] + the search box toggling
    // a `hidden` attribute) — a raw text/href locator matched multiple
    // DOM nodes for reasons unrelated to this test's actual point.
    await page.goto('/research/compounds');
    await page.locator('[data-compound-search]').fill('GHRP-2');
    await expect(page.locator('[data-compound-item]:not([hidden])')).toHaveCount(1);
  });

  test('CP-S1/CP-T2/CP-R3 shop products still carry no link to the separate research profiles', async ({
    page,
  }) => {
    await page.goto('/shop');
    for (const code of ['cp-s1', 'cp-t2', 'cp-r3']) {
      await expect(page.locator(`a[href="/research/compounds/${code}"]`)).toHaveCount(0);
    }
  });
});
