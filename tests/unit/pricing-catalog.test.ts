import { describe, expect, it } from 'vitest';
import {
  isTenVialKit,
  PRICING_CATALOG_CATEGORIES,
  validatePrice,
} from '../../src/lib/admin/pricing-catalog';

// The DB-backed functions (listPricingCatalog, getPricingCatalogEntry,
// updatePricingCatalogPrice) are exercised against the real, live
// Supabase project — same convention as every other Supabase-touching
// module in this codebase (e.g. src/lib/coas.ts) — via
// scripts/migration/verify-pricing-catalog-editing.mjs, not mocked
// here. Only the pure validation/formatting logic is unit-tested.

describe('validatePrice', () => {
  it('accepts a whole-dollar amount', () => {
    const result = validatePrice('120');
    expect(result.valid).toBe(true);
    expect(result.value).toBe(120);
  });

  it('accepts an amount with one or two decimal places', () => {
    expect(validatePrice('99.5').valid).toBe(true);
    expect(validatePrice('99.50').valid).toBe(true);
    expect(validatePrice('99.99').valid).toBe(true);
  });

  it('accepts a numeric input, not just strings', () => {
    const result = validatePrice(77);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(77);
  });

  it('rejects more than two decimal places', () => {
    const result = validatePrice('99.999');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/two decimal places/i);
  });

  it('rejects zero and negative amounts', () => {
    expect(validatePrice('0').valid).toBe(false);
    expect(validatePrice('0.00').valid).toBe(false);
    expect(validatePrice('-5').valid).toBe(false);
  });

  it('rejects non-numeric input', () => {
    expect(validatePrice('abc').valid).toBe(false);
    expect(validatePrice('$50').valid).toBe(false);
    expect(validatePrice('50,00').valid).toBe(false);
  });

  it('rejects empty/missing input', () => {
    expect(validatePrice('').valid).toBe(false);
    expect(validatePrice('   ').valid).toBe(false);
    expect(validatePrice(undefined).valid).toBe(false);
    expect(validatePrice(null).valid).toBe(false);
  });

  it('rejects an unreasonably large amount', () => {
    expect(validatePrice('9999999').valid).toBe(false);
  });

  it('tolerates surrounding whitespace', () => {
    expect(validatePrice('  120.00  ').valid).toBe(true);
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
