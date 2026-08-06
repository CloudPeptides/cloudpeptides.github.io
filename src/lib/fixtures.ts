/**
 * Fixture data for template development and testing ONLY. Never fetched
 * from Supabase, never reachable from the deployed anon-facing pages —
 * used only in tests (tests/unit, tests/e2e) and the dev-only preview
 * route (src/pages/dev/preview.astro, 404s outside `astro dev`).
 *
 * Deliberately about a fictional compound ("ERC-000") with clearly
 * placeholder claim text — this demonstrates the template layout, not
 * any real scientific assertion about a real substance.
 */
import type { CompoundWithRelations } from './database.types';

export const fixtureCompound: CompoundWithRelations = {
  id: 'fixture-0000-0000-0000-000000000000',
  slug: 'erc-000',
  name: 'ERC-000 (Example Research Compound)',
  entity_kind: 'peptide',
  identity_confidence: 'unverified',
  category: 'Example Category',
  status: 'published',
  legacy_source_path: null,
  raw_import_metadata: null,
  last_reviewed_at: '2026-01-01T00:00:00Z',
  reviewed_by: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  compound_aliases: [
    { id: 'alias-1', compound_id: 'fixture-0000-0000-0000-000000000000', alias: 'ERC-000A' },
  ],
  claims: [
    {
      id: 'claim-1',
      compound_id: 'fixture-0000-0000-0000-000000000000',
      content_section: 'summary',
      statement:
        'Placeholder summary text demonstrating the layout of a claim in the "summary" section. Not a real scientific statement.',
      evidence_quality: 'moderate',
      quality_rationale: 'Fixture rationale text — this is not a real evidence assessment.',
      interpretation_status: 'preliminary',
      display_order: 0,
      status: 'published',
      claim_sources: [
        {
          claim_id: 'claim-1',
          source_id: 'source-1',
          relationship: 'directly_supports',
          locator: 'Section 2',
          date_accessed: '2026-01-01',
          sources: {
            id: 'source-1',
            source_type: 'pubmed_article',
            study_id: 'study-1',
            title: 'Example placeholder study title',
            url: 'https://example.invalid/placeholder-source',
            publisher_or_agency: null,
            publication_date: '2025-01-01',
            retrieved_date: '2026-01-01',
            retraction_status: 'none',
          },
        },
      ],
    },
    {
      id: 'claim-2',
      compound_id: 'fixture-0000-0000-0000-000000000000',
      content_section: 'mechanism',
      statement:
        'Placeholder mechanism text demonstrating the layout of a claim in the "mechanism" section.',
      evidence_quality: 'low',
      quality_rationale: 'Fixture rationale.',
      interpretation_status: 'conflicting',
      display_order: 1,
      status: 'published',
      claim_sources: [],
    },
  ],
  regulatory_records: [
    {
      id: 'reg-1',
      compound_id: 'fixture-0000-0000-0000-000000000000',
      agency: 'Example Agency',
      jurisdiction: 'Example Jurisdiction',
      formulation: null,
      indication: null,
      regulatory_status: 'investigational',
      effective_date: null,
      status_change_date: null,
      source_id: 'source-1',
      last_verified_date: '2026-01-01',
      notes: 'Fixture regulatory note.',
      sources: {
        id: 'source-1',
        source_type: 'other',
        study_id: null,
        title: 'Example placeholder regulatory source',
        url: 'https://example.invalid/placeholder-regulatory',
        publisher_or_agency: null,
        publication_date: null,
        retrieved_date: '2026-01-01',
        retraction_status: 'none',
      },
    },
  ],
  stack_components: [],
};

export const fixtureListItems = [
  {
    id: 'fixture-1',
    slug: 'erc-000',
    name: 'ERC-000 (Example Research Compound)',
    entity_kind: 'peptide',
    category: 'Example Category',
    identity_confidence: 'unverified',
    status: 'published',
    compound_aliases: [{ alias: 'ERC-000A' }],
  },
  {
    id: 'fixture-2',
    slug: 'erc-001-stack',
    name: 'ERC-001 Example Stack',
    entity_kind: 'stack',
    category: 'Example Category',
    identity_confidence: 'unverified',
    status: 'published',
    compound_aliases: [],
  },
  {
    id: 'fixture-3',
    slug: 'erc-002-verified',
    name: 'ERC-002 Example Verified Compound',
    entity_kind: 'peptide',
    category: 'Example Recovery Category',
    identity_confidence: 'verified',
    status: 'published',
    compound_aliases: [{ alias: 'ERC-002B' }, { alias: 'Example Synonym' }],
  },
];

/**
 * Related-compounds demo for the erc-000 fixture profile — mirrors what
 * getRelatedCompounds() would return for a real compound (a real reverse
 * stack_components lookup), but hand-written here since the fixture path
 * never queries Supabase at all.
 */
export const fixtureRelatedCompounds = [
  { slug: 'erc-001-stack', name: 'ERC-001 Example Stack', entity_kind: 'stack' },
  { slug: 'erc-002-verified', name: 'ERC-002 Example Verified Compound', entity_kind: 'peptide' },
];
