import { describe, expect, it } from 'vitest';
import {
  buildCatalogResolver,
  isSingleLineSafe,
  isValidEmail,
  sanitizeText,
  validateCheckoutSubmission,
  validateContactSubmission,
  type CatalogEntry,
} from '../../src/lib/form-validation';
import { PRODUCTS } from '../../src/lib/shop-products';

// Batch 4 (2026-08-10): validateCheckoutSubmission no longer reads the
// static PRODUCTS array internally — it takes a resolver, built by the
// real caller (src/pages/api/checkout.ts) from a fresh Supabase query.
// These tests build that same resolver from PRODUCTS instead, so every
// assertion below still exercises the exact real prices/names/specs —
// this is deliberately what proves the refactor didn't change checkout
// behavior, not a relaxed/fake substitute for the real data.
const legacyCatalogEntries: CatalogEntry[] = PRODUCTS.flatMap((p) =>
  p.options.map((o) => ({
    productId: p.id,
    optionCode: o.code,
    name: p.name,
    spec: o.spec,
    price: o.price,
  })),
);
const resolveProduct = buildCatalogResolver(legacyCatalogEntries);

describe('sanitizeText', () => {
  it('trims and caps length', () => {
    expect(sanitizeText('  hi  ', 10)).toBe('hi');
    expect(sanitizeText('a'.repeat(300), 10)).toBe('a'.repeat(10));
  });
  it('strips control characters', () => {
    expect(sanitizeText('hi\x00there', 20)).toBe('hithere');
  });
  it('rejects non-strings', () => {
    expect(sanitizeText(42, 20)).toBe('');
    expect(sanitizeText(undefined, 20)).toBe('');
    expect(sanitizeText(null, 20)).toBe('');
  });
});

describe('isValidEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
  });
  it('rejects malformed addresses', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isSingleLineSafe (header-injection defense)', () => {
  it('rejects newlines and carriage returns', () => {
    expect(isSingleLineSafe('a\nBcc: evil@x.com')).toBe(false);
    expect(isSingleLineSafe('a\r\nBcc: evil@x.com')).toBe(false);
  });
  it('accepts normal single-line text', () => {
    expect(isSingleLineSafe('Jane Doe')).toBe(true);
  });
});

