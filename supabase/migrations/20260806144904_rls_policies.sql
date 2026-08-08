-- Phase 2 — Row Level Security on every exposed table (Blueprint v2 §16)
--
-- Two visibility tiers, deliberately conservative for Phase 2 (no public
-- UI exists yet — that's Phase 3):
--  - compounds / claims: the two tables with their own editorial status.
--    anon + plain 'member' authenticated users see only status='published'
--    rows; contributor+ sees every status (needed to do editorial work).
--  - every supporting/reference table (aliases, sources, studies,
--    identifiers, regulatory_records, stack_components, claim_sources,
--    content_revisions, link_health_checks): contributor+ only. Nothing
--    in Phase 2 needs anon/member to read raw source/study rows directly;
--    this is revisited in Phase 3 when public compound-profile pages
--    need to render citation cards for already-published claims.
--  - user_roles / audit_log: locked down per Blueprint v2 §16 exactly.
--  - batch_coas: admin-only for now (no real usage until Phase 4).

alter table public.user_roles enable row level security;
alter table public.audit_log enable row level security;
alter table public.compounds enable row level security;
alter table public.compound_aliases enable row level security;
alter table public.stack_components enable row level security;
alter table public.studies enable row level security;
alter table public.sources enable row level security;
alter table public.source_identifiers enable row level security;
alter table public.claims enable row level security;
alter table public.claim_sources enable row level security;
alter table public.regulatory_records enable row level security;
alter table public.content_revisions enable row level security;
alter table public.link_health_checks enable row level security;
alter table public.batch_coas enable row level security;

-- Belt-and-suspenders: FORCE ROW LEVEL SECURITY means even the table
-- owner is subject to RLS (service_role connects as a role that bypasses
-- RLS regardless via Supabase's own role setup, so this only tightens
-- things further — it costs nothing and closes a class of "ran a
-- migration as the wrong role" mistakes).
alter table public.user_roles force row level security;
alter table public.audit_log force row level security;

-- ---------------------------------------------------------------------
-- user_roles — readable only by the owning user; writable only by
-- service-role (no INSERT/UPDATE/DELETE policy exists for anon/
-- authenticated at all, which — combined with no GRANT of those
-- operations in 20260806144905_grants.sql — makes them structurally
-- impossible for a client to perform, not just RLS-denied).
-- ---------------------------------------------------------------------
create policy "user_roles_select_own" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- audit_log — admin-only read; no client write policy at all.
-- ---------------------------------------------------------------------
create policy "audit_log_select_admin" on public.audit_log for select to authenticated using (public.has_min_role('admin'));

-- ---------------------------------------------------------------------
-- compounds
-- ---------------------------------------------------------------------
create policy "compounds_select" on public.compounds for select to anon, authenticated using (
  status = 'published'
  or public.has_min_role('contributor')
);

create policy "compounds_insert_contributor" on public.compounds for insert to authenticated
with
  check (
    public.has_min_role('contributor')
    and status = 'draft'
  );

-- Contributors may freely edit rows still in draft/in_review (their
-- normal editorial work). Only editor+ may touch a row that is already
-- published/archived, or move a row's status to 'published' — this is
-- exactly Blueprint v2 §16's required test: "a contributor attempts to
-- set a compound's status to published → rejected by RLS".
create policy "compounds_update" on public.compounds for
update to authenticated using (
  (
    public.has_min_role('contributor')
    and status in ('draft', 'in_review')
  )
  or public.has_min_role('editor')
)
with
  check (
    public.has_min_role('editor')
    or (
      public.has_min_role('contributor')
      and status in ('draft', 'in_review')
    )
  );

create policy "compounds_delete_editor" on public.compounds for delete to authenticated using (public.has_min_role('editor'));

-- ---------------------------------------------------------------------
-- claims — same shape as compounds.
-- ---------------------------------------------------------------------
create policy "claims_select" on public.claims for select to anon, authenticated using (
  status = 'published'
  or public.has_min_role('contributor')
);

create policy "claims_insert_contributor" on public.claims for insert to authenticated
with
  check (
    public.has_min_role('contributor')
    and status = 'draft'
  );

create policy "claims_update" on public.claims for
update to authenticated using (
  (
    public.has_min_role('contributor')
    and status in ('draft', 'in_review')
  )
  or public.has_min_role('editor')
)
with
  check (
    public.has_min_role('editor')
    or (
      public.has_min_role('contributor')
      and status in ('draft', 'in_review')
    )
  );

create policy "claims_delete_editor" on public.claims for delete to authenticated using (public.has_min_role('editor'));

-- ---------------------------------------------------------------------
-- Supporting/reference tables — contributor+ only, every operation.
-- ---------------------------------------------------------------------
create policy "compound_aliases_all_contributor" on public.compound_aliases for all to authenticated using (public.has_min_role('contributor'))
with
  check (public.has_min_role('contributor'));

create policy "stack_components_all_contributor" on public.stack_components for all to authenticated using (public.has_min_role('contributor'))
with
  check (public.has_min_role('contributor'));

create policy "studies_all_contributor" on public.studies for all to authenticated using (public.has_min_role('contributor'))
with
  check (public.has_min_role('contributor'));

create policy "sources_all_contributor" on public.sources for all to authenticated using (public.has_min_role('contributor'))
with
  check (public.has_min_role('contributor'));

create policy "source_identifiers_all_contributor" on public.source_identifiers for all to authenticated using (public.has_min_role('contributor'))
with
  check (public.has_min_role('contributor'));

create policy "claim_sources_all_contributor" on public.claim_sources for all to authenticated using (public.has_min_role('contributor'))
with
  check (public.has_min_role('contributor'));

create policy "regulatory_records_all_contributor" on public.regulatory_records for all to authenticated using (public.has_min_role('contributor'))
with
  check (public.has_min_role('contributor'));

-- content_revisions is written only by the SECURITY DEFINER function in
-- 20260806144906_functions_triggers.sql (which bypasses RLS) — no INSERT/
-- UPDATE/DELETE policy exists for any client role, read-only for editors.
create policy "content_revisions_select_editor" on public.content_revisions for select to authenticated using (public.has_min_role('editor'));

-- link_health_checks is written only by the future automated job via
-- service-role — no client write policy exists.
create policy "link_health_checks_select_contributor" on public.link_health_checks for select to authenticated using (public.has_min_role('contributor'));

-- ---------------------------------------------------------------------
-- batch_coas — commerce domain, admin-only for now (no real usage until
-- Phase 4 builds out the actual commerce schema and admin upload flow).
-- ---------------------------------------------------------------------
create policy "batch_coas_all_admin" on public.batch_coas for all to authenticated using (public.has_min_role('admin'))
with
  check (public.has_min_role('admin'));
