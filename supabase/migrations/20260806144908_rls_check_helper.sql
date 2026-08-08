-- Phase 2 — verification helper only (not part of the application schema)
--
-- pg_catalog tables aren't exposed through Supabase's Data API, so
-- automated RLS-enabled verification (scripts/migration/verify-security.mjs)
-- needs a callable function to check it. SECURITY DEFINER + no grant to
-- anon/authenticated (only service_role, which already bypasses RLS
-- entirely, can call this) means it exposes nothing a client couldn't
-- already infer by testing the tables directly.
create or replace function public.check_rls_enabled(table_names text[])
returns table (table_name text, rowsecurity boolean)
language sql
security definer
set search_path = ''
as $$
  select c.relname::text, c.relrowsecurity
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any(table_names);
$$;

revoke execute on function public.check_rls_enabled from authenticated, anon, public;
grant execute on function public.check_rls_enabled to service_role;
