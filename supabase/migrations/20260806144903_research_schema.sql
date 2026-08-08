-- Phase 2 — complete research data model (Blueprint v2 §5–§13)
-- Editorial status workflow (draft → in_review → published, plus
-- archived) is shared by compounds and claims — the two content-bearing
-- tables an editor actually moves through review.

-- ---------------------------------------------------------------------
-- Canonical compounds (§10) + taxonomy (§11) + identity policy (§12)
-- ---------------------------------------------------------------------
create table public.compounds (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  entity_kind text not null check (
    entity_kind in (
      'peptide',
      'peptide_blend',
      'stack',
      'small_molecule_drug',
      'biologic',
      'supplement',
      'non_peptide_research_compound'
    )
  ),
  -- §12 Questionable-Identity Policy — a compound cannot be marked
  -- 'verified' without an authoritative identity source (enforced at the
  -- application/editorial-review layer, not a DB constraint, since it
  -- depends on which *type* of source is attached).
  identity_confidence text not null default 'unverified' check (
    identity_confidence in ('verified', 'disputed', 'unverified', 'likely_naming_variant')
  ),
  category text,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'published', 'archived')),
  -- Migration traceability only — not part of the Blueprint's schema
  -- proper, but required to honestly trace every imported row back to
  -- its legacy source page and preserve whatever didn't fit a typed
  -- column (quickfacts, topic tags, related-compound mentions) without
  -- fabricating claims out of bare keyword lists.
  legacy_source_path text,
  raw_import_metadata jsonb,
  last_reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.compound_aliases (
  id uuid primary key default gen_random_uuid(),
  compound_id uuid not null references public.compounds (id) on delete cascade,
  alias text not null,
  created_at timestamptz not null default now(),
  unique (compound_id, alias)
);

-- §11 Taxonomy — a stack/blend is a compound record like any other, but
-- also declares its component compounds and pulls their summaries by
-- reference rather than duplicating them.
create table public.stack_components (
  stack_id uuid not null references public.compounds (id) on delete cascade,
  component_compound_id uuid not null references public.compounds (id) on delete cascade,
  dose_or_ratio_note text,
  primary key (stack_id, component_compound_id)
);

