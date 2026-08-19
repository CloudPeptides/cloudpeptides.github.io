-- Order requests, persisted for the first time (2026-08-19, approved).
--
-- src/pages/api/checkout.ts has never written an order anywhere but a
-- Resend email (see that file's own long-standing header comment,
-- unchanged until this migration): "no separate `orders` database
-- table exists... has never persisted orders anywhere but that inbox."
-- This is therefore a genuinely new canonical store, not a second
-- table competing with an existing one — confirmed by inspecting
-- checkout.ts, shop_products, admin_pricing_catalog, and batch_coas
-- before writing this migration; none of them store order requests.
--
-- Deliberately three tables, mirroring researcher_profiles/
-- researcher_attestations' own split:
--  - order_requests: one row per submission, admin-editable status.
--  - order_request_items: append-only price-snapshot line items (never
--    updated after insert — a later price change on shop_products must
--    never retroactively alter what a customer was actually shown).
--  - order_request_status_history: append-only, mirrors
--    researcher_attestations' "no update/delete policy for any role"
--    pattern exactly.
create table public.order_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  -- The submitting researcher's own account — checkout.ts runs behind
  -- the site-wide auth gate (src/middleware.ts), so Astro.locals.session
  -- is always present when this insert happens. `on delete set null`
  -- (not cascade): a real order request is a business record that must
  -- survive even if the account is later removed from auth.users.
  researcher_user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_line1 text not null,
  shipping_line2 text,
  shipping_city text not null,
  shipping_region text not null,
  shipping_postal_code text not null,
  shipping_country text not null,
  subtotal numeric(10, 2) not null,
  shipping_cost numeric(10, 2) not null,
  total numeric(10, 2) not null,
  customer_notes text,
  status text not null default 'new' check (
    status in ('new', 'reviewing', 'contacted', 'approved', 'declined', 'completed', 'cancelled')
  ),
  -- Mirrors checkout.ts's existing isTestOrder flag (src/lib/site-env.ts's
  -- isIndexableHost()) — a staging/local submission is recorded as a
  -- real row (so the admin UI/tests actually have something to show)
  -- but is unmistakably labeled, same as the existing "[TEST]" email
  -- subject prefix.
  is_test_order boolean not null default false,
  admin_email_sent boolean not null default false,
  customer_email_sent boolean not null default false,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.order_requests is
  'Canonical order-request storage — the first time these have been persisted anywhere but the notification email (see this migration''s own header comment for the "no competing second table" verification). No checkout/payment processing; this is still a request, reviewed and actioned manually, exactly as before.';

create trigger order_requests_set_updated_at before update on public.order_requests for each row
execute function public.set_updated_at ();

create index order_requests_status_idx on public.order_requests (status, submitted_at desc);

create index order_requests_researcher_user_id_idx on public.order_requests (researcher_user_id);

create table public.order_request_items (
  id uuid primary key default gen_random_uuid(),
  order_request_id uuid not null references public.order_requests (id) on delete cascade,
  -- Denormalized on purpose — "price snapshots" per the task's own
  -- wording, not a live join to shop_products. A later price/name
  -- change on the product must never retroactively rewrite what a
  -- customer actually saw and was quoted at submission time. Product
  -- names here are always the shop-facing rebrand (CP-S1/CP-T2/CP-R3
  -- etc.) — never the separate scientific research-profile names,
  -- same separation checkout.ts's own catalog lookup already enforces.
  product_name text not null,
  product_spec text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

comment on table public.order_request_items is
  'Append-only price-snapshot line items — never updated after insert. No FK to shop_products deliberately: this is what the customer was actually shown/quoted, not a live reference that could drift if the product record later changes.';

create index order_request_items_order_request_id_idx on public.order_request_items (order_request_id);

create table public.order_request_status_history (
  id uuid primary key default gen_random_uuid(),
  order_request_id uuid not null references public.order_requests (id) on delete cascade,
  previous_status text,
  new_status text not null,
  changed_by uuid references auth.users (id),
  changed_at timestamptz not null default now(),
  note text
);

comment on table public.order_request_status_history is
  'Append-only, same pattern as researcher_attestations: no update/delete policy for any role, including admin. One row per status change, always recording who/when/from/to.';

create index order_request_status_history_order_request_id_idx on public.order_request_status_history (order_request_id, changed_at desc);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.order_requests enable row level security;
alter table public.order_requests force row level security;
alter table public.order_request_items enable row level security;
alter table public.order_request_items force row level security;
alter table public.order_request_status_history enable row level security;
alter table public.order_request_status_history force row level security;

-- Admin-only read — order requests carry real customer PII (name,
-- email, phone, shipping address), not editorial content; no
-- researcher self-service "my orders" view exists in this pass (not
-- part of the approved scope), so there is no owner-read policy here
-- at all, deliberately, unlike researcher_profiles/researcher_attestations.
create policy "order_requests_select_admin" on public.order_requests for select to authenticated using (public.has_min_role('admin'));

-- The submitting researcher's own insert, at submission time — RLS is
-- the real boundary checkout.ts relies on (createUserScopedClient with
-- the caller's own JWT, never the service-role client, matching this
-- codebase's overwhelming preference for RLS-enforced writes).
create policy "order_requests_insert_own" on public.order_requests for insert to authenticated
with
  check (researcher_user_id = auth.uid());

-- Status changes are admin-only; src/pages/api/admin/order-requests/
-- [id]/status.ts additionally re-fetches the row server-side before
-- writing to compute a trustworthy previous_status for the history
-- row below, rather than accepting one from the client.
create policy "order_requests_update_admin" on public.order_requests for
update to authenticated using (public.has_min_role('admin'))
with
  check (public.has_min_role('admin'));

-- No delete policy for any role — order requests are permanent
-- business records once created.

create policy "order_request_items_select_admin" on public.order_request_items for select to authenticated using (public.has_min_role('admin'));

-- Insert is allowed only alongside a parent row the caller themselves
-- just created (the subquery re-checks ownership, not just existence —
-- a researcher cannot attach line items to someone else's request).
create policy "order_request_items_insert_own" on public.order_request_items for insert to authenticated
with
  check (
    exists (
      select 1
      from public.order_requests r
      where
        r.id = order_request_id
        and r.researcher_user_id = auth.uid()
    )
  );

-- No update/delete policy for any role — a price-snapshot line item is
-- immutable once created.

create policy "order_request_status_history_select_admin" on public.order_request_status_history for select to authenticated using (public.has_min_role('admin'));

create policy "order_request_status_history_insert_admin" on public.order_request_status_history for insert to authenticated
with
  check (
    public.has_min_role('admin')
    and changed_by = auth.uid()
  );

-- No update/delete policy for any role — append-only, same as
-- researcher_attestations.

grant
select
,
insert,
update on public.order_requests to authenticated;

grant
select
,
insert on public.order_request_items to authenticated;

grant
select
,
insert on public.order_request_status_history to authenticated;
