-- Batch 1 of the "Add Product / Peptide" admin workflow (2026-08-10) —
-- schema + RLS + grants only. No UI reads or writes any of this yet;
-- the live public shop (src/lib/shop-products.ts, a static file) and
-- the private admin_pricing_catalog table are both completely
-- untouched by this migration. Deliberately extends the existing
-- canonical research schema rather than inventing a second, competing
-- structure — see each section's own comment for what's reused vs new.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- entity_kind: extended, not replaced. All 56 existing compounds keep
-- their current classification untouched — explicit decision
-- (2026-08-10 in-chat) over fully replacing the enum, which would have
-- required re-classifying every existing row. Three genuinely missing
-- values added for the new product wizard's entity-type step; the
-- wizard's own UI labels map "blend" -> peptide_blend and
-- "small molecule" -> small_molecule_drug rather than introducing
-- separate near-duplicate enum values for the same concepts.
-- ---------------------------------------------------------------------
alter table public.compounds
drop constraint compounds_entity_kind_check;

alter table public.compounds
add constraint compounds_entity_kind_check check (
  entity_kind in (
    'peptide',
    'peptide_blend',
    'stack',
    'small_molecule_drug',
    'biologic',
    'supplement',
    'non_peptide_research_compound',
    'protein',
    'cosmetic_mixture',
    'other'
  )
);

-- Supports the wizard's Step 1 duplicate-compound check (fuzzy name
-- match) without adding a bespoke search table.
create index compounds_name_trgm_idx on public.compounds using gin (name gin_trgm_ops);

create index compound_aliases_alias_trgm_idx on public.compound_aliases using gin (alias gin_trgm_ops);

-- ---------------------------------------------------------------------
-- Managed product categories — replaces the hardcoded category strings
-- src/lib/shop-products.ts and admin_pricing_catalog have used until
-- now. Seeded with the three category headings already in live use so
-- existing product data (once migrated in a later, separately-approved
-- batch) has somewhere to land without inventing new category names.
-- ---------------------------------------------------------------------
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger product_categories_set_updated_at before update on public.product_categories for each row
execute function public.set_updated_at ();

insert into
  public.product_categories (name, display_order)
values
  ('Beauty + Repair', 1),
  ('Weight Loss + Metabolic', 2),
  ('Repair + Other', 3);

-- ---------------------------------------------------------------------
-- shop_products — the real commerce catalog table the Blueprint's own
-- §14 comment anticipated ("product_id -- references the shop product,
-- not a research compound", written before this table existed). One
-- row per sellable SKU/variant; compound_id is what makes "one research
-- compound -> many shop SKUs" a plain one-to-many FK rather than a new
-- junction table (GHK-Cu's compound row can have both a CU50 and a
-- CU100 shop_products row). For a blend/stack SHOP PRODUCT,
-- compound_id points at the blend/stack's OWN compound row, which in
-- turn declares its real ingredient compounds via the EXISTING
-- stack_components table (Blueprint §11) — deliberately not a second,
-- competing many-to-many between shop_products and compounds.
--
-- `spec` stays a single flexible text field (e.g. "50mg", "5mg/5mg",
-- "2000iu"), matching 100% of existing precedent in both
-- shop-products.ts and admin_pricing_catalog — a rigid separate
-- amount+unit split would break on real existing combo-product specs
-- like "5mg/5mg" that don't reduce to one amount/one unit.
--
-- No supplier-cost column, ever, matching the same rule already
-- enforced for admin_pricing_catalog.
-- ---------------------------------------------------------------------
create table public.shop_products (
  id uuid primary key default gen_random_uuid(),
  compound_id uuid references public.compounds (id) on delete set null,
  code text not null unique,
  name text not null,
  spec text not null,
  count integer not null check (count > 0),
  price numeric(10, 2) not null check (price > 0),
  category_id uuid not null references public.product_categories (id),
  -- "Internal status": the admin's own workflow state for this SKU,
  -- independent of whether it's customer-visible (that's
  -- public_status below). Prefer archived over deletion (explicit
  -- instruction) — nothing in this schema ever hard-deletes a
  -- shop_products row from the admin UI.
  internal_status text not null default 'draft' check (
    internal_status in ('draft', 'active', 'archived')
  ),
  -- Public-listing status — exactly the three values specified.
  -- Never defaults to published; a row is only ever public because an
  -- admin explicitly set it, never as a side effect of creation.
  public_status text not null default 'private' check (
    public_status in ('private', 'compliance_hold', 'published')
  ),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger shop_products_set_updated_at before update on public.shop_products for each row
execute function public.set_updated_at ();

create index shop_products_compound_id_idx on public.shop_products (compound_id);

create index shop_products_category_id_idx on public.shop_products (category_id);

-- ---------------------------------------------------------------------
-- batch_coas.product_id finally gets the real foreign key the
-- Blueprint's own §14 comment described from the start ("references
-- the shop product, not a research compound") — the column already
-- existed, nullable, with no constraint, specifically awaiting this.
-- One-to-many (a product can accumulate multiple COAs over time, e.g.
-- retested batches) rather than a single linked-COA column on
-- shop_products — more correct, and reuses the existing column instead
-- of adding a second, redundant way to represent the same
-- relationship. "Optional linked COA" in the wizard means: does this
-- product have at least one batch_coas row pointing at it.
-- ---------------------------------------------------------------------
alter table public.batch_coas
add constraint batch_coas_product_id_fkey foreign key (product_id) references public.shop_products (id) on delete set null;

create index batch_coas_product_id_idx on public.batch_coas (product_id);

-- ---------------------------------------------------------------------
-- RLS — admin-only read/write for now (same posture batch_coas and
-- admin_pricing_catalog started with). The anon published-only SELECT
-- policy below is added now so the schema is ready for the later,
-- separately-approved migration batch that wires real public pages to
-- it — it grants nothing today, since no shop_products rows exist yet
-- and no public page queries this table yet.
-- ---------------------------------------------------------------------
alter table public.product_categories enable row level security;

alter table public.product_categories force row level security;

create policy "product_categories_select_all_authenticated" on public.product_categories for select to authenticated using (true);

create policy "product_categories_insert_admin" on public.product_categories for insert to authenticated
with
  check (public.has_min_role ('admin'));

create policy "product_categories_update_admin" on public.product_categories for update to authenticated using (public.has_min_role ('admin'))
with
  check (public.has_min_role ('admin'));

create policy "product_categories_delete_admin" on public.product_categories for delete to authenticated using (public.has_min_role ('admin'));

alter table public.shop_products enable row level security;

alter table public.shop_products force row level security;

create policy "shop_products_all_admin" on public.shop_products for all to authenticated using (public.has_min_role ('admin'))
with
  check (public.has_min_role ('admin'));

create policy "shop_products_select_published" on public.shop_products for select to anon, authenticated using (public_status = 'published');

grant select on public.product_categories to authenticated;

grant insert,
update,
delete on public.product_categories to authenticated;

grant
select
,
insert,
update,
delete on public.shop_products to authenticated;

grant select on public.shop_products to anon;
