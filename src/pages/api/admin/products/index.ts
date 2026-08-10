/**
 * Wizard Step 6 — transactional create. Admin-only (not just
 * contributor+): this can create a new research compound record, which
 * is editorial content, and always creates at least one commerce SKU.
 *
 * The actual multi-table write happens inside a single Postgres
 * transaction (create_product_with_research(), supabase/migrations/
 * 20260810091000_...) — this route's job is: authenticate, rate-limit,
 * validate every field server-side (never trust the client, even
 * though the client-side wizard also validates), call the function
 * once, and write one audit_log entry summarizing what was created.
 * The RPC function re-checks admin authorization itself too (defense
 * in depth — never rely on a single client-facing check, CLAUDE.md §8).
 *
 * A newly created compound is always 'draft' — enforced inside the SQL
 * function itself, not just here, so there is no request shape that
 * can create a published research record through this route.
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
  createProductWithResearch,
  validateCount,
  validatePrice,
  validateProductCode,
  validateSlug,
  ENTITY_KINDS,
  INTERNAL_STATUSES,
  PUBLIC_STATUSES,
  type CreateProductPayload,
  type EntityKind,
  type VariantInput,
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ENTITY_KIND_VALUES = new Set(ENTITY_KINDS.map((e) => e.value));

function validateVariant(
  input: unknown,
  index: number,
): { valid: boolean; error?: string; value?: VariantInput } {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: `Variant ${index + 1} is invalid.` };
  }
  const v = input as Record<string, unknown>;

  const codeCheck = validateProductCode(v.code);
  if (!codeCheck.valid) return { valid: false, error: `Variant ${index + 1}: ${codeCheck.error}` };

  const name = sanitizeText(v.name, 200);
  if (!name || !isSingleLineSafe(name)) {
    return { valid: false, error: `Variant ${index + 1}: a product name is required.` };
  }
  const spec = sanitizeText(v.spec, 100);
  if (!spec || !isSingleLineSafe(spec)) {
    return { valid: false, error: `Variant ${index + 1}: a specification is required.` };
  }

  const countCheck = validateCount(v.count);
  if (!countCheck.valid)
    return { valid: false, error: `Variant ${index + 1}: ${countCheck.error}` };

  const priceCheck = validatePrice(v.price);
  if (!priceCheck.valid)
    return { valid: false, error: `Variant ${index + 1}: ${priceCheck.error}` };

  const categoryId = typeof v.categoryId === 'string' ? v.categoryId : '';
  if (!UUID_PATTERN.test(categoryId)) {
    return { valid: false, error: `Variant ${index + 1}: a category is required.` };
  }

  const internalStatus = typeof v.internalStatus === 'string' ? v.internalStatus : 'draft';
  if (!INTERNAL_STATUSES.includes(internalStatus as (typeof INTERNAL_STATUSES)[number])) {
    return { valid: false, error: `Variant ${index + 1}: invalid internal status.` };
  }
  const publicStatus = typeof v.publicStatus === 'string' ? v.publicStatus : 'private';
  if (!PUBLIC_STATUSES.includes(publicStatus as (typeof PUBLIC_STATUSES)[number])) {
    return { valid: false, error: `Variant ${index + 1}: invalid public-listing status.` };
  }

  return {
    valid: true,
    value: {
      code: (v.code as string).trim(),
      name,
      spec,
      count: countCheck.value!,
      price: priceCheck.value!,
      categoryId,
      internalStatus: internalStatus as (typeof INTERNAL_STATUSES)[number],
      publicStatus: publicStatus as (typeof PUBLIC_STATUSES)[number],
    },
  };
}

export const POST: APIRoute = async ({ request, url, locals }) => {
  const session = locals.session!;
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }
  if (!hasMinRole(session.role, 'admin')) {
    return json({ success: false, error: 'Admin access required.' }, 403);
  }

  const rate = await checkRateLimit(
    env.ADMIN_RATE_LIMITER,
    `product-wizard-create:${session.userId}`,
  );
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const bodyRead = await readBodyWithLimit(request, 32_768);
  if (!bodyRead.ok) {
    return json({ success: false, error: bodyRead.error ?? 'Invalid request body.' }, 413);
  }
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(bodyRead.text ?? '');
  } catch {
    return json({ success: false, error: 'Invalid request body.' }, 400);
  }

  const compoundId =
    typeof input.compoundId === 'string' && input.compoundId ? input.compoundId : null;
  const rawNewCompound = input.newCompound;

  if (!compoundId && (typeof rawNewCompound !== 'object' || rawNewCompound === null)) {
    return json(
      { success: false, error: 'Link an existing compound or provide new compound details.' },
      400,
    );
  }
  if (compoundId && !UUID_PATTERN.test(compoundId)) {
    return json({ success: false, error: 'Invalid compound id.' }, 400);
  }

  let newCompound: CreateProductPayload['newCompound'] = null;
  if (!compoundId) {
    const nc = rawNewCompound as Record<string, unknown>;
    const canonicalName = sanitizeText(nc.canonicalName, 200);
    if (!canonicalName || !isSingleLineSafe(canonicalName)) {
      return json(
        { success: false, error: 'A canonical name is required for a new compound.' },
        400,
      );
    }
    const displayName = sanitizeText(nc.displayName, 200);
    const slugCheck = validateSlug(nc.slug);
    if (!slugCheck.valid) return json({ success: false, error: slugCheck.error }, 400);
    const entityKind = typeof nc.entityKind === 'string' ? nc.entityKind : '';
    if (!ENTITY_KIND_VALUES.has(entityKind as never)) {
      return json({ success: false, error: 'Invalid entity type.' }, 400);
    }
    const aliasesRaw = Array.isArray(nc.aliases) ? nc.aliases : [];
    const aliases = aliasesRaw
      .filter((a): a is string => typeof a === 'string')
      .map((a) => sanitizeText(a, 100))
      .filter((a) => a && isSingleLineSafe(a));

    newCompound = {
      canonicalName,
      displayName: displayName || undefined,
      slug: (typeof nc.slug === 'string' ? nc.slug.trim() : '').toLowerCase(),
      entityKind: entityKind as EntityKind,
      aliases,
    };
  }

  const stackComponentIdsRaw = Array.isArray(input.stackComponentIds)
    ? input.stackComponentIds
    : [];
  const stackComponentIds = stackComponentIdsRaw.filter(
    (id): id is string => typeof id === 'string' && UUID_PATTERN.test(id),
  );
  if (stackComponentIds.length !== stackComponentIdsRaw.length) {
    return json({ success: false, error: 'One or more selected components are invalid.' }, 400);
  }

  const variantsRaw = Array.isArray(input.variants) ? input.variants : [];
  if (variantsRaw.length === 0) {
    return json({ success: false, error: 'At least one shop product variant is required.' }, 400);
  }
  if (variantsRaw.length > 20) {
    return json({ success: false, error: 'Too many variants in one submission.' }, 400);
  }
  const variants: VariantInput[] = [];
  for (let i = 0; i < variantsRaw.length; i++) {
    const check = validateVariant(variantsRaw[i], i);
    if (!check.valid || !check.value) return json({ success: false, error: check.error }, 400);
    variants.push(check.value);
  }
  const codes = new Set(variants.map((v) => v.code.toLowerCase()));
  if (codes.size !== variants.length) {
    return json(
      { success: false, error: 'Variant product codes must be unique within this submission.' },
      400,
    );
  }

  const client = createUserScopedClient(session.accessToken);
  let result: { compoundId: string; productIds: string[] };
  try {
    result = await createProductWithResearch(client, session.userId, {
      compoundId,
      newCompound,
      stackComponentIds,
      variants,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    const safeMessage = /duplicate key|unique constraint/i.test(message)
      ? 'One of the product codes or the slug is already in use.'
      : 'Could not save this product. Check your permissions and input.';
    return json({ success: false, error: safeMessage }, 400);
  }

  try {
    const service = createServiceClient();
    await writeAuditLog(service, {
      actor_user_id: session.userId,
      action: 'product_created',
      target_table: 'shop_products',
      target_id: result.productIds[0],
      detail: {
        compound_id: result.compoundId,
        compound_newly_created: !compoundId,
        product_ids: result.productIds,
        codes: variants.map((v) => v.code),
      },
    });
  } catch (err) {
    console.error('product wizard audit log failed:', err instanceof Error ? err.message : err);
  }

  return json({ success: true, data: result }, 201);
};
