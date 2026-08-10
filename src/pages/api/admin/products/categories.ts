/**
 * Category management — "Allow categories to be managed in the
 * dashboard rather than hardcoded." Create only for now (rename/
 * reorder/delete aren't part of this batch's explicit scope); every
 * shop product references a category by id, so this is intentionally
 * narrow — an unused category can simply be ignored, and deleting one
 * that's in use isn't offered here to avoid an orphaned-FK situation
 * without a defined reassignment flow.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createUserScopedClient, hasMinRole, isSameOriginRequest } from '../../../../lib/auth';
import { createCategory } from '../../../../lib/admin/products';
import { isSingleLineSafe, sanitizeText } from '../../../../lib/form-validation';
import { checkRateLimit } from '../../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../../lib/request-limits';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, url, locals }) => {
  const session = locals.session!;
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }
  if (!hasMinRole(session.role, 'admin')) {
    return json({ success: false, error: 'Admin access required.' }, 403);
  }

  const rate = await checkRateLimit(env.ADMIN_RATE_LIMITER, `category-create:${session.userId}`);
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

  const name = sanitizeText(input.name, 80);
  if (!name || !isSingleLineSafe(name)) {
    return json({ success: false, error: 'A category name is required.' }, 400);
  }

  const client = createUserScopedClient(session.accessToken);
  try {
    const category = await createCategory(client, name);
    return json({ success: true, data: category }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    const safeMessage = /duplicate key|unique constraint/i.test(message)
      ? 'A category with this name already exists.'
      : 'Could not create this category.';
    return json({ success: false, error: safeMessage }, 400);
  }
};
