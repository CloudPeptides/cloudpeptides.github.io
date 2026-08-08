-- Phase 2 — indexes for the foreign-key lookups every RLS policy and
-- expected query pattern actually performs.
create index compound_aliases_compound_id_idx on public.compound_aliases (compound_id);

create index stack_components_component_compound_id_idx on public.stack_components (component_compound_id);

create index studies_id_idx on public.studies (id);

create index sources_study_id_idx on public.sources (study_id)
where
  study_id is not null;

create index claims_compound_id_idx on public.claims (compound_id);

create index claims_status_idx on public.claims (status);

create index claim_sources_source_id_idx on public.claim_sources (source_id);

create index regulatory_records_compound_id_idx on public.regulatory_records (compound_id);

create index regulatory_records_source_id_idx on public.regulatory_records (source_id);

create index content_revisions_compound_id_idx on public.content_revisions (compound_id);

create index link_health_checks_source_id_idx on public.link_health_checks (source_id);

create index compounds_status_idx on public.compounds (status);

create index compounds_entity_kind_idx on public.compounds (entity_kind);
