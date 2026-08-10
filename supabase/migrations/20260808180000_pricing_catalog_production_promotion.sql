-- Documentation-only update: the private pricing catalog was staging-
-- only during development/testing; that phase is over and production
-- promotion was explicitly approved 2026-08-08. No schema, RLS, or
-- grant change — admin-only read/write and the absence of any cost
-- column are unchanged, only this comment is corrected to stop
-- describing a since-lifted staging-only restriction.
comment on table public.admin_pricing_catalog is
  'Private, admin-only internal pricing reference. Admin-only read and write. Never the public shop catalog, never exposes supplier cost.';
