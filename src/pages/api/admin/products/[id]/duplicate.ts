/**
 * "Duplicate as new variant" — copies an existing shop product for the
 * same compound (or with no compound link) as a starting point for a
 * new SKU. Always lands as draft/private regardless of the source
 * row's status; the admin edits the placeholder code/spec/price
 * afterward from the product's detail page.
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
import { duplicateShopProductAsVariant, getShopProduct } from '../../../../../lib/admin/products';
import { writeAuditLog } from '../../../../../lib/admin/users';
import { checkRateLimit } from '../../../../../lib/rate-limit';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ params, request, url, locals }) => {
  const session = locals.session!;
  const id = params.id;
  if (!id) return json({ success: false, error: 'Missing product id.' }, 400);
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }
  if (!hasMinRole(session.role, 'admin')) {
    return json({ success: false, error: 'Admin access required.' }, 403);
  }

  const rate = await checkRateLimit(env.ADMIN_RATE_LIMITER, `product-duplicate:${session.userId}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const client = createUserScopedClient(session.accessToken);
  const source = await getShopProduct(client, id).catch(() => null);
  if (!source) return json({ success: false, error: 'Product not found.' }, 404);

  let copy;
  try {
    copy = await duplicateShopProductAsVariant(client, source, session.userId);
  } catch {
    return json({ success: false, error: 'Could not duplicate this product.' }, 400);
  }

  try {
    const service = createServiceClient();
    await writeAuditLog(service, {
      actor_user_id: session.userId,
      action: 'product_duplicated',
      target_table: 'shop_products',
      target_id: copy.id,
      detail: { source_id: source.id, source_code: source.code, new_code: copy.code },
    });
  } catch (err) {
    console.error('product duplicate audit log failed:', err instanceof Error ? err.message : err);
  }

  return json({ success: true, data: copy }, 201);
};
