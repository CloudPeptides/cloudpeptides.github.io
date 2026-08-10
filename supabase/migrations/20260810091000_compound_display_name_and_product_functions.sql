-- Batch 1 addendum: compounds.display_name (Step 1 of the new product
-- wizard asks for a canonical name and a display name as two separate
-- fields; compounds only had one `name` column). Purely additive —
-- nullable, all 56 existing rows are unaffected and simply have no
-- display_name yet (falls back to `name` wherever rendered). `name`
-- keeps its existing meaning (the canonical name) so nothing that
-- already reads `compounds.name` needs to change.
alter table public.compounds
add column display_name text;

-- ---------------------------------------------------------------------
-- Transactional "create product + research" save (wizard Step 6).
-- SECURITY DEFINER so it can perform the full multi-table write in one
-- Postgres transaction regardless of the calling role's own per-table
-- grants — but re-checks admin authorization itself as the very first
-- thing, exactly like this project's other SECURITY DEFINER functions
-- (see record_content_revision in 20260806144906_functions_triggers.sql
-- for the established pattern). A failure at any point rolls back
-- everything — compound creation, aliases, stack components, and every
-- variant row — automatically, because it's one function body running
-- in one transaction; there is no partial-success path.
--
-- Never fabricates research content: a newly created compound is
-- always inserted with status='draft' here, never anything else, and
-- carries only the name/slug/entity_kind/aliases the admin actually
-- typed — no claims, sources, studies, or regulatory rows are ever
-- created by this function.
-- ---------------------------------------------------------------------
create or replace function public.create_product_with_research (
  p_actor_user_id uuid,
  p_compound_id uuid, -- non-null: link to this existing compound
  p_new_compound jsonb, -- non-null (when p_compound_id is null): {canonical_name, display_name, slug, entity_kind, aliases: [text,...]}
  p_stack_component_ids uuid[], -- component compound ids for a blend/stack; empty/null otherwise
  p_variants jsonb -- array of {code, name, spec, count, price, category_id, internal_status, public_status}
) returns jsonb language plpgsql security definer
set
  search_path = '' as $$
declare
  v_compound_id uuid;
  v_variant jsonb;
  v_created_product_ids uuid[] := '{}';
  v_new_product_id uuid;
  v_variant_count int;
begin
  if not public.has_min_role('admin') then
    raise exception 'Admin access required';
  end if;

  if p_compound_id is null and p_new_compound is null then
    raise exception 'Either an existing compound id or new-compound data is required';
  end if;

  v_variant_count := coalesce(jsonb_array_length(p_variants), 0);
  if v_variant_count = 0 then
    raise exception 'At least one shop product variant is required';
  end if;

  if p_compound_id is not null then
    -- Confirm it actually exists — an FK violation later would roll
    -- back anyway, but this gives a clearer error message.
    perform 1 from public.compounds where id = p_compound_id;
    if not found then
      raise exception 'Linked compound % does not exist', p_compound_id;
    end if;
    v_compound_id := p_compound_id;
  else
    insert into public.compounds (
      slug, name, display_name, entity_kind, status
    )
    values (
      p_new_compound->>'slug',
      p_new_compound->>'canonical_name',
      nullif(p_new_compound->>'display_name', ''),
      p_new_compound->>'entity_kind',
      'draft'
    )
    returning id into v_compound_id;

    if jsonb_typeof(p_new_compound->'aliases') = 'array' then
      insert into public.compound_aliases (compound_id, alias)
      select v_compound_id, alias_text
      from jsonb_array_elements_text(p_new_compound->'aliases') as alias_text
      where trim(alias_text) <> '';
    end if;
  end if;

  if p_stack_component_ids is not null and array_length(p_stack_component_ids, 1) > 0 then
    insert into public.stack_components (stack_id, component_compound_id)
    select v_compound_id, component_id
    from unnest(p_stack_component_ids) as component_id
    on conflict do nothing;
  end if;

  for v_variant in select * from jsonb_array_elements(p_variants)
  loop
    insert into public.shop_products (
      compound_id, code, name, spec, count, price, category_id,
      internal_status, public_status, created_by
    )
    values (
      v_compound_id,
      v_variant->>'code',
      v_variant->>'name',
      v_variant->>'spec',
      (v_variant->>'count')::int,
      (v_variant->>'price')::numeric,
      (v_variant->>'category_id')::uuid,
      coalesce(nullif(v_variant->>'internal_status', ''), 'draft'),
      coalesce(nullif(v_variant->>'public_status', ''), 'private'),
      p_actor_user_id
    )
    returning id into v_new_product_id;
    v_created_product_ids := array_append(v_created_product_ids, v_new_product_id);
  end loop;

  return jsonb_build_object(
    'compound_id', v_compound_id,
    'product_ids', to_jsonb(v_created_product_ids)
  );
end;
$$;

-- No direct table grants are needed for this function's own INSERTs —
-- SECURITY DEFINER runs as the function owner — but EXECUTE must be
-- granted explicitly, and only to authenticated (the function's own
-- has_min_role('admin') check is the real gate; this is just "can you
-- call it at all").
grant
execute on function public.create_product_with_research (
  uuid,
  uuid,
  jsonb,
  uuid[],
  jsonb
) to authenticated;
