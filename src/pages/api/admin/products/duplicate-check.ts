/**
 * Wizard Step 1 — fuzzy duplicate-compound search. Read-only, admin
 * dashboard baseline (contributor+, per src/middleware.ts) is enough
 * here since this never writes anything; the actual creation route
 * requires admin specifically.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { createUserScopedClient } from '../../../../lib/auth';
import { findPossibleDuplicateCompounds } from '../../../../lib/admin/products';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ url, locals }) => {
  const session = locals.session!;
  const q = url.searchParams.get('q') ?? '';

  const client = createUserScopedClient(session.accessToken);
  try {
    const candidates = await findPossibleDuplicateCompounds(client, q);
    return json({ success: true, data: candidates }, 200);
  } catch {
    return json({ success: false, error: 'Could not search for duplicates right now.' }, 400);
  }
};
