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

  // /admin/login is intentionally NOT wrapped in AdminLayout (it must
  // stay reachable when no session/no admin exists yet, and AdminLayout
  // itself redirects to /admin/login when unauthenticated — using it
  // there would be a redirect loop, see AdminLayout.astro's own guard).
  // It therefore correctly does NOT carry the `pwa` head tags — those
  // only appear once an admin actually lands on an authenticated
  // AdminLayout page, which is also the realistic point in the flow
  // where "Add to Home Screen" happens. No e2e coverage of an
  // authenticated admin page's own head tags here, matching this
  // repo's established pattern of not faking staff sessions in e2e
  // (see product-wizard.spec.ts's own comment).

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

test.describe('Research/shop separation holds for the 2026-08-19 batch', () => {
  test('a newly-imported draft compound (GHRP-2) is not publicly visible yet', async ({ page }) => {
    // Every profile imported by scripts/research/import-batch-*.mjs is
    // inserted as status='draft' — never auto-published (CLAUDE.md's
    // draft -> in_review -> published workflow). The public directory
    // and profile route both only ever show published rows, so this
    // compound must be invisible on the public site until a human
    // editor actually publishes it.
    const res = await page.goto('/research/compounds/ghrp-2');
    expect(res?.status()).toBe(404);

    await page.goto('/research/compounds');
    await expect(page.getByText('GHRP-2', { exact: false })).toHaveCount(0);
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
