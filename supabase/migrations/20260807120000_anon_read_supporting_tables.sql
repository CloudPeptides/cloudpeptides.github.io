-- Phase 3 — anon read access to research supporting tables (Blueprint v2 §16)
--
-- Phase 2's RLS migration (20260806144904_rls_policies.sql) deliberately
-- restricted every supporting/reference table (aliases, sources, studies,
-- identifiers, regulatory_records, stack_components, claim_sources) to
-- contributor+ only, with an explicit comment: "this is revisited in
-- Phase 3 when public compound-profile pages need to render citation
-- cards for already-published claims." This is that revisit.
--
-- Design: anon gets SELECT on these tables, but every policy is scoped —
-- via an EXISTS subquery — to rows that are actually reachable from a
-- published compound or published claim. A row belonging only to a draft
-- compound/claim remains invisible to anon even after this migration,
-- exactly as before. This does not weaken any existing protection:
-- compounds/claims still only expose status='published' rows to anon
-- (unchanged from Phase 2); this migration only extends that same
-- boundary transitively to the supporting data those published rows
-- reference.
--
-- content_revisions, link_health_checks, user_roles, audit_log, and
-- batch_coas are NOT touched by this migration — they remain
-- contributor+/editor+/admin-only exactly as Phase 2 left them. Draft or
-- internal revision data must remain inaccessible to anonymous users.

-- ---------------------------------------------------------------------
-- Grants — anon currently has SELECT on compounds/claims only
-- (20260806144905_grants.sql). Add SELECT on the supporting tables a
-- published compound profile actually needs to render. Never write
-- access, never the tables explicitly excluded above.
-- ---------------------------------------------------------------------
grant
select
  on public.compound_aliases,
  public.stack_components,
  public.studies,
  public.sources,
  public.source_identifiers,
  public.claim_sources,
  public.regulatory_records to anon;

-- ---------------------------------------------------------------------
-- compound_aliases — visible only for a published compound.
-- ---------------------------------------------------------------------
create policy "compound_aliases_select_anon" on public.compound_aliases for select to anon using (
  exists (
    select 1
    from public.compounds c
    where
      c.id = compound_aliases.compound_id
      and c.status = 'published'
  )
);

-- ---------------------------------------------------------------------
-- stack_components — visible only when the stack itself is published.
-- (The joined component compound's own visibility is separately governed
-- by the existing compounds_select policy when the profile page queries
-- it — this policy does not by itself expose a draft component's data.)
-- ---------------------------------------------------------------------
create policy "stack_components_select_anon" on public.stack_components for select to anon using (
  exists (
    select 1
    from public.compounds c
    where
      c.id = stack_components.stack_id
      and c.status = 'published'
  )
);

-- ---------------------------------------------------------------------
-- claim_sources — visible only when the linked claim is published. This
-- is the pivot table that makes citation cards possible at all; sources/
-- studies/source_identifiers below all key off "is this source reachable
-- via a visible claim_sources or regulatory_records row."
-- ---------------------------------------------------------------------
create policy "claim_sources_select_anon" on public.claim_sources for select to anon using (
  exists (
    select 1
    from public.claims cl
    where
      cl.id = claim_sources.claim_id
      and cl.status = 'published'
  )
);

-- ---------------------------------------------------------------------
-- regulatory_records — visible only when the parent compound is
-- published (regulatory_records has no own status column, unlike
-- claims — it inherits its parent compound's editorial state).
-- ---------------------------------------------------------------------
create policy "regulatory_records_select_anon" on public.regulatory_records for select to anon using (
  exists (
    select 1
    from public.compounds c
    where
      c.id = regulatory_records.compound_id
      and c.status = 'published'
  )
);

-- ---------------------------------------------------------------------
-- sources — visible if reachable via a visible claim_sources row OR a
-- visible regulatory_records row. A source with no published referrer
-- (e.g. one attached only to a still-draft claim) stays invisible.
-- ---------------------------------------------------------------------
create policy "sources_select_anon" on public.sources for select to anon using (
  exists (
    select 1
    from public.claim_sources cs
      join public.claims cl on cl.id = cs.claim_id
    where
      cs.source_id = sources.id
      and cl.status = 'published'
  )
  or exists (
    select 1
    from public.regulatory_records rr
      join public.compounds c on c.id = rr.compound_id
    where
      rr.source_id = sources.id
      and c.status = 'published'
  )
);

-- ---------------------------------------------------------------------
-- source_identifiers — visible if the parent source is visible (same
-- reachability rule, one level further down).
-- ---------------------------------------------------------------------
create policy "source_identifiers_select_anon" on public.source_identifiers for select to anon using (
  exists (
    select 1
    from public.sources s
      join public.claim_sources cs on cs.source_id = s.id
      join public.claims cl on cl.id = cs.claim_id
    where
      s.id = source_identifiers.source_id
      and cl.status = 'published'
  )
  or exists (
    select 1
    from public.sources s
      join public.regulatory_records rr on rr.source_id = s.id
      join public.compounds c on c.id = rr.compound_id
    where
      s.id = source_identifiers.source_id
      and c.status = 'published'
  )
);

-- ---------------------------------------------------------------------
-- studies — visible if the parent source is visible (a study is only
-- ever reached through its owning source's study_id).
-- ---------------------------------------------------------------------
create policy "studies_select_anon" on public.studies for select to anon using (
  exists (
    select 1
    from public.sources s
      join public.claim_sources cs on cs.source_id = s.id
      join public.claims cl on cl.id = cs.claim_id
    where
      s.study_id = studies.id
      and cl.status = 'published'
  )
  or exists (
    select 1
    from public.sources s
      join public.regulatory_records rr on rr.source_id = s.id
      join public.compounds c on c.id = rr.compound_id
    where
      s.study_id = studies.id
      and c.status = 'published'
  )
);
