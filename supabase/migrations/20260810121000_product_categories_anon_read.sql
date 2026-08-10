-- Batch 4 follow-up (2026-08-10) — found while wiring the real public
-- shop pages: product_categories was only ever granted SELECT to
-- `authenticated` (20260810090000_shop_products_schema.sql), so an
-- anon-key public page embedding product_categories(name) alongside a
-- published shop_products row silently got null back for the category
-- (RLS blocked the join, not an error — just missing data). Category
-- names ("Beauty + Repair", etc.) carry no sensitive/private
-- information, unlike prices or internal-status fields, so a blanket
-- anon-readable policy is the correct fix, not a narrower published-
-- only one (there's no publish/private concept for a category itself).
create policy "product_categories_select_anon" on public.product_categories for select to anon using (true);

grant select on public.product_categories to anon;
