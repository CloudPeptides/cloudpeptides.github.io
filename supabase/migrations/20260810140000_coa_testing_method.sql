-- COA testing-method field (2026-08-10)
--
-- Adds a nullable, dedicated column for the analytical method stated on
-- a COA report (e.g. "HPLC", "LC-MS") — previously not captured
-- anywhere in the schema. Distinct from purity_result (a measured
-- value) and from notes (free-text, publicly displayed verification
-- copy — see src/pages/coas.astro) — this is structured metadata about
-- how the test was performed, present on some reports and absent on
-- others, so it must stay independently nullable rather than being
-- inferred, defaulted, or extracted from notes.
--
-- No RLS change needed: batch_coas_select_published (anon/authenticated,
-- published rows only) and batch_coas_all_admin (authenticated admin,
-- every row) are row-level policies already covering every column,
-- including this new one, and `grant select ... to anon` from the
-- original COA gallery migration (20260808150000) is table-level, so it
-- already extends to this column with no further grant.
alter table public.batch_coas
add column testing_method text;

comment on column public.batch_coas.testing_method is 'Analytical method stated on the COA report (e.g. "HPLC", "LC-MS"), in the report''s own wording. Null when the report does not state one — never inferred or guessed.';
