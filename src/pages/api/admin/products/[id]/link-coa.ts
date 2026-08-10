/**
 * Links (or unlinks, coaId omitted) an existing COA to this product —
 * sets batch_coas.product_id. Does not create or edit a COA's own
 * fields; that's src/pages/api/admin/coas/[id].ts's job. Kept as a
 * separate, narrow route rather than extending that one, since it
 * operates from the product side of the relationship.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  createServiceClient,
  createUserScopedClient,
  hasMinRole,
  isSameOriginRequest,
} from '../../../../../lib/auth';
import { linkCoaToProduct } from '../../../../../lib/admin/products';
import { writeAuditLog } from '../../../../../lib/admin/users';
import { checkRateLimit } from '../../../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../../../lib/request-limits';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const POST: APIRoute = async ({ params, request, url, locals }) => {
  const session = locals.session!;
  const productId = params.id;
  if (!productId) return json({ success: false, error: 'Missing product id.' }, 400);
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }
  if (!hasMinRole(session.role, 'admin')) {
    return json({ success: false, error: 'Admin access required.' }, 403);
  }

  const rate = await checkRateLimit(env.ADMIN_RATE_LIMITER, `product-link-coa:${session.userId}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const bodyRead = await readBodyWithLimit(request, 1_024);
  if (!bodyRead.ok)
    return json({ success: false, error: bodyRead.error ?? 'Invalid request body.' }, 413);
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(bodyRead.text ?? '');
  } catch {
    return json({ success: false, error: 'Invalid request body.' }, 400);
  }

  const coaId = typeof input.coaId === 'string' ? input.coaId : '';
  if (!UUID_PATTERN.test(coaId)) return json({ success: false, error: 'Invalid COA id.' }, 400);

  const client = createUserScopedClient(session.accessToken);
  try {
    await linkCoaToProduct(client, coaId, productId);
  } catch {
    return json({ success: false, error: 'Could not link this COA.' }, 400);
  }

  try {
    const service = createServiceClient();
    await writeAuditLog(service, {
      actor_user_id: session.userId,
      action: 'product_coa_linked',
      target_table: 'shop_products',
      target_id: productId,
      detail: { coa_id: coaId },
    });
  } catch (err) {
    console.error('product coa-link audit log failed:', err instanceof Error ? err.message : err);
  }

  return json({ success: true }, 200);
};
