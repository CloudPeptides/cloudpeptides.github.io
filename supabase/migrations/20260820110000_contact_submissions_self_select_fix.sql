-- Fix: contact_submissions_select_admin was admin-only, with no own-row
-- exception — the exact same bug order_requests had, caught and fixed
-- by 20260819140000_order_requests_self_select_fix.sql. Caught here
-- during staging verification (2026-08-20), before it ever reached a
-- real submission: PostgREST's `insert(...).select(...).single()`
-- pattern (src/lib/contact-submissions.ts's insertContactSubmission(),
-- called from src/pages/api/contact.ts under the submitting
-- researcher's own JWT) requires the INSERT's own RETURNING clause to
-- be SELECT-visible to the inserting session — an admin-only SELECT
-- policy makes a researcher's own just-submitted INSERT fail with a
-- generic RLS-violation error, even though the INSERT's own WITH CHECK
-- clause was satisfied. The message would still have been written, but
-- the researcher would see a false "could not send your message" error
-- and no push notification would ever fire (the route returns early on
-- that error, before reaching notifyNewContactSubmission).
--
-- Fix: allow a researcher to SELECT their own contact_submissions rows,
-- matching order_requests_select_own_or_admin's exact pattern. Not a
-- meaningful new information disclosure: the row's content is data the
-- researcher themselves just typed into the contact form — never secret
-- from them, only from OTHER researchers and anonymous users, both of
-- which remain fully blocked. No "my messages" UI is added by this
-- migration — this is purely the RLS fix that makes the existing
-- insert-and-return-the-row code path work at all.
drop policy "contact_submissions_select_admin" on public.contact_submissions;

create policy "contact_submissions_select_own_or_admin" on public.contact_submissions for select to authenticated using (
  researcher_user_id = auth.uid()
  or public.has_min_role('admin')
);
