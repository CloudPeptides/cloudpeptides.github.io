-- Administration-context field (2026-08-11).
--
-- Adds the plain-language, admin-editable "Administration context"
-- section required near the top of every public compound profile,
-- alongside the existing overview_* fields (see
-- 20260811120000_compound_public_overview_fields.sql). Descriptive
-- research context only — deliberately does NOT cover doses,
-- reconstitution, needle sizes, schedules, or any usage instruction
-- (CLAUDE.md §6: "Published study doses may appear only as clearly
-- contextualized study data, never as usage instructions").
--
-- Content is expected to distinguish, per compound: how it's given in
-- any approved medical product; which routes were actually used in the
-- human studies cited on this page; which routes appear only in animal/
-- lab research; which routes (e.g. subcutaneous/intramuscular
-- injection) are commonly marketed/discussed but NOT supported by the
-- human evidence actually cited; and how established/limited/absent
-- evidence is for that specific route. Never inferred from "sold in a
-- vial" — grounded only in what the cited sources actually report.
alter table public.compounds
add column administration_context text,
add column administration_context_reviewed_date date;

comment on column public.compounds.administration_context is 'Plain-language "Administration context" section: how the compound is given in any approved product, which routes are actually used in the human/animal studies cited on this page, and which commonly-marketed routes (e.g. subcutaneous injection) lack supporting human evidence. Descriptive research context only — never doses, reconstitution, needle sizes, schedules, or usage instructions. Public-facing, admin-editable, never auto-derived from "sold as an injectable" alone.';
comment on column public.compounds.administration_context_reviewed_date is 'Date the administration-context text above was last checked against the current route-specific evidence — mirrors overview_evidence_reviewed_date but tracked independently since a compound''s route evidence can change on its own schedule.';
