/**
 * Shared audit-logging helpers for every COA admin write action
 * (create, edit, publish/unpublish/archive/restore, file replacement)
 * — src/pages/api/admin/coas/index.ts, [id].ts, [id]/file.ts.
 *
 * audit_log has no INSERT policy for `authenticated` at all (force RLS,
 * supabase/migrations/20260806144904_rls_policies.sql) — every write
 * here goes through a service-role client (createServiceClient()),
 * exactly like src/pages/api/admin/products/[id]/link-coa.ts and
 * src/lib/admin/users.ts's writeAuditLog(), which this wraps. A logging
 * failure is best-effort (console.error, never thrown) so it can never
 * mask the outcome of the action it's recording, matching the existing
 * writeAuditLog() contract.
 *
 * Never pass file bytes, signed URLs, or credentials into `detail` —
 * only plain metadata (paths, filenames, sizes, mime types, field
 * diffs) ever belongs here.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '../auth';
import { writeAuditLog } from './users';

/** The linked shop product's canonical code/name — resolved fresh via
 * product_id, never duplicated onto batch_coas itself. Null when the
 * COA has no product_id (an older or not-yet-linked COA) — logged as
 * null rather than guessed or omitted. */
export async function resolveCoaProductLabel(
  client: SupabaseClient,
  productId: string | null,
): Promise<{ sku: string; name: string } | null> {
  if (!productId) return null;
  const { data } = await client
    .from('shop_products')
    .select('code, name')
    .eq('id', productId)
    .maybeSingle();
  if (!data) return null;
  return { sku: data.code as string, name: data.name as string };
}

/** Old/new diff for a fixed field list — only fields that actually
 * changed are included, and only plain scalar values (no file bytes,
 * no secrets) ever pass through this table's own columns anyway. */
export function diffCoaFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: readonly string[],
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const field of fields) {
    if (!(field in after)) continue;
    const oldValue = before[field] ?? null;
    const newValue = after[field] ?? null;
    if (oldValue !== newValue) {
      changes[field] = { old: oldValue, new: newValue };
    }
  }
  return changes;
}

export async function logCoaAudit(params: {
  actorUserId: string;
  action: string;
  coaId: string;
  productLabel: { sku: string; name: string } | null;
  peptideName?: string | null;
  changes?: Record<string, { old: unknown; new: unknown }>;
  extra?: Record<string, unknown>;
}): Promise<void> {
  try {
    const service = createServiceClient();
    await writeAuditLog(service, {
      actor_user_id: params.actorUserId,
      action: params.action,
      target_table: 'batch_coas',
      target_id: params.coaId,
      detail: {
        product_name: params.peptideName ?? null,
        product_sku: params.productLabel?.sku ?? null,
        linked_shop_product_name: params.productLabel?.name ?? null,
        ...(params.changes && Object.keys(params.changes).length > 0
          ? { changes: params.changes }
          : {}),
        ...(params.extra ?? {}),
      },
    });
  } catch (err) {
    console.error('coa audit_log insert failed:', err instanceof Error ? err.message : err);
  }
}
