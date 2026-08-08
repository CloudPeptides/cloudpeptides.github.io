-- Phase 3 (launch-readiness) — compound_aliases provenance columns
--
-- compound_aliases previously had no way to record WHAT KIND of alternate
-- identifier a given alias is (a genuine scientific/generic name vs. a
-- development code vs. an approved-product brand name vs. a spelling
-- variant), or WHY it was added. That distinction matters directly for
-- this launch-readiness population pass: the instruction requires that
-- "brand/product names may be searchable aliases only when clearly
-- identified as product names and linked to the correct regulatory
-- context" — which needs a stored, renderable signal, not just a bare
-- string. Nullable, additive, non-destructive; every existing row (there
-- are currently zero) is unaffected.
alter table public.compound_aliases
  add column alias_type text
    check (
      alias_type is null
      or alias_type in (
        'scientific_name',
        'generic_name',
        'abbreviation',
        'development_code',
        'spelling_variant',
        'brand_name'
      )
    ),
  add column note text;

comment on column public.compound_aliases.alias_type is
  'Classifies the alias so the UI can render brand-name aliases distinctly from scientific/generic names, abbreviations, development codes, and spelling variants. Null for legacy/unclassified rows.';
comment on column public.compound_aliases.note is
  'Free-text provenance/context for the alias — e.g. which regulatory record a brand name refers to, or why a spelling variant is included. Null when no additional context is needed.';
