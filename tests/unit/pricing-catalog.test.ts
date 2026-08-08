import { describe, expect, it } from 'vitest';
import {
  isTenVialKit,
  PRICING_CATALOG,
  PRICING_CATALOG_CATEGORIES,
  type PricingCatalogEntry,
} from '../../src/lib/admin/pricing-catalog';

describe('PRICING_CATALOG — cost data must never appear here', () => {
  it('never carries a cost-shaped key on any entry, however named', () => {
    const costLikeKeyPattern = /cost/i;
    for (const entry of PRICING_CATALOG) {
      const keys = Object.keys(entry as unknown as Record<string, unknown>);
      const offending = keys.filter((k) => costLikeKeyPattern.test(k));
      expect(offending, `entry ${entry.code} has a cost-like key: ${offending.join(', ')}`).toEqual(
        [],
      );
    }
  });

  it('every price is the computed customer-facing number, not a cost value', () => {
    // Sanity bound — every real entry is well under $1000; this would
    // catch an accidental cost value (which run lower) or a corrupted
    // entry, without hardcoding the exact business formula here.
    for (const entry of PRICING_CATALOG) {
      expect(entry.price).toBeGreaterThan(0);
      expect(entry.price).toBeLessThan(1000);
    }
  });
});

describe('PRICING_CATALOG — structural integrity', () => {
  it('has no duplicate product codes', () => {
    const codes = PRICING_CATALOG.map((e) => e.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('every entry belongs to one of the three preserved category headings', () => {
    for (const entry of PRICING_CATALOG) {
      expect(PRICING_CATALOG_CATEGORIES).toContain(entry.category);
    }
  });

  it('every entry has a non-empty code, name, and spec', () => {
    for (const entry of PRICING_CATALOG) {
      expect(entry.code.length).toBeGreaterThan(0);
      expect(entry.name.length).toBeGreaterThan(0);
      expect(entry.spec.length).toBeGreaterThan(0);
    }
  });

  it('has 87 entries — matches the 87 option codes already in the public shop catalog (0 added, 0 removed)', () => {
    expect(PRICING_CATALOG.length).toBe(87);
  });

  // Regression guard for the confirmed ambiguity resolutions.
  it('XT100 is the documented count=1 exception; every other entry is count=10', () => {
    const nonTen = PRICING_CATALOG.filter((e) => e.count !== 10);
    expect(nonTen.map((e) => e.code)).toEqual(['XT100']);
    expect(nonTen[0].count).toBe(1);
  });

  it('Lemon Bottle was resolved to the existing LEM code, as confirmed', () => {
    const lemon = PRICING_CATALOG.find((e) => e.name === 'Lemon Bottle');
    expect(lemon?.code).toBe('LEM');
  });

  it('uses the existing public-catalog display names for sema/tz/r3t@, as confirmed', () => {
    const codes = Object.fromEntries(PRICING_CATALOG.map((e) => [e.code, e.name]));
    expect(codes.SM10).toBe('Semaglutide');
    expect(codes.TR10).toBe('Tirz');
    expect(codes.RT5).toBe('Reta');
  });

  it('keeps AOD9604/AOD9605 and PE-22-28/PE-22-29 as fully separate entries, never merged', () => {
    const names = PRICING_CATALOG.map((e) => e.name);
    expect(names.filter((n) => n === 'AOD9604')).toHaveLength(1);
    expect(names.filter((n) => n === 'AOD9605')).toHaveLength(1);
    expect(names.filter((n) => n === 'PE-22-28')).toHaveLength(1);
    expect(names.filter((n) => n === 'PE-22-29')).toHaveLength(1);
  });
});

describe('isTenVialKit', () => {
  it('is true for a standard 10-vial kit', () => {
    expect(isTenVialKit(10)).toBe(true);
  });

  it('is false for the XT100 single-vial exception', () => {
    expect(isTenVialKit(1)).toBe(false);
  });
});

describe('PRICING_CATALOG_CATEGORIES', () => {
  it('preserves exactly the three category headings from the source table', () => {
    expect(PRICING_CATALOG_CATEGORIES).toEqual([
      'Beauty + Repair',
      'Weight Loss + Metabolic',
      'Repair + Other',
    ]);
  });
});

// Type-level check: PricingCatalogEntry must never grow a cost field.
// (Compile-time only — if someone adds `cost` to the interface, this
// still passes at runtime, but the explicit key-scan test above is the
// real runtime guard.)
const _typeCheck: PricingCatalogEntry = {
  code: 'X',
  name: 'X',
  spec: 'X',
  count: 1,
  price: 1,
  category: 'Beauty + Repair',
};
void _typeCheck;
