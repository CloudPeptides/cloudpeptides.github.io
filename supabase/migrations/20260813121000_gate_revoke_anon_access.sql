-- Mandatory researcher-account gate (2026-08-13, approved) — RLS/grant
-- lockdown. The app-level gate (src/middleware.ts) is the primary,
-- user-facing enforcement, but CLAUDE.md §8/this task's own requirement
-- ("Enforce ... server-side ... Do not rely only on client-side hiding"
-- / "An unauthenticated visitor must not be able to retrieve protected
-- content through ... Public Supabase queries") demands a second,
-- independent boundary: the `anon` Postgres role — which is exactly
-- what PUBLIC_SUPABASE_ANON_KEY grants to anyone, including a direct
-- REST call that never touches this app's own middleware at all — must
-- lose read access to every research/commerce table it could reach
-- before this migration. This migration revokes every SELECT grant to
-- `anon` added by:
--   20260806144905_grants.sql        (compounds, claims)
--   20260807120000_anon_read_supporting_tables.sql (aliases, sources,
--     studies, source_identifiers, claim_sources, regulatory_records,
--     stack_components)
--   20260808150000_commerce_coa_gallery.sql (batch_coas)
--   20260810090000_shop_products_schema.sql (shop_products)
--   20260810121000_product_categories_anon_read.sql (product_categories)
--
-- Every anon-scoped SELECT policy that made those grants meaningful is
-- either dropped (compounds/claims/shop_products/product_categories/
-- batch_coas, which get a like-for-like `authenticated`-only
-- replacement) or, for the seven Phase-3 "reachable from a published
-- compound/claim" policies, converted in place from `to anon` to
-- `to authenticated` — because `authenticated` already held the
-- necessary GRANT for those seven tables (Phase 2's broad grant) but
-- had no SELECT *policy* narrow enough for a plain 'member'/researcher
-- role to use; only the separate `_all_contributor` policies existed,
-- which require contributor+. Converting these fixes that gap: a
-- signed-in researcher (role='member') can now read exactly the same
-- published-reachable rows anon could before, and nothing anon-only
-- could not — while true anon requests get nothing at all.

-- ---------------------------------------------------------------------
-- compounds / claims
-- ---------------------------------------------------------------------
revoke select on public.compounds, public.claims from anon;

drop policy "compounds_select" on public.compounds;
create policy "compounds_select" on public.compounds for select to authenticated using (
  status = 'published'
  or public.has_min_role('contributor')
);

drop policy "claims_select" on public.claims;
create policy "claims_select" on public.claims for select to authenticated using (
  status = 'published'
  or public.has_min_role('contributor')
);

-- ---------------------------------------------------------------------
-- Supporting research tables — anon-scoped policies (Phase 3) rebuilt
-- as authenticated-scoped. No grant change needed: `authenticated`
-- already has SELECT on all seven (20260806144905_grants.sql).
-- ---------------------------------------------------------------------
revoke select on
  public.compound_aliases,
  public.stack_components,
  public.claim_sources,
  public.regulatory_records,
  public.sources,
  public.source_identifiers,
  public.studies
from anon;

drop policy "compound_aliases_select_anon" on public.compound_aliases;
create policy "compound_aliases_select_authenticated" on public.compound_aliases for select to authenticated using (
  exists (
    select 1
    from public.compounds c
    where
      c.id = compound_aliases.compound_id
      and c.status = 'published'
  )
);

drop policy "stack_components_select_anon" on public.stack_components;
create policy "stack_components_select_authenticated" on public.stack_components for select to authenticated using (
  exists (
    select 1
    from public.compounds c
    where
      c.id = stack_components.stack_id
      and c.status = 'published'
  )
);

drop policy "claim_sources_select_anon" on public.claim_sources;
create policy "claim_sources_select_authenticated" on public.claim_sources for select to authenticated using (
  exists (
    select 1
    from public.claims cl
    where
      cl.id = claim_sources.claim_id
      and cl.status = 'published'
  )
);

drop policy "regulatory_records_select_anon" on public.regulatory_records;
create policy "regulatory_records_select_authenticated" on public.regulatory_records for select to authenticated using (
  exists (
    select 1
    from public.compounds c
    where
      c.id = regulatory_records.compound_id
      and c.status = 'published'
  )
);

drop policy "sources_select_anon" on public.sources;
create policy "sources_select_authenticated" on public.sources for select to authenticated using (
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

drop policy "source_identifiers_select_anon" on public.source_identifiers;
create policy "source_identifiers_select_authenticated" on public.source_identifiers for select to authenticated using (
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

drop policy "studies_select_anon" on public.studies;
create policy "studies_select_authenticated" on public.studies for select to authenticated using (
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

-- ---------------------------------------------------------------------
-- Commerce — shop_products / product_categories / batch_coas
-- ---------------------------------------------------------------------
revoke select on public.shop_products, public.product_categories, public.batch_coas
from anon;

drop policy "shop_products_select_published" on public.shop_products;
create policy "shop_products_select_published" on public.shop_products for select to authenticated using (public_status = 'published');

drop policy "product_categories_select_anon" on public.product_categories;
-- product_categories_select_all_authenticated (20260810090000) already
-- covers every authenticated role with `using (true)` — no anon-scoped
-- replacement is needed since that pre-existing policy already grants
-- every signed-in researcher the same category-name visibility anon
-- used to have.

drop policy "batch_coas_select_published" on public.batch_coas;
create policy "batch_coas_select_published" on public.batch_coas for select to authenticated using (status = 'published');

-- ---------------------------------------------------------------------
-- coa-documents Storage bucket — was `public: true`, which means
-- Supabase's `/storage/v1/object/public/...` URL form serves the file
-- bytes to literally anyone with the path, bypassing storage.objects
-- RLS entirely (that bypass is the documented meaning of a "public"
-- bucket, not a bug) — a real hole for a gated COA gallery. Flipped to
-- private; the public gallery now generates short-lived signed URLs
-- server-side (src/lib/coas.ts's getCoaSignedUrl(), only reachable
-- from an already-gated page/session) instead of building the public
-- URL directly. Admin already used createSignedUrl() for this bucket
-- (src/pages/admin/coas/[id].astro) and is unaffected.
-- ---------------------------------------------------------------------
update storage.buckets set public = false where id = 'coa-documents';

drop policy "coa_documents_read_published" on storage.objects;
create policy "coa_documents_read_published" on storage.objects for select to authenticated using (
  bucket_id = 'coa-documents'
  and exists (
    select 1
    from public.batch_coas
    where
      batch_coas.file_path = storage.objects.name
      and batch_coas.status = 'published'
  )
);
