import { describe, expect, it } from 'vitest';
import { LEGACY_PATH_REDIRECTS, resolveLegacyRedirect } from '../../src/lib/legacy-redirects';

describe('resolveLegacyRedirect', () => {
  it('redirects a legacy compound page to its research profile', () => {
    expect(resolveLegacyRedirect('/bpc-157.html', new URLSearchParams())).toBe(
      '/research/compounds/bpc-157',
    );
  });

  it('redirects every one of the 56 documented compound/stack pages', () => {
    const compoundEntries = Object.entries(LEGACY_PATH_REDIRECTS).filter(([, target]) =>
      target.startsWith('/research/compounds/'),
    );
    expect(compoundEntries.length).toBe(56);
    for (const [legacyPath, target] of compoundEntries) {
      expect(resolveLegacyRedirect(legacyPath, new URLSearchParams())).toBe(target);
    }
  });

  it('redirects the legacy shop/cart/contact/home pages', () => {
    expect(resolveLegacyRedirect('/shop.html', new URLSearchParams())).toBe('/shop');
    expect(resolveLegacyRedirect('/cart.html', new URLSearchParams())).toBe('/shop/cart');
    expect(resolveLegacyRedirect('/contact.html', new URLSearchParams())).toBe('/contact');
    expect(resolveLegacyRedirect('/index.html', new URLSearchParams())).toBe('/');
  });

  it('redirects /product.html?id=X to /shop/X', () => {
    const params = new URLSearchParams('id=ghk-cu');
    expect(resolveLegacyRedirect('/product.html', params)).toBe('/shop/ghk-cu');
  });

  it('does not redirect /product.html with no id', () => {
    expect(resolveLegacyRedirect('/product.html', new URLSearchParams())).toBeNull();
  });

  it('does not redirect a "not yet migrated" legacy page (no rebuilt equivalent exists)', () => {
    expect(resolveLegacyRedirect('/about.html', new URLSearchParams())).toBeNull();
    expect(resolveLegacyRedirect('/faq.html', new URLSearchParams())).toBeNull();
  });

  it('does not redirect an ordinary new-site path', () => {
    expect(resolveLegacyRedirect('/research/compounds', new URLSearchParams())).toBeNull();
    expect(resolveLegacyRedirect('/admin', new URLSearchParams())).toBeNull();
  });
});
