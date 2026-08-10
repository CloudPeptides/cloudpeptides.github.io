/**
 * Admin COA file replacement — uploads the new file to a fresh
 * crypto-random path (never overwrites the old object in place) and
 * only then repoints the batch_coas row at it, so a failed upload
 * never leaves the row referencing a half-written file. The old
 * object is deleted afterward as cleanup, not as the safety mechanism
 * — the moment the row's file_path changes, the old object stops
 * matching coa_documents_read_published's join condition and becomes
 * unreachable via the public-read policy regardless of whether the
 * cleanup delete itself succeeds.
 *
 * Same authorization posture as every other admin COA route: caller's
 * own JWT (createUserScopedClient), RLS as the real boundary,
 * hasMinRole() here as defense-in-depth.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createUserScopedClient, hasMinRole, isSameOriginRequest } from '../../../../../lib/auth';
import {
  generateStoragePath,
  sanitizeOriginalFilename,
  validateCoaFile,
  MAX_COA_FILE_BYTES,
} from '../../../../../lib/coa-file-validation';
import { COA_BUCKET } from '../../../../../lib/coas';
import { checkRateLimit } from '../../../../../lib/rate-limit';
import { logCoaAudit, resolveCoaProductLabel } from '../../../../../lib/admin/coa-audit';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const MAX_REQUEST_BYTES = MAX_COA_FILE_BYTES + 65_536;

export const POST: APIRoute = async ({ params, request, url, locals }) => {
  const session = locals.session!;
  const id = params.id;
  if (!id) return json({ success: false, error: 'Missing COA id.' }, 400);
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }
  if (!hasMinRole(session.role, 'admin')) {
    return json({ success: false, error: 'Admin access required.' }, 403);
  }

  const declaredLength = request.headers.get('content-length');
  if (declaredLength && Number(declaredLength) > MAX_REQUEST_BYTES) {
    return json({ success: false, error: 'Upload is too large (10 MB file maximum).' }, 413);
  }

  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `coa-file:${session.userId}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const client = createUserScopedClient(session.accessToken);
  const { data: current, error: fetchError } = await client
    .from('batch_coas')
    .select('id, file_path, original_filename, file_mime_type, file_size_bytes, peptide_name, product_id')
    .eq('id', id)
    .maybeSingle();
  if (fetchError || !current) {
    return json({ success: false, error: 'COA not found.' }, 404);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ success: false, error: 'Invalid form submission.' }, 400);
  }
  const file = form.get('file');
  if (!(file instanceof File)) {
    return json({ success: false, error: 'A file is required.' }, 400);
  }
  if (file.size > MAX_COA_FILE_BYTES) {
    return json({ success: false, error: 'The uploaded file is too large (10 MB maximum).' }, 413);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const fileCheck = validateCoaFile(bytes, file.type);
  if (!fileCheck.valid || !fileCheck.kind) {
    return json({ success: false, error: fileCheck.error ?? 'Invalid file.' }, 400);
  }

  const originalFilename = sanitizeOriginalFilename(file.name);
  const newPath = generateStoragePath(fileCheck.kind);

  const { error: uploadError } = await client.storage
    .from(COA_BUCKET)
    .upload(newPath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) {
    return json({ success: false, error: 'Could not upload the file. Please try again.' }, 502);
  }

  const { data, error: updateError } = await client
    .from('batch_coas')
    .update({
      file_path: newPath,
      file_mime_type: file.type,
      file_size_bytes: file.size,
      original_filename: originalFilename,
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (updateError || !data) {
    await client.storage.from(COA_BUCKET).remove([newPath]);
    return json({ success: false, error: 'Could not replace this file. Please try again.' }, 400);
  }

  const oldPath = current.file_path as string | null;
  if (oldPath) {
    await client.storage.from(COA_BUCKET).remove([oldPath]);
  }

  const productLabel = await resolveCoaProductLabel(client, (current.product_id as string) ?? null);
  await logCoaAudit({
    actorUserId: session.userId,
    action: 'coa_file_replaced',
    coaId: id,
    productLabel,
    peptideName: current.peptide_name as string,
    changes: {
      file_path: { old: current.file_path, new: newPath },
      original_filename: { old: current.original_filename, new: originalFilename },
      file_mime_type: { old: current.file_mime_type, new: file.type },
      file_size_bytes: { old: current.file_size_bytes, new: file.size },
    },
  });

  return json({ success: true, data }, 200);
};
