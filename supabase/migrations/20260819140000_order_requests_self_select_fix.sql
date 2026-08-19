-- Fix: order_requests_select_admin was admin-only, with no own-row
-- exception — discovered live via scripts/migration/
-- verify-push-orders-research.mjs (RLS verification, 2026-08-19) that
-- this actually breaks order submission entirely: PostgREST's
-- `insert(...).select(...).single()` pattern (used by both this
-- verification script and the real src/lib/order-requests.ts
-- insertOrderRequest(), called from checkout.ts) requires the INSERT's
-- own RETURNING clause to be SELECT-visible to the inserting session —
-- an admin-only SELECT policy makes a researcher's own just-submitted
-- INSERT fail with a generic RLS-violation error, even though the
-- INSERT's own WITH CHECK clause was satisfied.
--
-- Fix: allow a researcher to SELECT their own order_requests rows,
-- matching the exact same pattern researcher_profiles/
-- researcher_attestations already use (`user_id = auth.uid() OR
-- has_min_role('admin')` — see 20260813120000_researcher_accounts.sql).
-- This is not a meaningful new information disclosure: the row's PII is
-- data the researcher themselves just typed into the checkout form: it
-- was never secret from them, only from OTHER researchers and from
-- anonymous users, both of which remain fully blocked. No "my orders"
-- UI is added by this migration — this is purely the RLS fix that
-- makes the existing insert-and-return-the-row code path work at all.
drop policy "order_requests_select_admin" on public.order_requests;

create policy "order_requests_select_own_or_admin" on public.order_requests for select to authenticated using (
  researcher_user_id = auth.uid()
  or public.has_min_role('admin')
);
