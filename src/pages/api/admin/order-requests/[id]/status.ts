/**
 * Order-request status change. Uses the acting admin's own JWT
 * (createUserScopedClient) — RLS (order_requests_update_admin,
 * order_request_status_history_insert_admin) is the real boundary, not
 * this route's own hasMinRole check (defense-in-depth, same pattern as
 * every other admin route). updateOrderRequestStatus() re-fetches the
 * current status server-side rather than trusting a client-supplied
 * "previous status", so the history row is always accurate even under
 * a race with another admin's concurrent change.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createServiceClient, createUserScopedClient, hasMinRole } from '../../../../../lib/auth';
import { writeAuditLog } from '../../../../../lib/admin/users';
import {
  ORDER_REQUEST_STATUSES,
  updateOrderRequestStatus,
  type OrderRequestStatus,
} from '../../../../../lib/order-requests';
import { sanitizeText } from '../../../../../lib/form-validation';
import { checkRateLimit } from '../../../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../../../lib/request-limits';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, url, locals, params }) => {
  const session = locals.session!;
  const orderId = params.id;
  if (!orderId) return json({ success: false, error: 'Missing order request id.' }, 400);

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).origin !== url.origin) {
        return json({ success: false, error: 'Invalid request origin.' }, 403);
      }
    } catch {
      return json({ success: false, error: 'Invalid request origin.' }, 403);
    }
  }
  if (!hasMinRole(session.role, 'admin')) {
    return json({ success: false, error: 'Admin access required.' }, 403);
  }

  const rate = await checkRateLimit(env.ADMIN_RATE_LIMITER, `order-status:${session.userId}`);
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

  const newStatus = input.status;
  if (
    typeof newStatus !== 'string' ||
    !ORDER_REQUEST_STATUSES.includes(newStatus as OrderRequestStatus)
  ) {
    return json({ success: false, error: 'Invalid status.' }, 400);
  }
  const note = sanitizeText(input.note, 500) || undefined;

  const client = createUserScopedClient(session.accessToken);
  let previousStatus: OrderRequestStatus;
  try {
    const result = await updateOrderRequestStatus(client, {
      orderId,
      newStatus: newStatus as OrderRequestStatus,
      changedBy: session.userId,
      note,
    });
    previousStatus = result.previousStatus;
  } catch (err) {
    console.error('order-request status update failed:', err instanceof Error ? err.message : err);
    return json({ success: false, error: 'Could not update this order request.' }, 400);
  }

  try {
    const service = createServiceClient();
    await writeAuditLog(service, {
      actor_user_id: session.userId,
      action: 'order_request_status_change',
      target_table: 'order_requests',
      target_id: orderId,
      detail: { previous_status: previousStatus, new_status: newStatus, note: note ?? null },
    });
  } catch (err) {
    console.error(
      'order-request status audit log failed:',
      err instanceof Error ? err.message : err,
    );
  }

  return json({ success: true, previousStatus, newStatus }, 200);
};
