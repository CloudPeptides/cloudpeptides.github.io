/**
 * Edit an existing shop product — price, name, spec, count, category,
 * internal status (draft/active/archived — this is also how
 * archive/unarchive works, no separate route needed), and public
 * listing status (private/compliance_hold/published). Never lets a
 * client set compound_id/created_by/code (code is immutable after
 * creation to avoid silently breaking anything already referencing it
 * by SKU).
 *
 * Same authorization posture as pricing-catalog's edit route: the
 * caller's own JWT (createUserScopedClient) performs the actual
 * UPDATE, RLS is the real boundary, hasMinRole() here is
 * defense-in-depth for a clear 403.
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
  getShopProduct,
  validateCount,
  validatePrice,
  INTERNAL_STATUSES,
  PUBLIC_STATUSES,
} from '../../../../lib/admin/products';
import { isSingleLineSafe, sanitizeText } from '../../../../lib/form-validation';
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
  if (!id) return json({ success: false, error: 'Missing product id.' }, 400);
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }
  if (!hasMinRole(session.role, 'admin')) {
    return json({ success: false, error: 'Admin access required.' }, 403);
  }

  const rate = await checkRateLimit(env.ADMIN_RATE_LIMITER, `product-edit:${session.userId}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const bodyRead = await readBodyWithLimit(request, 4_096);
  if (!bodyRead.ok)
    return json({ success: false, error: bodyRead.error ?? 'Invalid request body.' }, 413);
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(bodyRead.text ?? '');
  } catch {
    return json({ success: false, error: 'Invalid request body.' }, 400);
  }

  const client = createUserScopedClient(session.accessToken);
  const current = await getShopProduct(client, id).catch(() => null);
  if (!current) return json({ success: false, error: 'Product not found.' }, 404);

  const update: Record<string, unknown> = {};
  const changed: Record<string, { from: unknown; to: unknown }> = {};

  if ('name' in input) {
    const name = sanitizeText(input.name, 200);
    if (!name || !isSingleLineSafe(name))
      return json({ success: false, error: 'Invalid product name.' }, 400);
    if (name !== current.name) changed.name = { from: current.name, to: name };
    update.name = name;
  }
  if ('spec' in input) {
    const spec = sanitizeText(input.spec, 100);
    if (!spec || !isSingleLineSafe(spec))
      return json({ success: false, error: 'Invalid specification.' }, 400);
    if (spec !== current.spec) changed.spec = { from: current.spec, to: spec };
    update.spec = spec;
  }
  if ('count' in input) {
    const check = validateCount(input.count);
    if (!check.valid) return json({ success: false, error: check.error }, 400);
    if (check.value !== current.count) changed.count = { from: current.count, to: check.value };
    update.count = check.value;
  }
  if ('price' in input) {
    const check = validatePrice(input.price);
    if (!check.valid) return json({ success: false, error: check.error }, 400);
    if (check.value !== current.price) changed.price = { from: current.price, to: check.value };
    update.price = check.value;
  }
  if ('categoryId' in input) {
    const categoryId = typeof input.categoryId === 'string' ? input.categoryId : '';
    if (!categoryId) return json({ success: false, error: 'A category is required.' }, 400);
    if (categoryId !== current.category_id)
      changed.category_id = { from: current.category_id, to: categoryId };
    update.category_id = categoryId;
  }
  if ('internalStatus' in input) {
    const v = input.internalStatus;
    if (
      typeof v !== 'string' ||
      !INTERNAL_STATUSES.includes(v as (typeof INTERNAL_STATUSES)[number])
    ) {
      return json({ success: false, error: 'Invalid internal status.' }, 400);
    }
    if (v !== current.internal_status)
      changed.internal_status = { from: current.internal_status, to: v };
    update.internal_status = v;
  }
  if ('publicStatus' in input) {
    const v = input.publicStatus;
    if (typeof v !== 'string' || !PUBLIC_STATUSES.includes(v as (typeof PUBLIC_STATUSES)[number])) {
      return json({ success: false, error: 'Invalid public-listing status.' }, 400);
    }
    if (v !== current.public_status) changed.public_status = { from: current.public_status, to: v };
    update.public_status = v;
  }
  // Code is immutable after creation — deliberately never read from
  // the request body at all above, even if present (silently ignored,
  // matching this codebase's allow-list convention elsewhere).

  if (Object.keys(update).length === 0) {
    return json({ success: false, error: 'No editable fields were provided.' }, 400);
  }

  const { data, error } = await client
    .from('shop_products')
    .update(update)
    .eq('id', id)
    .select(
      'id, compound_id, code, name, spec, count, price, category_id, internal_status, public_status, created_by, created_at, updated_at',
    )
    .maybeSingle();

  if (error || !data) {
    return json(
      { success: false, error: 'Could not update this product. Check your permissions and input.' },
      400,
    );
  }

  if (Object.keys(changed).length > 0) {
    try {
      const service = createServiceClient();
      await writeAuditLog(service, {
        actor_user_id: session.userId,
        action: 'product_updated',
        target_table: 'shop_products',
        target_id: id,
        detail: { code: current.code, changed },
      });
    } catch (err) {
      console.error('product edit audit log failed:', err instanceof Error ? err.message : err);
    }
  }

  return json({ success: true, data }, 200);
};
