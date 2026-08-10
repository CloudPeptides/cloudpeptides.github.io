-- Research-review status (2026-08-10) — fixes a mislabeled public badge.
--
-- Root cause: every compound's public card/profile badge was rendering
-- raw identity_confidence (compounds.identity_confidence, Blueprint v2
-- §12's "Questionable-Identity Policy" — confidence in the compound's
-- NAME/IDENTITY, e.g. is this really AOD-9604 and not a distinct,
-- unconfirmed "AOD9605") whenever it wasn't 'verified'. Every one of
-- the 56 compounds in this database defaults to 'unverified' — nobody
-- has ever promoted any compound to 'verified' via an authoritative
-- identity source (§12's own gate), so the badge reads "unverified" for
-- 100% of compounds regardless of how much real enrichment/citation-
-- reconciliation work was actually done on that compound's content.
-- That's a genuinely misleading signal, but identity_confidence itself
-- is untouched by this migration — it still means exactly what it
-- always meant, and its badge still renders exactly as before for
-- every compound (never suppressed, never reinterpreted). AOD-9604
-- specifically must keep showing this badge (CLAUDE.md §12/§27.3 —
-- "never silently alias it"), as must every other compound whose
-- identity is genuinely unconfirmed.
--
-- This adds a second, independent fact: has this compound's research
-- CONTENT (claims, citations) completed the mechanical enrichment +
-- legacy-claim-reconciliation pipeline (scripts/enrichment/
-- run-enrichment.mjs, recorded in raw_import_metadata.enrichment_pilot)
-- and had that record reviewed. Additive only — the public UI shows
-- this as a separate "Research reviewed" badge alongside (never instead
-- of) the identity badge, and alongside expert_review_flag_reason's own
-- warning banner where present. A compound can be research_reviewed
-- AND still show an identity-confidence warning AND still show an
-- expert-review flag (Adamax, Lemon Bottle, Cartalax, Pinealon,
-- PE-22-29, Thymalin/Thymulin all do, by design) — none of these three
-- fields override or imply each other, and none of them is a claim
-- about scientific efficacy or safety.
alter table public.compounds
add column research_review_status text not null default 'not_reviewed'
check (
  research_review_status in ('not_reviewed', 'research_reviewed')
);

comment on column public.compounds.research_review_status is 'Whether this compound completed the mechanical enrichment + legacy-claim-reconciliation pipeline and had that record reviewed — independent of identity_confidence (name/identity confidence, Blueprint v2 §12) and expert_review_flag_reason (content-quality/safety warning). Never conflate the three; never treat "research_reviewed" as a claim about scientific efficacy, safety, or identity confirmation.';
