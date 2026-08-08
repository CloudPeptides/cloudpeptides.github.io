-- Commerce Activation + COA Gallery phase (2026-08-08)
--
-- Extends the existing batch_coas table (created empty in Phase 2,
-- "admin-only for now (no real usage until Phase 4)" — confirmed
-- empty before this migration was written) into the real public COA
-- gallery + admin-managed schema. Still commerce domain, still no FK
-- into compounds/claims/sources — Janoshik/batch COAs are never
-- citable as scientific evidence (Blueprint v2 §14, unchanged by this
-- migration).
--
-- coa_file_url (a bare text URL) is replaced by Storage-backed
-- columns (file_path/file_mime_type/file_size_bytes/
-- original_filename) — the actual file now lives in Supabase Storage
-- (bucket coa-documents, below), not an arbitrary external URL.

-- ---------------------------------------------------------------------
-- Schema changes
-- ---------------------------------------------------------------------
alter table public.batch_coas
  add column peptide_name text,
  add column verification_url text,
  add column notes text,
  add column status text not null default 'draft',
  add column file_path text,
  add column file_mime_type text,
  add column file_size_bytes bigint,
  add column original_filename text,
  add column published_at timestamptz,
  add column archived_at timestamptz,
  add column created_by uuid references auth.users (id) on delete set null,
  add column updated_at timestamptz not null default now();

-- batch_identifier ("optional batch/lot number" per the approved
-- product decision) is no longer required.
alter table public.batch_coas alter column batch_identifier drop not null;

-- test_date was already nullable; the approved product decision lists
-- it as a required field for a *published* COA (enforced by the admin
-- route's own validation before a publish transition, not by a NOT
-- NULL constraint here — a draft COA is allowed to be missing it
-- while still being edited).

alter table public.batch_coas drop column coa_file_url;

alter table public.batch_coas
  add constraint batch_coas_status_check check (status in ('draft', 'published', 'archived'));

comment on table public.batch_coas is
  'Commerce domain. No FK to compounds/claims/sources — Janoshik or other batch COAs are never citable as scientific evidence (Blueprint v2 §14). Public gallery (/coas) shows only status = ''published'' rows; upload/edit/publish/archive is admin-only (src/pages/admin/coas/*, src/pages/api/admin/coas/*).';

create trigger batch_coas_set_updated_at before update on public.batch_coas for each row execute function public.set_updated_at ();

-- ---------------------------------------------------------------------
-- RLS — the existing admin-only "for all" policy (batch_coas_all_admin,
-- 20260806144904_rls_policies.sql) is untouched: admins still get full
-- read/write on every row regardless of status. This adds a second,
-- narrower policy for the public gallery — published rows only,
-- exactly the same "status = 'published'" pattern already used for
-- compounds/claims. Postgres RLS policies are OR'd together, so an
-- admin loses nothing and a non-admin gains only published rows.
-- ---------------------------------------------------------------------
grant
select
  on public.batch_coas to anon;

create policy "batch_coas_select_published" on public.batch_coas for select to anon,
authenticated using (status = 'published');

-- ---------------------------------------------------------------------
-- Storage — coa-documents bucket. Public bucket (no signed URLs
-- needed for the gallery), but still fully governed by RLS on
-- storage.objects for both reads and writes (a Supabase "public"
-- bucket only means "readable without an Authorization header," not
-- "RLS-exempt" — the anon role's request is still evaluated against
-- these policies). storage.objects already ships with RLS enabled in
-- every Supabase project; not re-enabled here.
-- ---------------------------------------------------------------------
insert into
  storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'coa-documents',
    'coa-documents',
    true,
    10485760, -- 10 MB
    array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
  )
on conflict (id) do nothing;

-- Public (anon + authenticated) may read an object only when a
-- batch_coas row references that exact path AND is published — an
-- orphaned or draft/archived object is unreachable even though the
-- bucket itself is "public".
create policy "coa_documents_read_published" on storage.objects for select to anon,
authenticated using (
  bucket_id = 'coa-documents'
  and exists (
    select 1
    from public.batch_coas
    where
      batch_coas.file_path = storage.objects.name
      and batch_coas.status = 'published'
  )
);

-- Admin read of EVERY object regardless of status — without this,
-- coa_documents_read_published above (published-only) would leave an
-- admin unable to preview a draft/archived COA's own file from
-- /admin/coas/[id], even with their own admin JWT. Postgres RLS
-- policies are OR'd together, so this only adds visibility, it never
-- narrows the public policy above.
create policy "coa_documents_admin_read" on storage.objects for select to authenticated using (
  bucket_id = 'coa-documents'
  and public.has_min_role ('admin')
);

-- Admin-only for every write operation (upload/replace/remove) —
-- mirrors batch_coas_all_admin's own has_min_role('admin') check
-- exactly, so the same role boundary governs both the metadata row
-- and the underlying file.
create policy "coa_documents_admin_write" on storage.objects for insert to authenticated
with
  check (
    bucket_id = 'coa-documents'
    and public.has_min_role ('admin')
  );

create policy "coa_documents_admin_update" on storage.objects for update to authenticated using (
  bucket_id = 'coa-documents'
  and public.has_min_role ('admin')
)
with
  check (
    bucket_id = 'coa-documents'
    and public.has_min_role ('admin')
  );

create policy "coa_documents_admin_delete" on storage.objects for delete to authenticated using (
  bucket_id = 'coa-documents'
  and public.has_min_role ('admin')
);
