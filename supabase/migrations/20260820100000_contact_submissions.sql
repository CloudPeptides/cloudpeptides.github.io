-- Contact-form submissions, persisted for the first time (2026-08-20,
-- approved). src/pages/api/contact.ts previously only emailed
-- info.order.thecloud@proton.me via Resend and stored nothing — the
-- same "no competing second table" gap order_requests closed on
-- 2026-08-19 (see that migration's own header comment), now closed
-- here too. Email notification is retired entirely for this form (by
-- explicit decision): the admin dashboard + push notification
-- (src/lib/push.ts's new notifyNewContactSubmission) are now the only
-- delivery channel for "a message arrived", and admins reply from
-- inside the dashboard (src/pages/api/admin/contact-submissions/[id]/reply.ts)
-- rather than from their own inbox.
--
-- Two tables, mirroring order_requests/order_request_status_history's
-- own split:
--  - contact_submissions: one row per submission, admin-editable status.
--  - contact_submission_replies: append-only — every reply an admin
--    sends is a permanent record, never edited/deleted after the fact.
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  -- The submitting researcher's own account — src/pages/api/contact.ts
  -- runs behind the site-wide auth gate (src/middleware.ts), so
  -- Astro.locals.session is always present when this insert happens,
  -- exactly like order_requests.researcher_user_id. `on delete set
  -- null` (not cascade): a real message is a record that must survive
  -- even if the account is later removed from auth.users.
  researcher_user_id uuid references auth.users (id) on delete set null,
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.contact_submissions is
  'Canonical contact-form storage — replaces the previous email-only delivery (info.order.thecloud@proton.me via Resend) entirely. Admins read and reply from the dashboard; contact_submission_replies is the outbound side.';

create trigger contact_submissions_set_updated_at before update on public.contact_submissions for each row
execute function public.set_updated_at ();

create index contact_submissions_status_idx on public.contact_submissions (status, created_at desc);

create index contact_submissions_researcher_user_id_idx on public.contact_submissions (researcher_user_id);

create table public.contact_submission_replies (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.contact_submissions (id) on delete cascade,
  admin_user_id uuid references auth.users (id),
  body text not null,
  -- Resend's own message id, recorded for troubleshooting a specific
  -- send — never used for anything RLS/business-logic-relevant.
  resend_message_id text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.contact_submission_replies is
  'Append-only outbound reply log — same pattern as order_request_status_history/researcher_attestations: no update/delete policy for any role, including admin. One row per reply actually sent.';

create index contact_submission_replies_submission_id_idx on public.contact_submission_replies (submission_id, sent_at desc);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.contact_submissions enable row level security;
alter table public.contact_submissions force row level security;
alter table public.contact_submission_replies enable row level security;
alter table public.contact_submission_replies force row level security;

-- Admin-only read — contact messages carry real PII (name, email, free-
-- text message body), same posture as order_requests, not editorial
-- content; no researcher self-service "my messages" view exists in
-- this pass (not part of the approved scope).
create policy "contact_submissions_select_admin" on public.contact_submissions for select to authenticated using (public.has_min_role('admin'));

-- The submitting researcher's own insert, at submission time —
-- src/pages/api/contact.ts uses createUserScopedClient with the
-- caller's own JWT (never the service-role client), matching this
-- codebase's overwhelming preference for RLS-enforced writes.
create policy "contact_submissions_insert_own" on public.contact_submissions for insert to authenticated
with
  check (researcher_user_id = auth.uid());

-- Status changes (new -> read on first admin view, -> replied when a
-- reply is sent) are admin-only.
create policy "contact_submissions_update_admin" on public.contact_submissions for
update to authenticated using (public.has_min_role('admin'))
with
  check (public.has_min_role('admin'));

-- No delete policy for any role — a submitted message is a permanent
-- record once created, same as order_requests.

create policy "contact_submission_replies_select_admin" on public.contact_submission_replies for select to authenticated using (public.has_min_role('admin'));

create policy "contact_submission_replies_insert_admin" on public.contact_submission_replies for insert to authenticated
with
  check (
    public.has_min_role('admin')
    and admin_user_id = auth.uid()
  );

-- No update/delete policy for any role — append-only, same as
-- order_request_status_history.

grant
select
,
insert,
update on public.contact_submissions to authenticated;

grant
select
,
insert on public.contact_submission_replies to authenticated;

-- ---------------------------------------------------------------------
-- push_events: add 'contact_submission_created' as a valid event_type.
-- Unnamed inline check constraints get Postgres's default
-- "<table>_<column>_check" name — confirmed against
-- 20260819120000_push_subscriptions.sql, which never named this one
-- explicitly.
-- ---------------------------------------------------------------------
alter table public.push_events
drop constraint if exists push_events_event_type_check;

alter table public.push_events
add constraint push_events_event_type_check check (
  event_type in (
    'researcher_registered',
    'order_request_created',
    'contact_submission_created',
    'test'
  )
);
