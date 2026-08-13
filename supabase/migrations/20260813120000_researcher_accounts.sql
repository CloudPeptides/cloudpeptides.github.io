-- Mandatory researcher-account gate (2026-08-13, approved) — schema for
-- the public "Independent Researcher" account type.
--
-- Deliberately two tables, not one:
--  - researcher_profiles: mutable self-service profile data (name,
--    country, region, affiliation) PLUS admin-only account-status
--    fields (account_status, suspension metadata, forced-recertify
--    marker). One row per researcher account.
--  - researcher_attestations: APPEND-ONLY record of every certification
--    a user has ever accepted — never updated or deleted, so "did this
--    user accept the current Researcher Certification" is always
--    answerable from real history, not a single overwritable boolean.
--
-- Role/permission model is UNCHANGED: registration never touches
-- user_roles at all. A brand-new auth user has no user_roles row, and
-- public.custom_access_token_hook() (20260806144902_roles_and_security.sql)
-- already defaults an unassigned user's JWT `user_role` claim to
-- 'member' via its own coalesce(...,'member') — the existing lowest
-- rank in the existing role_rank()/has_min_role() hierarchy. This is
-- exactly the "minimum ordinary researcher role" requirement, satisfied
-- by doing nothing new to the roles system rather than inventing a
-- parallel one.

-- ---------------------------------------------------------------------
-- researcher_profiles
-- ---------------------------------------------------------------------
create table public.researcher_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  country text not null,
  region text,
  research_affiliation text not null,
  -- Admin-controlled fields — see the protect trigger below, which is
  -- the actual enforcement (RLS alone cannot express "this column may
  -- only change when the caller is admin" without it).
  account_status text not null default 'active' check (account_status in ('active', 'suspended')),
  suspended_at timestamptz,
  suspended_reason text,
  suspended_by uuid references auth.users (id),
  -- Set by an admin to force recertification for this one user without
  -- bumping the global CURRENT_CERTIFICATION_VERSION (which would force
  -- every researcher to recertify). A user needs to (re)certify whenever
  -- they have no attestation row, their latest attestation's
  -- certification_version is older than the current version, or their
  -- latest attestation predates this timestamp.
  force_recertify_after timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.researcher_profiles is
  'One row per public "Independent Researcher" account. full_name/country/region/research_affiliation are self-service (own-row RLS); account_status/suspended_*/force_recertify_after are admin-only, enforced by the protect_researcher_profile_admin_fields trigger below, not by RLS alone.';

create trigger researcher_profiles_set_updated_at before update on public.researcher_profiles for each row
execute function public.set_updated_at ();

-- ---------------------------------------------------------------------
-- researcher_attestations — append-only. No update/delete policy exists
-- for ANY role (including admin, deliberately) — a superseded
-- certification stays in history forever; "renewal" is a new row, never
-- an edit.
-- ---------------------------------------------------------------------
create table public.researcher_attestations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_type text not null default 'independent_researcher' check (account_type = 'independent_researcher'),
  certification_version text not null,
  research_use_policy_version text not null,
  terms_version text not null,
  privacy_version text not null,
  accepted_at timestamptz not null default now(),
  country text not null,
  region text,
  email_verified_at_acceptance boolean not null default false
);

comment on table public.researcher_attestations is
  'Append-only. One row per certification acceptance (initial registration or later renewal) — never updated or deleted, including by admin. "Require renewed certification" (admin action) works by setting researcher_profiles.force_recertify_after, which makes the most recent row here stale without altering it.';

create index researcher_attestations_user_id_idx on public.researcher_attestations (user_id, accepted_at desc);

-- ---------------------------------------------------------------------
-- Admin-only-field protection trigger (researcher_profiles)
-- ---------------------------------------------------------------------
create or replace function public.protect_researcher_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    new.account_status is distinct from old.account_status
    or new.suspended_at is distinct from old.suspended_at
    or new.suspended_reason is distinct from old.suspended_reason
    or new.suspended_by is distinct from old.suspended_by
    or new.force_recertify_after is distinct from old.force_recertify_after
  ) and not public.has_min_role('admin') then
    raise exception 'Only administrators may change account status, suspension details, or certification requirements.';
  end if;
  return new;
end;
$$;

create trigger researcher_profiles_protect_admin_fields
before update on public.researcher_profiles
for each row execute function public.protect_researcher_profile_admin_fields ();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.researcher_profiles enable row level security;
alter table public.researcher_profiles force row level security;
alter table public.researcher_attestations enable row level security;
alter table public.researcher_attestations force row level security;

-- A researcher may read their own profile; admin may read every profile
-- (account review, suspension workflow).
create policy "researcher_profiles_select" on public.researcher_profiles for select to authenticated using (
  user_id = auth.uid()
  or public.has_min_role('admin')
);

-- Registration writes this row via the service-role client from a
-- narrowly-scoped Worker route (src/pages/api/account/register.ts) —
-- before email confirmation, no user JWT/session exists yet for the
-- brand-new auth user, so a client-side insert under RLS is not
-- possible at that point regardless of policy. This INSERT policy
-- exists only so a signed-in user could self-repair a missing profile
-- row through the ordinary client path in the future; it is not the
-- path registration itself uses today.
create policy "researcher_profiles_insert_self" on public.researcher_profiles for insert to authenticated
with
  check (user_id = auth.uid());

-- Self-service field edits (name/country/region/affiliation) OR any
-- admin edit (including the admin-only fields, gated by the trigger
-- above, not this policy). A non-admin user's own-row UPDATE is
-- structurally incapable of changing the admin-only columns regardless
-- of what this policy allows, because the trigger raises first.
create policy "researcher_profiles_update" on public.researcher_profiles for
update to authenticated using (
  user_id = auth.uid()
  or public.has_min_role('admin')
)
with
  check (
    user_id = auth.uid()
    or public.has_min_role('admin')
  );

-- No delete policy at all — accounts are suspended, never deleted, from
-- this table's own RLS perspective (Supabase Auth user deletion, a
-- separate, more destructive admin action, cascades here via the FK's
-- own ON DELETE CASCADE and needs no client-facing DELETE policy).

-- researcher_attestations — a user reads their own attestation history;
-- admin reads everyone's (certification-version/acceptance-date review).
create policy "researcher_attestations_select" on public.researcher_attestations for select to authenticated using (
  user_id = auth.uid()
  or public.has_min_role('admin')
);

-- Insert-only, own row — used by both registration (service-role path,
-- see above) and self-service certification renewal
-- (src/pages/api/account/certify.ts, user's own JWT). No update/delete
-- policy exists for any role: append-only is enforced structurally, not
-- just by convention.
create policy "researcher_attestations_insert_self" on public.researcher_attestations for insert to authenticated
with
  check (user_id = auth.uid());

grant
select
,
insert,
update on public.researcher_profiles to authenticated;

grant
select
,
insert on public.researcher_attestations to authenticated;
