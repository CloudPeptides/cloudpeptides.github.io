-- Phase 2 — explicit table grants
--
-- Current Supabase projects no longer auto-expose newly created tables
-- to the anon/authenticated Data API roles by default (see the comment
-- in supabase/config.toml) — grants must be explicit. RLS (previous
-- migration) then narrows which *rows* each granted operation can
-- actually touch; a grant alone never bypasses RLS.
grant usage on schema public to anon,
authenticated;

-- anon: read-only, and only ever on the two tables that carry their own
-- published/draft status — RLS restricts this further to status =
-- 'published' rows only.
grant
select
  on public.compounds,
  public.claims to anon;

-- authenticated: every research-content table gets select/insert/update/
-- delete granted broadly — RLS policies (previous migration) are what
-- actually gate which rows a member vs. contributor vs. editor vs. admin
-- can touch for each operation. Nothing here grants anything on
-- user_roles or audit_log — those stay service-role-only by omission.
grant
select
,
insert,
update,
delete on public.compounds,
public.claims,
public.compound_aliases,
public.stack_components,
public.studies,
public.sources,
public.source_identifiers,
public.claim_sources,
public.regulatory_records,
public.batch_coas to authenticated;

-- content_revisions / link_health_checks: read-only grant to
-- authenticated (RLS restricts to editor+/contributor+ respectively) —
-- writes happen only via SECURITY DEFINER functions or service-role,
-- never a direct client INSERT/UPDATE/DELETE.
grant
select
  on public.content_revisions,
  public.link_health_checks to authenticated;

-- user_roles: authenticated may SELECT (RLS restricts to their own row)
-- but never INSERT/UPDATE/DELETE — that grant is deliberately omitted.
grant
select
  on public.user_roles to authenticated;

-- audit_log: authenticated may SELECT (RLS restricts to admin) but never
-- write — that grant is deliberately omitted.
grant
select
  on public.audit_log to authenticated;
