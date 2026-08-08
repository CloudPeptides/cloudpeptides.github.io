import { describe, expect, it } from 'vitest';
import {
  calculateCartTotals,
  filterProducts,
  formatMoney,
  lowestPriceOption,
  meetsMinimumOrder,
  MINIMUM_ORDER_KITS,
  SHIPPING_COST,
  type CartItem,
} from '../../src/lib/shop';
import { PRODUCTS } from '../../src/lib/shop-products';

describe('shop product catalog', () => {
  it('has 47 products ported from the legacy site', () => {
    expect(PRODUCTS.length).toBe(47);
  });

  it('every product has at least one option with a positive price', () => {
    for (const p of PRODUCTS) {
      expect(p.options.length).toBeGreaterThan(0);
      for (const o of p.options) expect(o.price).toBeGreaterThan(0);
    }
  });
});

describe('formatMoney', () => {
  it('formats to two decimal places with a dollar sign', () => {
    expect(formatMoney(120)).toBe('$120.00');
    expect(formatMoney(15)).toBe('$15.00');
    expect(formatMoney(0)).toBe('$0.00');
  });
});

describe('lowestPriceOption', () => {
  it('picks the cheapest option on GHK-CU', () => {
    const ghk = PRODUCTS.find((p) => p.id === 'ghk-cu')!;
    expect(lowestPriceOption(ghk).price).toBe(120);
  });
});

describe('filterProducts', () => {
  it('matches by category', () => {
    const results = filterProducts(PRODUCTS, { category: 'Beauty + Repair', search: '' });
    expect(results.length).toBe(13);
    expect(results.every((p) => p.category === 'Beauty + Repair')).toBe(true);
  });

  it('"all" and empty string both mean no category filter', () => {
    expect(filterProducts(PRODUCTS, { category: 'all', search: '' }).length).toBe(47);
    expect(filterProducts(PRODUCTS, { category: '', search: '' }).length).toBe(47);
  });

  it('matches by product name, case-insensitively', () => {
    const results = filterProducts(PRODUCTS, { category: '', search: 'ghk' });
    expect(results.map((p) => p.id)).toEqual(['ghk-cu']);
  });

  it('matches by option code', () => {
    const results = filterProducts(PRODUCTS, { category: '', search: 'cu100' });
    expect(results.map((p) => p.id)).toEqual(['ghk-cu']);
  });

  it('combines category and search (AND)', () => {
    const results = filterProducts(PRODUCTS, { category: 'Repair + Other', search: 'ghk' });
    expect(results).toEqual([]);
  });
});

describe('calculateCartTotals — exact legacy business rules', () => {
  const item = (price: number, quantity: number): CartItem => ({
    productId: 'x',
    optionCode: 'X1',
    name: 'X',
    spec: '1mg',
    price,
    quantity,
  });

  it('1 kit: $15 flat shipping', () => {
    const totals = calculateCartTotals([item(120, 1)]);
    expect(totals).toEqual({ subtotal: 120, shipping: 15, total: 135, kitCount: 1 });
  });

  it('2 kits: still $15 shipping (matches the minimum-order threshold, not the free-shipping one)', () => {
    const totals = calculateCartTotals([item(120, 2)]);
    expect(totals.shipping).toBe(15);
    expect(totals.kitCount).toBe(2);
  });

  it('3 kits: free shipping', () => {
    const totals = calculateCartTotals([item(100, 3)]);
    expect(totals).toEqual({ subtotal: 300, shipping: 0, total: 300, kitCount: 3 });
  });

  it('multiple line items sum subtotal and kit count together', () => {
    const totals = calculateCartTotals([item(120, 1), item(170, 2)]);
    expect(totals.subtotal).toBe(120 + 170 * 2);
    expect(totals.kitCount).toBe(3);
    expect(totals.shipping).toBe(0);
  });

  it('empty cart totals everything to zero', () => {
    expect(calculateCartTotals([])).toEqual({ subtotal: 0, shipping: 0, total: 0, kitCount: 0 });
  });
});

describe('meetsMinimumOrder', () => {
  it('requires at least 2 kits (MINIMUM_ORDER_KITS)', () => {
    expect(MINIMUM_ORDER_KITS).toBe(2);
    expect(meetsMinimumOrder(calculateCartTotals([item(120, 1)]))).toBe(false);
    expect(meetsMinimumOrder(calculateCartTotals([item(120, 2)]))).toBe(true);
  });

  function item(price: number, quantity: number): CartItem {
    return { productId: 'x', optionCode: 'X1', name: 'X', spec: '1mg', price, quantity };
  }
});

describe('SHIPPING_COST constant matches legacy', () => {
  it('is $15', () => {
    expect(SHIPPING_COST).toBe(15);
  });
});
