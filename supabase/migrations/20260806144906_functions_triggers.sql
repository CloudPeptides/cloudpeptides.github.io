-- Phase 2 — triggers: updated_at bookkeeping + content revision snapshots

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger compounds_set_updated_at before update on public.compounds for each row execute function public.set_updated_at ();

create trigger claims_set_updated_at before update on public.claims for each row execute function public.set_updated_at ();

-- Content provenance & change history (§20) — SECURITY DEFINER so it can
-- write to content_revisions regardless of the calling user's RLS grants
-- (no client role has a direct INSERT policy on that table — see
-- 20260806144904_rls_policies.sql). Captures the compound row plus its
-- current claims and regulatory records as one JSON snapshot.
--
-- Scope note: this fires on every compounds UPDATE, which covers direct
-- compound-level edits (including the ones the admin UI will make when a
-- contributor/editor saves a compound). It does NOT automatically fire
-- when only a *child* row (a claim, a source, a regulatory record)
-- changes without the parent compounds row also being touched — a full
-- cross-table cascade trigger was judged more complexity than Phase 2's
-- scope warrants. Documented here rather than silently assumed complete.
create or replace function public.record_content_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  snapshot jsonb;
begin
  select jsonb_build_object(
    'compound', to_jsonb(c),
    'claims', coalesce((
      select jsonb_agg(to_jsonb(cl))
      from public.claims cl
      where cl.compound_id = c.id
    ), '[]'::jsonb),
    'regulatory_records', coalesce((
      select jsonb_agg(to_jsonb(rr))
      from public.regulatory_records rr
      where rr.compound_id = c.id
    ), '[]'::jsonb)
  )
  into snapshot
  from public.compounds c
  where c.id = new.id;

  insert into public.content_revisions (compound_id, snapshot, editor_id)
  values (new.id, snapshot, auth.uid());

  return new;
end;
$$;

create trigger compounds_record_revision
after update on public.compounds for each row
execute function public.record_content_revision ();