-- ---------------------------------------------------------------------
-- Expanded study model (§8) — defined before sources, which reference it
-- ---------------------------------------------------------------------
create table public.studies (
  id uuid primary key default gen_random_uuid(),
  study_design text not null check (
    study_design in (
      'rct_human',
      'non_randomized_human_trial',
      'human_observational',
      'case_report_or_series',
      'systematic_review',
      'meta_analysis',
      'narrative_review',
      'animal_study',
      'in_vitro_study',
      'mechanistic'
    )
  ),
  population text,
  sample_size int,
  comparator text,
  intervention text,
  route text,
  published_research_dose text,
  duration text,
  primary_outcomes text,
  secondary_outcomes text,
  results_summary text,
  limitations text,
  funding_source text,
  conflicts_of_interest text,
  registration_number text,
  peer_review_status text check (peer_review_status in ('peer_reviewed', 'preprint', 'not_peer_reviewed', 'unknown')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Generalized source model (§7) — a source never requires a study to
-- exist (anecdotal reports, regulatory documents, database records, and
-- this migration's own "legacy page" provenance sources all have no
-- study_id at all).
-- ---------------------------------------------------------------------
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (
    source_type in (
      'pubmed_article',
      'doi_article',
      'clinicaltrials_gov',
      'fda_document',
      'ema_document',
      'wada_list',
      'pubchem_record',
      'uniprot_record',
      'patent',
      'regulatory_announcement',
      'systematic_review',
      'official_database_record',
      'anecdotal_report',
      'other'
    )
  ),
  study_id uuid references public.studies (id),
  title text not null,
  url text not null,
  publisher_or_agency text,
  publication_date date,
  retrieved_date date not null default current_date,
  retraction_status text not null default 'none' check (
    retraction_status in ('none', 'corrected', 'retracted', 'expression_of_concern')
  ),
  retraction_note text,
  retraction_checked_at date,
  created_at timestamptz not null default now()
);

create table public.source_identifiers (
  source_id uuid not null references public.sources (id) on delete cascade,
  identifier_type text not null check (
    identifier_type in ('doi', 'pmid', 'nct_number', 'patent_number', 'cas_number', 'pubchem_cid', 'other')
  ),
  identifier_value text not null,
  primary key (source_id, identifier_type, identifier_value)
);

-- Global uniqueness — the same DOI/PMID/NCT number/etc. cannot be
-- attached to two different source records (§7).
create unique index source_identifiers_globally_unique on public.source_identifiers (identifier_type, identifier_value);

-- ---------------------------------------------------------------------
-- Claim-level citation model (§6) — evidence type (on the source),
-- evidence quality, and interpretation status (both on the claim) are
-- three genuinely independent fields, never conflated or auto-derived
-- from one another (§5).
-- ---------------------------------------------------------------------
create table public.claims (
  id uuid primary key default gen_random_uuid(),
  compound_id uuid references public.compounds (id) on delete cascade,
  content_section text not null check (
    content_section in (
      'summary',
      'mechanism',
      'pharmacokinetics',
      'origin',
      'regulatory',
      'adverse_effects',
      'interactions',
      'storage',
      'faq',
      'safety'
    )
  ),
  statement text not null,
  evidence_quality text check (evidence_quality in ('high', 'moderate', 'low', 'very_low', 'not_assessed')),
  quality_rationale text,
  interpretation_status text check (
    interpretation_status in ('established', 'supported', 'preliminary', 'conflicting', 'insufficient', 'unknown')
  ),
  display_order int,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quality_rationale_required check (
    evidence_quality is null or evidence_quality = 'not_assessed' or quality_rationale is not null
  )
);

create table public.claim_sources (
  claim_id uuid not null references public.claims (id) on delete cascade,
  source_id uuid not null references public.sources (id) on delete cascade,
  relationship text not null check (
    relationship in ('directly_supports', 'indirectly_supports', 'contradicts', 'provides_context')
  ),
  locator text,
  date_accessed date not null default current_date,
  primary key (claim_id, source_id)
);

-- ---------------------------------------------------------------------
-- Regulatory model (§9) — many records per compound, never a single
-- collapsed status; every record requires a source and a freshness date.
-- ---------------------------------------------------------------------
create table public.regulatory_records (
  id uuid primary key default gen_random_uuid(),
  compound_id uuid not null references public.compounds (id) on delete cascade,
  agency text not null,
  jurisdiction text not null,
  formulation text,
  indication text,
  regulatory_status text not null check (
    regulatory_status in (
      'approved',
      'not_approved',
      'withdrawn',
      'discontinued',
      'investigational',
      'banned_in_sport',
      'scheduled_controlled_substance',
      'unscheduled',
      'no_determination',
      'other'
    )
  ),
  effective_date date,
  status_change_date date,
  source_id uuid not null references public.sources (id),
  last_verified_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Content provenance & change history (§20) — a full JSON snapshot per
-- meaningful compound-level edit. See 20260806144906_functions_triggers.sql
-- for how rows here actually get created.
-- ---------------------------------------------------------------------
create table public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  compound_id uuid not null references public.compounds (id) on delete cascade,
  snapshot jsonb not null,
  editor_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Automated source-link health checks (§18) — table only. The actual
-- Cloudflare Cron Trigger job that populates this is later-phase
-- infrastructure, not part of Phase 2's database work.
-- ---------------------------------------------------------------------
create table public.link_health_checks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  http_status int,
  status_category text not null check (
    status_category in (
      'confirmed_accessible',
      'redirected',
      'temporarily_unavailable',
      'permanently_missing',
      'auth_or_bot_protected',
      'rate_limited',
      'invalid_url',
      'not_automatically_checkable',
      'manually_verified'
    )
  ),
  checked_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Batch testing / COA data model (§14) — commerce domain, deliberately
-- structurally separate: product_id has no foreign key, because the
-- commerce `products` table doesn't exist yet (Phase 4) and evidence
-- tables must never gain a dependency on commerce tables. Never joined
-- into a compound's evidence claims.
-- ---------------------------------------------------------------------
create table public.batch_coas (
  id uuid primary key default gen_random_uuid(),
  product_id uuid,
  batch_identifier text not null,
  test_date date,
  testing_lab text not null,
  coa_file_url text not null,
  purity_result text,
  uploaded_at timestamptz not null default now()
);

comment on table public.batch_coas is
  'Commerce domain. No FK to compounds/claims/sources — Janoshik or other batch COAs are never citable as scientific evidence (Blueprint v2 §14).';
