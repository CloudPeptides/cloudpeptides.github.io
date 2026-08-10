-- Private, admin-only, editable pricing catalog — supersedes the
-- static src/lib/admin/pricing-catalog.ts array with real persistent
-- storage now that prices must be independently editable from the
-- admin dashboard, not just displayed.
--
-- Deliberately NOT the public shop catalog (src/lib/shop-products.ts,
-- a static file, live on production, driving the real cart/checkout).
-- This table has no public read path at all — no grant to anon, no
-- RLS policy for anon/authenticated-non-admin, never referenced by
-- any public page or API. Structurally separate from both the
-- research schema and the public-facing commerce tables (CLAUDE.md
-- §7), consistent with batch_coas' own admin-only starting posture.
--
-- Supplier cost is never stored here — no cost column exists, and
-- none should ever be added (tests/unit/pricing-catalog.test.ts
-- guards this at the application layer for every row this table
-- returns).
create table public.admin_pricing_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  spec text not null,
  count integer not null check (count > 0),
  category text not null check (
    category in ('Beauty + Repair', 'Weight Loss + Metabolic', 'Repair + Other')
  ),
  price numeric(10, 2) not null check (price > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_pricing_catalog is
  'Private, staging-only internal pricing reference. Admin-only read and write. Never the public shop catalog, never exposes supplier cost.';

create trigger admin_pricing_catalog_set_updated_at
before update on public.admin_pricing_catalog
for each row
execute function public.set_updated_at ();

alter table public.admin_pricing_catalog enable row level security;

alter table public.admin_pricing_catalog force row level security;

-- Admin-only for every operation — stricter than batch_coas (which at
-- least allows anon to read *published* rows); this table has no
-- concept of "published," it is private end to end.
create policy "admin_pricing_catalog_all_admin" on public.admin_pricing_catalog for all to authenticated using (public.has_min_role('admin'))
with
  check (public.has_min_role('admin'));

grant
select
,
insert,
update,
delete on public.admin_pricing_catalog to authenticated;

-- Seed: the 87 rows already reviewed and approved in-chat (dry-run
-- report + explicit approval, 2026-08-08), each price = supplier cost
-- + $45 — the source table's COST column and its original $35-margin
-- PRICE column are not present here or anywhere else in this
-- codebase, only the final approved customer price. After this seed,
-- prices are independently admin-editable and are never
-- auto-recalculated from cost again.
insert into
  public.admin_pricing_catalog (code, name, spec, count, category, price)
values
  ('CU50', 'GHK-CU', '50mg', 10, 'Beauty + Repair', 77.00),
  ('CU100', 'GHK-CU', '100mg', 10, 'Beauty + Repair', 105.00),
  ('AU50', 'AHK-CU', '50mg', 10, 'Beauty + Repair', 85.00),
  ('BC5', 'BPC', '5mg', 10, 'Beauty + Repair', 85.00),
  ('BC10', 'BPC', '10mg', 10, 'Beauty + Repair', 120.00),
  ('NJ500', 'NAD+', '500mg', 10, 'Beauty + Repair', 115.00),
  ('NJ1000', 'NAD+', '1000mg', 10, 'Beauty + Repair', 140.00),
  ('TB5', 'TB500', '5mg', 10, 'Beauty + Repair', 135.00),
  ('TB10', 'TB500', '10mg', 10, 'Beauty + Repair', 195.00),
  ('BB10', 'BPC + TB', '5mg/5mg', 10, 'Beauty + Repair', 160.00),
  ('BB20', 'BPC + TB', '10mg/10mg', 10, 'Beauty + Repair', 235.00),
  ('BB30', 'BPC + TB', '15mg/15mg', 10, 'Beauty + Repair', 325.00),
  ('GLOW', 'GLOW', '70mg', 10, 'Beauty + Repair', 215.00),
  ('KLOW', 'KLOW', '80mg', 10, 'Beauty + Repair', 225.00),
  ('KP5', 'KPV', '5mg', 10, 'Beauty + Repair', 90.00),
  ('KP10', 'KPV', '10mg', 10, 'Beauty + Repair', 105.00),
  ('ET10', 'Epithalon', '10mg', 10, 'Beauty + Repair', 90.00),
  ('ET50', 'Epithalon', '50mg', 10, 'Beauty + Repair', 195.00),
  ('MT10', 'MT-1', '10mg', 10, 'Beauty + Repair', 110.00),
  ('ML10', 'MT-2', '10mg', 10, 'Beauty + Repair', 110.00),
  ('GTT600', 'Glutathione', '600mg', 10, 'Beauty + Repair', 115.00),
  ('GTT1500', 'Glutathione', '1500mg', 10, 'Beauty + Repair', 135.00),
  ('SM10', 'Semaglutide', '10mg', 10, 'Weight Loss + Metabolic', 100.00),
  ('SM20', 'Semaglutide', '20mg', 10, 'Weight Loss + Metabolic', 140.00),
  ('TR10', 'Tirz', '10mg', 10, 'Weight Loss + Metabolic', 105.00),
  ('TR15', 'Tirz', '15mg', 10, 'Weight Loss + Metabolic', 115.00),
  ('TR20', 'Tirz', '20mg', 10, 'Weight Loss + Metabolic', 140.00),
  ('TR30', 'Tirz', '30mg', 10, 'Weight Loss + Metabolic', 175.00),
  ('TR40', 'Tirz', '40mg', 10, 'Weight Loss + Metabolic', 210.00),
  ('TR60', 'Tirz', '60mg', 10, 'Weight Loss + Metabolic', 275.00),
  ('RT5', 'Reta', '5mg', 10, 'Weight Loss + Metabolic', 125.00),
  ('RT10', 'Reta', '10mg', 10, 'Weight Loss + Metabolic', 165.00),
  ('RT15', 'Reta', '15mg', 10, 'Weight Loss + Metabolic', 185.00),
  ('RT20', 'Reta', '20mg', 10, 'Weight Loss + Metabolic', 225.00),
  ('RT30', 'Reta', '30mg', 10, 'Weight Loss + Metabolic', 245.00),
  ('RT40', 'Reta', '40mg', 10, 'Weight Loss + Metabolic', 275.00),
  ('RT60', 'Reta', '60mg', 10, 'Weight Loss + Metabolic', 335.00),
  ('MS10', 'MOTS-C', '10mg', 10, 'Weight Loss + Metabolic', 120.00),
  ('MS20', 'MOTS-C', '20mg', 10, 'Weight Loss + Metabolic', 180.00),
  ('MS40', 'MOTS-C', '40mg', 10, 'Weight Loss + Metabolic', 265.00),
  ('TSM5', 'Tesa', '5mg', 10, 'Weight Loss + Metabolic', 145.00),
  ('TSM10', 'Tesa', '10mg', 10, 'Weight Loss + Metabolic', 215.00),
  ('TSM20', 'Tesa', '20mg', 10, 'Weight Loss + Metabolic', 345.00),
  ('IP5', 'Ipamorelin', '5mg', 10, 'Weight Loss + Metabolic', 84.00),
  ('IP10', 'Ipamorelin', '10mg', 10, 'Weight Loss + Metabolic', 110.00),
  ('10AM', '5-Amino-1MQ', '10mg', 10, 'Weight Loss + Metabolic', 90.00),
  ('50AM', '5-Amino-1MQ', '50mg', 10, 'Weight Loss + Metabolic', 130.00),
  ('IF1', 'IGF-1 LR3', '1mg', 10, 'Weight Loss + Metabolic', 275.00),
  ('CND5', 'CJC no DAC', '5mg', 10, 'Weight Loss + Metabolic', 135.00),
  ('CND10', 'CJC no DAC', '10mg', 10, 'Weight Loss + Metabolic', 185.00),
  ('CP10', 'CJC no DAC + IPA', '10mg', 10, 'Weight Loss + Metabolic', 155.00),
  ('5AD', 'AOD9604', '5mg', 10, 'Weight Loss + Metabolic', 145.00),
  ('10AD', 'AOD9605', '10mg', 10, 'Weight Loss + Metabolic', 210.00),
  ('CGL5', 'Cagrilintide', '5mg', 10, 'Weight Loss + Metabolic', 175.00),
  ('CGL10', 'Cagrilintide', '10mg', 10, 'Weight Loss + Metabolic', 240.00),
  ('SML5', 'Sermorelin', '5mg', 10, 'Weight Loss + Metabolic', 120.00),
  ('SML10', 'Sermorelin', '10mg', 10, 'Weight Loss + Metabolic', 190.00),
  ('LEM', 'Lemon Bottle', '10ml', 10, 'Weight Loss + Metabolic', 110.00),
  ('AR100', 'Aicar', '100mg', 10, 'Weight Loss + Metabolic', 160.00),
  ('ARA10', 'ARA290', '10mg', 10, 'Repair + Other', 115.00),
  ('DS5', 'DSIP', '5mg', 10, 'Repair + Other', 90.00),
  ('DS10', 'DSIP', '10mg', 10, 'Repair + Other', 120.00),
  ('G2K', 'HCG', '2000iu', 10, 'Repair + Other', 90.00),
  ('G5K', 'HCG', '5000iu', 10, 'Repair + Other', 125.00),
  ('G10K', 'HCG', '10000iu', 10, 'Repair + Other', 185.00),
  ('KS5', 'Kisspeptin-10', '5mg', 10, 'Repair + Other', 95.00),
  ('KS10', 'Kisspeptin-10', '10mg', 10, 'Repair + Other', 125.00),
  ('P41', 'PT141', '10mg', 10, 'Repair + Other', 105.00),
  ('SK5', 'Selank', '5mg', 10, 'Repair + Other', 90.00),
  ('SK10', 'Selank', '10mg', 10, 'Repair + Other', 115.00),
  ('SX5', 'Semax', '5mg', 10, 'Repair + Other', 90.00),
  ('SX10', 'Semax', '10mg', 10, 'Repair + Other', 115.00),
  ('2S10', 'SS-31', '10mg', 10, 'Repair + Other', 145.00),
  ('2S50', 'SS-31', '50mg', 10, 'Repair + Other', 365.00),
  ('TA5', 'Thymosin Alpha 1', '5mg', 10, 'Repair + Other', 150.00),
  ('TA10', 'Thymosin Alpha 1', '10mg', 10, 'Repair + Other', 210.00),
  ('ADA5', 'Adamax', '5mg', 10, 'Repair + Other', 135.00),
  ('ADA10', 'Adamax', '10mg', 10, 'Repair + Other', 180.00),
  ('XT100', 'Botulinum Toxin', '100iu', 1, 'Repair + Other', 135.00),
  ('Pin10', 'Pinealon', '10mg', 10, 'Repair + Other', 105.00),
  ('OT5', 'Oxytocin Acetate', '5mg', 10, 'Repair + Other', 90.00),
  ('OT10', 'Oxytocin Acetate', '10mg', 10, 'Repair + Other', 115.00),
  ('PE-5', 'PE-22-28', '5mg', 10, 'Repair + Other', 95.00),
  ('PE-10', 'PE-22-29', '10mg', 10, 'Repair + Other', 125.00),
  ('TY10', 'Thymalin/Thymulin', '10mg', 10, 'Repair + Other', 109.00),
  ('Cart20', 'Cartalax', '20mg', 10, 'Repair + Other', 145.00),
  ('CBL60', 'Cerebrolysin', '60mg', 10, 'Repair + Other', 115.00);
