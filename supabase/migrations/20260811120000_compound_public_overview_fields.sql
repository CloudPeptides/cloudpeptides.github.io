-- Plain-language public overview fields (2026-08-11).
--
-- Adds the editable content behind the new "What it is / Why people look
-- it up / What the research actually shows / Bottom line" introduction
-- required at the top of every public compound profile. Lives in
-- Supabase (admin-editable via src/pages/admin/compounds/[id].astro,
-- the same generic audit-logged mutation path as every other compound
-- field — src/lib/admin/mutations.ts's TABLE_REGISTRY) rather than being
-- hardcoded in the Astro template, so an editorial save immediately
-- reflects on the public page with no deploy.
--
-- All four text fields and the search-date field are nullable: a
-- compound with nothing written yet renders no overview section rather
-- than empty boxes. This is purely additive — no existing column is
-- touched, no row's evidence_quality/interpretation_status/claims are
-- affected. Population of these fields for the 56 existing compounds is
-- a separate editorial content pass (bulk-authored from already-cited
-- claims/sources, then reviewed via the existing draft/in_review/
-- published workflow — not a mechanical migration default).
alter table public.compounds
add column overview_what_it_is text,
add column overview_why_people_use_it text,
add column overview_research_summary text,
add column overview_bottom_line text,
add column overview_evidence_reviewed_date date;

comment on column public.compounds.overview_what_it_is is 'Plain-language: what kind of substance this is (peptide, hormone, small molecule, blend/stack, approved-drug ingredient, etc). Public-facing, admin-editable, never auto-derived.';
comment on column public.compounds.overview_why_people_use_it is 'Plain-language: uses/benefits commonly claimed, marketed, or investigated for this compound. Framed as "commonly claimed" / "marketed for" / "investigated for," never as an established benefit.';
comment on column public.compounds.overview_research_summary is 'Plain-language synthesis distinguishing established/approved uses, human research, animal/preclinical research, mechanistic/lab research, and unsupported or anecdotal claims. Must stay consistent with the compound''s claim-level evidence_quality/interpretation_status — never a stronger or weaker signal than what the cited claims actually support.';
comment on column public.compounds.overview_bottom_line is 'Short neutral summary of how much reliable evidence currently exists for this compound. Not a safety or efficacy verdict.';
comment on column public.compounds.overview_evidence_reviewed_date is 'Date the overview text above was last checked against the current evidence search — powers wording like "as of [date]" when human evidence is absent. Distinct from claims.date_accessed (per-citation) and last_reviewed_at (editorial-review timestamp).';
