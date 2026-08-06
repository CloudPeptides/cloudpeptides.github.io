-- Phase 2 — locked-down roles + custom-claims approach (Blueprint v2 §16)
--
-- Roles are NOT a client-editable column. user_roles is writable only by
-- service-role/trusted server contexts (no INSERT/UPDATE/DELETE grant to
-- anon/authenticated at all — only a service_role client, which bypasses
-- RLS and GRANTs in Supabase, can write here). A user may only ever read
-- their own role row.
create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'contributor', 'editor', 'admin')),
  updated_at timestamptz not null default now()
);

comment on table public.user_roles is
  'Role assignment per user. Never client-writable — see Blueprint v2 §16. Promotions happen only through a trusted service-role Worker route.';

-- Append-only audit trail for every service-role action (role changes,
-- migration script runs, future scheduled jobs). Blueprint v2 §16.
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id),
  action text not null,
  target_table text,
  target_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- Role hierarchy helpers, used throughout the RLS policies in
-- 20260806144905_rls_policies.sql.
create or replace function public.role_rank(r text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case r
    when 'admin' then 4
    when 'editor' then 3
    when 'contributor' then 2
    when 'member' then 1
    else 0
  end;
$$;

-- Reads the role from the *verified JWT claim* injected by the custom
-- access token hook below — never from a table join a client could
-- manipulate (Blueprint v2 §16's explicit correction of the v1 design).
create or replace function public.jwt_role()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'user_role', 'anon');
$$;

create or replace function public.has_min_role(min_role text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.role_rank(public.jwt_role()) >= public.role_rank(min_role);
$$;

-- Custom Access Token Auth Hook (Supabase's documented mechanism, per
-- Blueprint v2 §16): runs at login/token-refresh, reads the user's role
-- from user_roles, and embeds it as a custom claim inside the
-- Supabase-signed JWT. A client cannot forge or edit its own claims.
--
-- NOTE: creating this function does not enable it. Enabling a Custom
-- Access Token Hook requires a manual step in the Supabase Dashboard
-- (Authentication → Hooks) — this is intentional; hooks cannot be
-- enabled via SQL migration alone. See the Phase 2 report for that step.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
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

-- Only Supabase's auth service may invoke the hook — never a client role.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
