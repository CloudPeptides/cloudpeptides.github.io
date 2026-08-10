/**
 * Admin price edit — the one mutable field on the private pricing
 * catalog (supabase/migrations/20260808170000_admin_pricing_catalog.sql).
 * Code, name, spec, count, and category are fixed at seed time and not
 * editable from this route.
 *
 * Authorization: the caller's own JWT (createUserScopedClient) is what
 * actually performs the UPDATE — RLS's admin_pricing_catalog_all_admin
 * policy is the real boundary, hasMinRole() here is defense-in-depth
 * for a clear 403 rather than an opaque RLS failure (CLAUDE.md §8).
 * Audit logging (instruction: record every price change with product
 * code, previous price, new price, admin user id, and timestamp) needs
 * a service-role client afterward regardless of who performed the
 * update — audit_log has no client write policy at all, by design
 * (supabase/migrations/20260806144905_grants.sql), so this is the one
 * place this route touches createServiceClient(), narrowly scoped to
 * exactly that single INSERT, matching the existing narrow-service-role
 * posture already documented in src/lib/auth.ts.
 *
 * src/middleware.ts's STAGING_READ_ONLY boundary carries one explicit,
 * narrowly-scoped exemption for this exact path prefix — see that
 * file's own comment for the full reasoning (this table has no public/
 * production-facing read path at all, so a staging write here can't
 * pollute anything production actually serves).
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  createServiceClient,
  createUserScopedClient,
  hasMinRole,
  isSameOriginRequest,
} from '../../../../lib/auth';
import {
  getPricingCatalogEntry,
  updatePricingCatalogPrice,
  validatePrice,
} from '../../../../lib/admin/pricing-catalog';
import { writeAuditLog } from '../../../../lib/admin/users';
import { checkRateLimit } from '../../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../../lib/request-limits';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const PATCH: APIRoute = async ({ params, request, url, locals }) => {
  const session = locals.session!;
  const id = params.id;
  if (!id) return json({ success: false, error: 'Missing pricing catalog entry id.' }, 400);
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }
  if (!hasMinRole(session.role, 'admin')) {
    return json({ success: false, error: 'Admin access required.' }, 403);
  }

  // ADMIN_RATE_LIMITER, not FORM_RATE_LIMITER — see src/env.d.ts's own
  // comment: this route needs a much higher ceiling than the public
  // abuse-prevention limit (5/60s) to support legitimate batch price
  // editing.
  const rate = await checkRateLimit(
    env.ADMIN_RATE_LIMITER,
    `pricing-catalog-edit:${session.userId}`,
  );
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const bodyRead = await readBodyWithLimit(request, 2_048);
  if (!bodyRead.ok) {
    return json({ success: false, error: bodyRead.error ?? 'Invalid request body.' }, 413);
  }
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(bodyRead.text ?? '');
  } catch {
    return json({ success: false, error: 'Invalid request body.' }, 400);
  }

  const priceCheck = validatePrice(input.price);
  if (!priceCheck.valid || priceCheck.value === undefined) {
    return json({ success: false, error: priceCheck.error }, 400);
  }

  const client = createUserScopedClient(session.accessToken);

  const current = await getPricingCatalogEntry(client, id).catch(() => null);
  if (!current) {
    return json({ success: false, error: 'Pricing catalog entry not found.' }, 404);
  }

  const previousPrice = current.price;
  if (previousPrice === priceCheck.value) {
    return json({ success: true, data: current, unchanged: true }, 200);
  }

  let updated: Awaited<ReturnType<typeof updatePricingCatalogPrice>>;
  try {
    updated = await updatePricingCatalogPrice(client, id, priceCheck.value);
  } catch {
    return json(
      {
        success: false,
        error: 'Could not update this price. Check your permissions and try again.',
      },
      400,
    );
  }
  if (!updated) {
    return json({ success: false, error: 'Could not update this price.' }, 400);
  }

  try {
    const service = createServiceClient();
    await writeAuditLog(service, {
      actor_user_id: session.userId,
      action: 'pricing_catalog_price_updated',
      target_table: 'admin_pricing_catalog',
      target_id: id,
      detail: {
        code: updated.code,
        previous_price: previousPrice,
        new_price: updated.price,
      },
    });
  } catch (err) {
    // writeAuditLog itself is already best-effort/non-throwing on a
    // Postgres-level failure (logs to console.error internally) — this
    // catch is only for createServiceClient() throwing when the
    // service-role secret isn't configured in this environment. The
    // price update above already succeeded and must not be masked by
    // an audit-log-only failure; surfaced server-side, not to the
    // client.
    console.error('pricing catalog audit log failed:', err instanceof Error ? err.message : err);
  }

  return json({ success: true, data: updated }, 200);
};
