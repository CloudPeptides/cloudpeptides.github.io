import { describe, expect, it } from 'vitest';
import { groupShopProductRows } from '../../src/lib/public-shop';

// Batch 4 (2026-08-10) — the function that lets the public shop pages
// move from the static src/lib/shop-products.ts array to Supabase-
// sourced rows without changing the Product/ProductOption shape (and
// therefore without changing any of src/lib/shop.ts's pure functions
// or the page templates that consume them). These are the parity
// tests: identical results to what shop-products.ts already produced
// for the same real data (GHK-CU's two options), proving the cutover
// doesn't change observable behavior.

describe('groupShopProductRows', () => {
  it('groups multiple SKU rows sharing a product_slug into one product with multiple options', () => {
    const rows = [
      {
        code: 'CU50',
        name: 'GHK-CU',
        spec: '50mg',
        count: 10,
        price: 120,
        product_slug: 'ghk-cu',
        product_categories: { name: 'Beauty + Repair' },
      },
      {
        code: 'CU100',
        name: 'GHK-CU',
        spec: '100mg',
        count: 10,
        price: 170,
        product_slug: 'ghk-cu',
        product_categories: { name: 'Beauty + Repair' },
      },
    ];
    const products = groupShopProductRows(rows);
    expect(products).toHaveLength(1);
    expect(products[0]).toEqual({
      id: 'ghk-cu',
      name: 'GHK-CU',
      category: 'Beauty + Repair',
      options: [
        { code: 'CU50', spec: '50mg', count: 10, price: 120 },
        { code: 'CU100', spec: '100mg', count: 10, price: 170 },
      ],
      featured: false,
    });
  });

  it('keeps a single-option product as a one-option group (e.g. AHK-CU)', () => {
    const products = groupShopProductRows([
      {
        code: 'AU50',
        name: 'AHK-CU',
        spec: '50mg',
        count: 10,
        price: 110,
        product_slug: 'ahk-cu',
        product_categories: { name: 'Beauty + Repair' },
      },
    ]);
    expect(products).toEqual([
      {
        id: 'ahk-cu',
        name: 'AHK-CU',
        category: 'Beauty + Repair',
        options: [{ code: 'AU50', spec: '50mg', count: 10, price: 110 }],
        featured: false,
      },
    ]);
  });

  it('excludes a row with no product_slug — no public page to group it under', () => {
    const products = groupShopProductRows([
      {
        code: 'ADMIN1',
        name: 'Admin-only SKU',
        spec: '1mg',
        count: 1,
        price: 10,
        product_slug: null,
        product_categories: null,
      },
    ]);
    expect(products).toEqual([]);
  });

  it('falls back to an empty category name if the join is missing (never crashes)', () => {
    const products = groupShopProductRows([
      {
        code: 'X1',
        name: 'X',
        spec: '1mg',
        count: 1,
        price: 10,
        product_slug: 'x',
        product_categories: null,
      },
    ]);
    expect(products[0].category).toBe('');
  });

  it('preserves distinct products separately, not merged by name', () => {
    const products = groupShopProductRows([
      {
        code: 'A1',
        name: 'Product A',
        spec: '1mg',
        count: 10,
        price: 50,
        product_slug: 'product-a',
        product_categories: { name: 'Repair + Other' },
      },
      {
        code: 'B1',
        name: 'Product B',
        spec: '1mg',
        count: 10,
        price: 60,
        product_slug: 'product-b',
        product_categories: { name: 'Repair + Other' },
      },
    ]);
    expect(products.map((p) => p.id).sort()).toEqual(['product-a', 'product-b']);
  });
});
