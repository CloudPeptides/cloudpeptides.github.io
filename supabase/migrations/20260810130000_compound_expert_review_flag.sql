-- Research CMS gap-fill (2026-08-10) — expert_review_flag_reason.
--
-- Previously a hardcoded, code-only list (src/lib/expert-review-flags.ts,
-- 6 fixed slug->reason entries) with no database backing and no admin
-- UI — an admin could not flag/unflag a compound or edit the reason
-- without a code change and redeploy. This makes it a real, editable
-- compound field instead. Presence of a non-null value means "flagged
-- for expert/editorial review before its content should be taken at
-- face value" — absence means not flagged, matching the hardcoded
-- list's own semantics exactly (a fixed set of slugs = flagged, every
-- other compound = not flagged).
--
-- Purely additive — nullable, all 56 existing compounds start
-- unflagged; the 6 real flags from the hardcoded list are migrated in
-- as an explicit, separate, reviewed data statement (not part of this
-- schema-only migration) so the two concerns stay auditable
-- independently.
alter table public.compounds
add column expert_review_flag_reason text;

comment on column public.compounds.expert_review_flag_reason is 'Non-null = flagged for expert/editorial review before content is taken at face value (shown as a prominent warning on the public profile). Replaces the previous hardcoded src/lib/expert-review-flags.ts list.';
