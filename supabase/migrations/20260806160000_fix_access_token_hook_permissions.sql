-- Phase 2 — fix: custom_access_token_hook must be SECURITY DEFINER
--
-- Found via live testing against the real staging project: the function
-- as originally written ran with the INVOKER's privileges. Supabase's
-- Auth service invokes it as `supabase_auth_admin`, which was never
-- granted SELECT on public.user_roles — the hook errored on every login
-- ("Error running hook URI: pg-functions://postgres/public/
-- custom_access_token_hook") even though the function worked fine when
-- tested directly as the postgres role, which has broad access.
-- SECURITY DEFINER makes it run with the function owner's privileges
-- instead, which is also Supabase's own documented pattern for this
-- exact hook. Re-created (not just ALTERed) since search_path also needs
-- to be pinned for a SECURITY DEFINER function per Postgres's own
-- security guidance.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims jsonb;
  assigned_role text;
begin
  select role into assigned_role
  from public.user_roles
  where user_id = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(assigned_role, 'member')));
  event := jsonb_set(event, '{claims}', claims);

  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook
from
  authenticated,
  anon,
  public;