describe('validateContactSubmission', () => {
  it('accepts a well-formed submission', () => {
    const { result, data } = validateContactSubmission({
      name: 'Jane',
      email: 'jane@example.com',
      message: 'Hello there',
    });
    expect(result.valid).toBe(true);
    expect(data).toEqual({ name: 'Jane', email: 'jane@example.com', message: 'Hello there' });
  });

  it('rejects missing fields', () => {
    expect(validateContactSubmission({ name: '', email: '', message: '' }).result.valid).toBe(
      false,
    );
  });

  it('rejects an invalid email', () => {
    const { result } = validateContactSubmission({
      name: 'Jane',
      email: 'not-an-email',
      message: 'hi',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects header-injection attempts in the name field', () => {
    const { result } = validateContactSubmission({
      name: 'Jane\nBcc: evil@x.com',
      email: 'jane@example.com',
      message: 'hi',
    });
    expect(result.valid).toBe(false);
  });
});

describe('validateCheckoutSubmission', () => {
  // Real catalog ids/codes (src/lib/shop-products.ts) — the whole point
  // of this rework is that price/name/spec are looked up server-side
  // from these, never trusted from the client.
  const baseAddress = {
    line1: '123 Main St',
    line2: '',
    city: 'Springfield',
    region: 'IL',
    postalCode: '62704',
    country: 'US',
  };
  const baseSubmission = {
    name: 'Jane',
    email: 'jane@example.com',
    phone: '',
    address: baseAddress,
    notes: '',
    ageAttestation: true,
    termsAccepted: true,
  };
  const baseItems = [
    { productId: 'ghk-cu', optionCode: 'CU50', quantity: 1 }, // $120
    { productId: 'ahk-cu', optionCode: 'AU50', quantity: 1 }, // $110
  ];

  it('accepts a well-formed order meeting the 2-kit minimum', () => {
    const { result, data } = validateCheckoutSubmission(
      { ...baseSubmission, items: baseItems },
      resolveProduct,
    );
    expect(result.valid).toBe(true);
    expect(data?.subtotal).toBe(230);
    expect(data?.shipping).toBe(15);
    expect(data?.total).toBe(245);
  });

  it('looks up name/spec/price server-side from the real catalog, never trusting the client', () => {
    const { data } = validateCheckoutSubmission(
      {
        ...baseSubmission,
        items: [
          // A malicious client claiming a fabricated price for a real product.
          { productId: 'ghk-cu', optionCode: 'CU50', quantity: 1, price: 0.01, name: 'FAKE' },
          { productId: 'ahk-cu', optionCode: 'AU50', quantity: 1 },
        ],
      },
      resolveProduct,
    );
    expect(data?.items[0]).toEqual({
      productId: 'ghk-cu',
      optionCode: 'CU50',
      name: 'GHK-CU',
      spec: '50mg',
      price: 120,
      quantity: 1,
    });
    expect(data?.subtotal).toBe(230);
  });

  it('rejects an item whose product id / option code does not exist in the catalog', () => {
    const { result } = validateCheckoutSubmission(
      {
        ...baseSubmission,
        items: [
          { productId: 'ghk-cu', optionCode: 'CU50', quantity: 1 },
          { productId: 'does-not-exist', optionCode: 'X', quantity: 1 },
        ],
      },
      resolveProduct,
    );
    expect(result.valid).toBe(false);
  });

  it('rejects a real product id with a fabricated option code', () => {
    const { result } = validateCheckoutSubmission(
      {
        ...baseSubmission,
        items: [{ productId: 'ghk-cu', optionCode: 'NOT-A-REAL-CODE', quantity: 2 }],
      },
      resolveProduct,
    );
    expect(result.valid).toBe(false);
  });

  it('requires a complete shipping address', () => {
    const { result } = validateCheckoutSubmission(
      {
        ...baseSubmission,
        address: { ...baseAddress, city: '' },
        items: baseItems,
      },
      resolveProduct,
    );
    expect(result.valid).toBe(false);
  });

  it('accepts an order with no phone (optional) and no address line 2 (optional)', () => {
    const { result } = validateCheckoutSubmission(
      { ...baseSubmission, items: baseItems },
      resolveProduct,
    );
    expect(result.valid).toBe(true);
  });

  it('rejects an order without the 18+/research-use attestation', () => {
    const { result } = validateCheckoutSubmission(
      {
        ...baseSubmission,
        ageAttestation: false,
        items: baseItems,
      },
      resolveProduct,
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/18/);
  });

  it('rejects an order without Shop Terms acceptance', () => {
    const { result } = validateCheckoutSubmission(
      {
        ...baseSubmission,
        termsAccepted: false,
        items: baseItems,
      },
      resolveProduct,
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/shop terms/i);
  });

  it('rejects an order below the 2-kit minimum', () => {
    const { result } = validateCheckoutSubmission(
      {
        ...baseSubmission,
        items: [{ productId: 'ghk-cu', optionCode: 'CU50', quantity: 1 }],
      },
      resolveProduct,
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/minimum order/i);
  });

  it('gives free shipping at 3+ kits, recomputed server-side', () => {
    const { data } = validateCheckoutSubmission(
      {
        ...baseSubmission,
        items: [{ productId: 'ghk-cu', optionCode: 'CU50', quantity: 3 }],
      },
      resolveProduct,
    );
    expect(data?.shipping).toBe(0);
    expect(data?.total).toBe(360);
  });

  it('never trusts a client-supplied total (recomputes it)', () => {
    const { data } = validateCheckoutSubmission(
      {
        ...baseSubmission,
        items: baseItems,
        subtotal: 1, // attempted tampering
        shipping: 0,
        total: 1,
      },
      resolveProduct,
    );
    expect(data?.total).toBe(245);
  });

  it('never accepts a payment-method field — there is no such field in the schema at all', () => {
    const { data } = validateCheckoutSubmission(
      {
        ...baseSubmission,
        items: baseItems,
        payment: 'Bitcoin (BTC)', // if a client still sends this, it must be ignored entirely
      },
      resolveProduct,
    );
    expect(data).not.toHaveProperty('payment');
  });

  it('rejects malformed cart items', () => {
    const { result } = validateCheckoutSubmission(
      {
        ...baseSubmission,
        items: [{ productId: 'ghk-cu', optionCode: 'CU50', quantity: -1 }],
      },
      resolveProduct,
    );
    expect(result.valid).toBe(false);
  });

  it('rejects an empty cart', () => {
    const { result } = validateCheckoutSubmission({ ...baseSubmission, items: [] }, resolveProduct);
    expect(result.valid).toBe(false);
  });

  it('produces identical results against a Supabase-shaped resolver as against the legacy static catalog (parity proof for the Batch 4 cutover)', () => {
    // Mirrors exactly what src/lib/public-shop.ts's
    // listCheckoutCatalogEntries() produces from the real migrated
    // shop_products rows: productId = product_slug, optionCode = code.
    const supabaseShapedResolver = buildCatalogResolver([
      { productId: 'ghk-cu', optionCode: 'CU50', name: 'GHK-CU', spec: '50mg', price: 120 },
      { productId: 'ahk-cu', optionCode: 'AU50', name: 'AHK-CU', spec: '50mg', price: 110 },
    ]);
    const { result, data } = validateCheckoutSubmission(
      { ...baseSubmission, items: baseItems },
      supabaseShapedResolver,
    );
    expect(result.valid).toBe(true);
    expect(data?.subtotal).toBe(230);
    expect(data?.total).toBe(245);
  });
});
