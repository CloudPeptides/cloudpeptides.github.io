import { describe, expect, it } from 'vitest';
import {
  ENTITY_KINDS,
  INTERNAL_STATUSES,
  PUBLIC_STATUSES,
  validateCount,
  validatePrice,
  validateProductCode,
  validateSlug,
} from '../../src/lib/admin/products';

// The DB-backed functions (createProductWithResearch,
// findPossibleDuplicateCompounds, listShopProducts, etc.) are exercised
// against the real, live Supabase project via
// scripts/migration/verify-product-wizard.mjs, matching this
// codebase's established convention — not mocked here.

describe('validateSlug', () => {
  it('accepts a well-formed slug', () => {
    expect(validateSlug('ghk-cu').valid).toBe(true);
  });
  it('rejects uppercase, spaces, and underscores', () => {
    expect(validateSlug('GHK-Cu').valid).toBe(false);
    expect(validateSlug('ghk cu').valid).toBe(false);
    expect(validateSlug('ghk_cu').valid).toBe(false);
  });
  it('rejects leading/trailing/double hyphens', () => {
    expect(validateSlug('-ghk-cu').valid).toBe(false);
    expect(validateSlug('ghk-cu-').valid).toBe(false);
    expect(validateSlug('ghk--cu').valid).toBe(false);
  });
  it('rejects empty input', () => {
    expect(validateSlug('').valid).toBe(false);
    expect(validateSlug(undefined).valid).toBe(false);
  });
});

describe('validateProductCode', () => {
  it('accepts letters, numbers, and hyphens', () => {
    expect(validateProductCode('CU50').valid).toBe(true);
    expect(validateProductCode('PE-22-28').valid).toBe(true);
  });
  it('rejects spaces and special characters', () => {
    expect(validateProductCode('CU 50').valid).toBe(false);
    expect(validateProductCode('CU50!').valid).toBe(false);
  });
  it('rejects empty input', () => {
    expect(validateProductCode('').valid).toBe(false);
  });
});

describe('validatePrice (shop products)', () => {
  it('accepts a positive amount with at most two decimals', () => {
    expect(validatePrice('120').valid).toBe(true);
    expect(validatePrice('99.99').valid).toBe(true);
  });
  it('rejects zero, negative, and more than two decimals', () => {
    expect(validatePrice('0').valid).toBe(false);
    expect(validatePrice('-5').valid).toBe(false);
    expect(validatePrice('9.999').valid).toBe(false);
  });
});

describe('validateCount', () => {
  it('accepts a positive integer', () => {
    const result = validateCount(10);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(10);
  });
  it('accepts the XT100-style single-item count', () => {
    expect(validateCount(1).valid).toBe(true);
  });
  it('rejects zero, negative, and non-integer counts', () => {
    expect(validateCount(0).valid).toBe(false);
    expect(validateCount(-1).valid).toBe(false);
    expect(validateCount(1.5).valid).toBe(false);
  });
});

describe('ENTITY_KINDS — extends, never replaces, the existing taxonomy', () => {
  it('still contains every original Blueprint §11 value, unchanged', () => {
    const values = ENTITY_KINDS.map((k) => k.value);
    for (const original of [
      'peptide',
      'peptide_blend',
      'stack',
      'small_molecule_drug',
      'biologic',
      'supplement',
      'non_peptide_research_compound',
    ]) {
      expect(values).toContain(original);
    }
  });
  it('adds exactly the three genuinely new values confirmed in-chat', () => {
    const values = ENTITY_KINDS.map((k) => k.value);
    expect(values).toContain('protein');
    expect(values).toContain('cosmetic_mixture');
    expect(values).toContain('other');
  });
});

describe('INTERNAL_STATUSES / PUBLIC_STATUSES', () => {
  it('internal statuses support archiving over deletion', () => {
    expect(INTERNAL_STATUSES).toContain('archived');
  });
  it('public statuses are exactly private/compliance_hold/published', () => {
    expect(PUBLIC_STATUSES).toEqual(['private', 'compliance_hold', 'published']);
  });
});
