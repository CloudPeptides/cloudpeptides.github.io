-- Admin push notifications (2026-08-19, approved) — subscription storage.
--
-- Deliberately admin-only and deliberately narrow RLS: a subscription
-- row IS a push credential (endpoint + encryption keys), so this table
-- gets the same "nobody but the owner reads it, not even another
-- admin" treatment researcher_attestations gives certification history
-- — except here there is no admin-bypass SELECT at all, by design (see
-- the policy comment below): "ordinary administrators cannot
-- unnecessarily inspect another administrator's full push credentials"
-- is satisfied by construction, not by column redaction.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

comment on table public.push_subscriptions is
  'One row per registered admin device (Web Push subscription). endpoint/p256dh/auth_key are push credentials, not just metadata — RLS restricts every operation to the owning user only, with no admin-bypass SELECT, so no admin can inspect another admin''s subscription keys. Registration itself is additionally gated to has_min_role(''admin'') so a plain researcher account can never create a row here even for their own user_id.';

alter table public.push_subscriptions enable row level security;
alter table public.push_subscriptions force row level security;

create policy "push_subscriptions_select_own" on public.push_subscriptions for select to authenticated using (
  user_id = auth.uid()
  and public.has_min_role('admin')
);

create policy "push_subscriptions_insert_own" on public.push_subscriptions for insert to authenticated
with
  check (
    user_id = auth.uid()
    and public.has_min_role('admin')
  );

create policy "push_subscriptions_update_own" on public.push_subscriptions for
update to authenticated using (
  user_id = auth.uid()
  and public.has_min_role('admin')
)
with
  check (
    user_id = auth.uid()
    and public.has_min_role('admin')
  );

create policy "push_subscriptions_delete_own" on public.push_subscriptions for delete to authenticated using (
  user_id = auth.uid()
  and public.has_min_role('admin')
);

grant
select
,
insert,
update, delete on public.push_subscriptions to authenticated;

-- Server-side send/cleanup (src/lib/push.ts) uses the service-role
-- client to read subscriptions across ALL admins (to fan out a single
-- event) and to delete expired ones — neither operation is a
-- researcher- or admin-initiated client action, so no RLS policy is
-- meant to allow it; service-role bypasses RLS entirely, same pattern
-- as every other narrowly-scoped service-role route in this codebase.

-- ---------------------------------------------------------------------
-- push_events — idempotent, append-mostly delivery log. One row per
-- logical event (a researcher registration, an order request, or an
-- admin-initiated test send); fan-out to N subscriptions happens inside
-- src/lib/push.ts, not as N separate event rows.
-- ---------------------------------------------------------------------
create table public.push_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (
    event_type in ('researcher_registered', 'order_request_created', 'test')
  ),
  source_table text,
  source_id uuid,
  -- Enforces "retries must not create duplicate notifications": the
  -- caller derives this deterministically from the source event (e.g.
  -- 'researcher_registered:<user_id>', 'order_request_created:<request_id>')
  -- and inserts with ON CONFLICT (idempotency_key) DO NOTHING — a retry
  -- of the same underlying action can never produce a second push.
  idempotency_key text not null unique,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'partial', 'failed')),
  attempts int not null default 0,
  last_error text,
  last_error_category text check (
    last_error_category is null
    or last_error_category in (
      'expired_subscription',
      'network',
      'auth',
      'rate_limited',
      'payload_too_large',
      'unknown'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz
);

comment on table public.push_events is
  'Idempotent delivery log for admin push notifications. idempotency_key''s unique constraint is the actual duplicate-prevention mechanism (not application-level checking alone) — a second insert attempt for the same underlying event is a no-op via ON CONFLICT DO NOTHING.';

create index push_events_status_idx on public.push_events (status, created_at);

alter table public.push_events enable row level security;
alter table public.push_events force row level security;

-- Admin may read the delivery log (troubleshooting "did my test
-- notification send"); nothing here is a push credential, so the
-- narrow ownership restriction push_subscriptions needs doesn't apply.
-- No insert/update/delete policy for any client role — every write
-- happens server-side via the service-role client in src/lib/push.ts,
-- immediately after (never before, and never rolling back) the
-- underlying researcher/order-request insert that triggered it.
create policy "push_events_select_admin" on public.push_events for select to authenticated using (public.has_min_role('admin'));

grant select on public.push_events to authenticated;
