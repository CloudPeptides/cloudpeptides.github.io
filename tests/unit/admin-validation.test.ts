import { describe, expect, it } from 'vitest';
import {
  checkPublishReadiness,
  validateClaimFields,
  validateCompoundFields,
  validateRegulatoryRecordFields,
  validateSourceFields,
} from '../../src/lib/admin/validation';
import type { CompoundWithRelations } from '../../src/lib/database.types';

describe('validateCompoundFields', () => {
  it('accepts a valid minimal compound', () => {
    const result = validateCompoundFields({
      slug: 'bpc-157',
      name: 'BPC-157',
      entity_kind: 'peptide',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects a slug with uppercase or spaces', () => {
    expect(
      validateCompoundFields({ slug: 'BPC 157', name: 'x', entity_kind: 'peptide' }).valid,
    ).toBe(false);
  });

  it('rejects a missing name', () => {
    expect(validateCompoundFields({ slug: 'bpc-157', entity_kind: 'peptide' }).valid).toBe(false);
  });

  it('rejects an entity_kind outside the approved taxonomy', () => {
    expect(
      validateCompoundFields({ slug: 'x', name: 'X', entity_kind: 'not_a_real_kind' }).valid,
    ).toBe(false);
  });
});

describe('validateClaimFields — quality_rationale rule', () => {
  it('mirrors the DB CHECK constraint: evidence_quality set (not not_assessed) requires a rationale', () => {
    const result = validateClaimFields({
      content_section: 'summary',
      statement: 'x',
      evidence_quality: 'high',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/rationale/i);
  });

  it('allows evidence_quality=not_assessed with no rationale', () => {
    const result = validateClaimFields({
      content_section: 'summary',
      statement: 'x',
      evidence_quality: 'not_assessed',
    });
    expect(result.valid).toBe(true);
  });

  it('allows no evidence_quality at all with no rationale', () => {
    const result = validateClaimFields({ content_section: 'summary', statement: 'x' });
    expect(result.valid).toBe(true);
  });

  it('accepts evidence_quality set together with a rationale', () => {
    const result = validateClaimFields({
      content_section: 'summary',
      statement: 'x',
      evidence_quality: 'moderate',
      quality_rationale: 'One small human RCT, not replicated.',
    });
    expect(result.valid).toBe(true);
  });
});

describe('validateSourceFields', () => {
  it('rejects a non-absolute URL', () => {
    expect(validateSourceFields({ source_type: 'other', title: 'x', url: 'not-a-url' }).valid).toBe(
      false,
    );
  });
  it('accepts a valid absolute URL', () => {
    expect(
      validateSourceFields({ source_type: 'other', title: 'x', url: 'https://example.com/a' })
        .valid,
    ).toBe(true);
  });
});

describe('validateRegulatoryRecordFields', () => {
  it('requires a source_id — a regulatory record can never exist without one', () => {
    const result = validateRegulatoryRecordFields({
      agency: 'FDA',
      jurisdiction: 'US',
      regulatory_status: 'approved',
    });
    expect(result.valid).toBe(false);
  });
});

function baseCompound(overrides: Partial<CompoundWithRelations> = {}): CompoundWithRelations {
  return {
    id: 'c1',
    slug: 'x',
    name: 'X',
    entity_kind: 'peptide',
    identity_confidence: 'unverified',
    category: null,
    status: 'draft',
    legacy_source_path: null,
    raw_import_metadata: null,
    last_reviewed_at: null,
    reviewed_by: null,
    created_at: '',
    updated_at: '',
    compound_aliases: [],
    claims: [],
    regulatory_records: [],
    stack_components: [],
    ...overrides,
  } as CompoundWithRelations;
}

describe('checkPublishReadiness — Blueprint v2 §17 pre-publish checks', () => {
  it('blocks publish when a claim has zero cited sources', () => {
    const compound = baseCompound({
      claims: [
        {
          id: 'cl1',
          compound_id: 'c1',
          content_section: 'summary',
          statement: 'x',
          evidence_quality: null,
          quality_rationale: null,
          interpretation_status: null,
          display_order: null,
          status: 'draft',
          claim_sources: [],
        },
      ] as unknown as CompoundWithRelations['claims'],
    });
    const readiness = checkPublishReadiness(compound);
    expect(readiness.blockers.length).toBeGreaterThan(0);
    expect(readiness.blockers.join(' ')).toMatch(/no cited source/i);
  });

  it('allows publish when every claim has at least one citation and no rationale is missing', () => {
    const compound = baseCompound({
      claims: [
        {
          id: 'cl1',
          compound_id: 'c1',
          content_section: 'summary',
          statement: 'x',
          evidence_quality: 'high',
          quality_rationale: 'Two independent RCTs.',
          interpretation_status: 'supported',
          display_order: null,
          status: 'draft',
          claim_sources: [{ claim_id: 'cl1', source_id: 's1' }],
        },
      ] as unknown as CompoundWithRelations['claims'],
    });
    const readiness = checkPublishReadiness(compound);
    expect(readiness.blockers).toEqual([]);
  });

  it('blocks publish when a regulatory record has no source', () => {
    const compound = baseCompound({
      regulatory_records: [
        {
          id: 'r1',
          compound_id: 'c1',
          agency: 'FDA',
          jurisdiction: 'US',
          formulation: null,
          indication: null,
          regulatory_status: 'approved',
          effective_date: null,
          status_change_date: null,
          source_id: '',
          last_verified_date: '',
          notes: null,
        },
      ] as unknown as CompoundWithRelations['regulatory_records'],
    });
    const readiness = checkPublishReadiness(compound);
    expect(readiness.blockers.join(' ')).toMatch(/missing a source/i);
  });

  it('warns (does not block) when a compound has zero claims at all', () => {
    const compound = baseCompound();
    const readiness = checkPublishReadiness(compound);
    expect(readiness.blockers).toEqual([]);
    expect(readiness.warnings.join(' ')).toMatch(/no claims/i);
  });
});
