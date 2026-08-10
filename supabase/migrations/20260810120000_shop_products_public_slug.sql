-- Batch 4 of the "Add Product / Peptide" workflow (2026-08-10) — the
-- shop-products.ts -> shop_products migration + public-page cutover.
--
-- Gap found while planning the migration: shop_products (Batch 1) is
-- flat, one row per SKU/variant, with no concept of "these N variant
-- rows are the same public product page." The live site's URLs
-- (/shop/ghk-cu showing both the CU50 and CU100 options in one
-- dropdown) depend on exactly that grouping. compound_id was
-- deliberately NOT reused for this — it's the research link, optional
-- and frequently null for these 87 commerce-only SKUs, and conflating
-- "shares a research compound" with "shares a public product page"
-- would be wrong the first time a product without any research link
-- needed more than one variant (already true today: every multi-option
-- product in shop-products.ts has zero compound_id). product_slug is
-- the new, minimal, purpose-built grouping/URL key.
alter table public.shop_products
add column product_slug text,
add column legacy_source_id text;

-- Same pattern already enforced client/server-side for compound slugs
-- (src/lib/admin/products.ts's validateSlug) — kept identical so a
-- product_slug and a compound slug are always visually/format
-- consistent, even though they're independent identifiers.
alter table public.shop_products
add constraint shop_products_product_slug_format check (
  product_slug is null
  or product_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
);

-- Not unique — deliberately many rows share one slug (variants of the
-- same public product). Indexed because every public product-detail
-- page load and the public listing's grouping both filter/group by it.
create index shop_products_product_slug_idx on public.shop_products (product_slug);

create index shop_products_published_slug_idx on public.shop_products (product_slug)
where
  public_status = 'published';

comment on column public.shop_products.product_slug is 'Groups variant rows into one public product page/URL (/shop/<slug>). Null is valid for admin-only SKUs never intended to appear standalone on a public page.';

comment on column public.shop_products.legacy_source_id is 'Traceability only, never read by application logic: the original src/lib/shop-products.ts Product.id this row was migrated from, for the 87 Batch-4-migrated rows. Null for every product created via the admin wizard.';

-- ---------------------------------------------------------------------
-- create_product_with_research(): add p_product_slug, applied to every
-- variant created in that one wizard submission (one wizard save = one
-- public product identity, however many mg-option variants). Signature
-- change, so the old 5-arg overload is dropped explicitly rather than
-- left behind as a dead overload.
-- ---------------------------------------------------------------------
drop function if exists public.create_product_with_research (uuid, uuid, jsonb, uuid[], jsonb);

create function public.create_product_with_research (
  p_actor_user_id uuid,
  p_compound_id uuid,
  p_new_compound jsonb,
  p_stack_component_ids uuid[],
  p_variants jsonb,
  p_product_slug text default null
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

  if p_product_slug is not null and p_product_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Invalid product slug format';
  end if;

  if p_compound_id is not null then
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
      internal_status, public_status, created_by, product_slug
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
      p_actor_user_id,
      p_product_slug
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

grant
execute on function public.create_product_with_research (
  uuid,
  uuid,
  jsonb,
  uuid[],
  jsonb,
  text
) to authenticated;
