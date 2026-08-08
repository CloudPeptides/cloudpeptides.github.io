import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const POLICY_PAGES: { path: string; heading: string }[] = [
  { path: '/privacy', heading: 'Privacy Policy' },
  { path: '/terms', heading: 'Terms of Use' },
  { path: '/disclaimer', heading: 'Research and Medical Disclaimer' },
  { path: '/accessibility', heading: 'Accessibility Statement' },
  { path: '/shipping', heading: 'Shipping Policy' },
  { path: '/returns', heading: 'Return and Refund Policy' },
  { path: '/shop-terms', heading: 'Shop Terms' },
];

for (const { path, heading } of POLICY_PAGES) {
  test(`${path} renders with an H1 and no detectable accessibility violations`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('footer links to every policy page from the homepage', async ({ page }) => {
  await page.goto('/');
  const footerNav = page.locator('nav[aria-label="Policies"]');
  await expect(footerNav).toBeVisible();
  for (const { path } of POLICY_PAGES) {
    await expect(footerNav.locator(`a[href="${path}"]`)).toBeVisible();
  }
});

test('/about renders with an H1, links to /about from nav and footer, and has no detectable accessibility violations', async ({
  page,
}) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('About Cloud Peptides');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.goto('/');
  await expect(page.getByRole('link', { name: 'About', exact: true }).first()).toHaveAttribute(
    'href',
    '/about',
  );
  const siteNav = page.locator('nav[aria-label="Site"]');
  await expect(siteNav.locator('a[href="/about"]')).toBeVisible();
});

test('a genuinely nonexistent path 404s with the branded not-found page', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist-anywhere');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("We couldn't find that page");
});

test('404 page has no detectable automated accessibility violations', async ({ page }) => {
  await page.goto('/this-page-does-not-exist-anywhere');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

function locationPathname(response: { headers(): Record<string, string> }): string {
  const location = response.headers()['location'];
  return new URL(location, 'http://localhost').pathname;
}

test.describe('legacy URL redirects', () => {
  test('a legacy compound page 301s to its research profile', async ({ request }) => {
    const response = await request.get('/bpc-157.html', { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(locationPathname(response)).toBe('/research/compounds/bpc-157');
  });

  test('a legacy product query-string URL 301s to /shop/<id>', async ({ request }) => {
    const response = await request.get('/product.html?id=ghk-cu', { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(locationPathname(response)).toBe('/shop/ghk-cu');
  });

  test('legacy shop/cart/contact/home pages 301 correctly', async ({ request }) => {
    const cases: [string, string][] = [
      ['/shop.html', '/shop'],
      ['/cart.html', '/shop/cart'],
      ['/contact.html', '/contact'],
      ['/index.html', '/'],
    ];
    for (const [from, to] of cases) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status(), `${from} should 301`).toBe(301);
      expect(locationPathname(response), `${from} -> ${to}`).toBe(to);
    }
  });

  test('a "not yet migrated" legacy page does not redirect (no rebuilt equivalent exists)', async ({
    request,
  }) => {
    const response = await request.get('/faq.html', { maxRedirects: 0 });
    expect(response.status()).not.toBe(301);
  });

  test('/about.html redirects to the new /about page', async ({ request }) => {
    const response = await request.get('/about.html', { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(locationPathname(response)).toBe('/about');
  });
});
