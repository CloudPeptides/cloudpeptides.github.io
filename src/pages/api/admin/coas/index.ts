/**
 * Admin COA creation — upload a file + enter its metadata in one step.
 * Always creates the row as status='draft'; publishing is a separate
 * PATCH to src/pages/api/admin/coas/[id].ts, matching the
 * upload-then-publish workflow described in the approved product
 * decision ("upload a COA... publish or unpublish it").
 *
 * Uses the caller's own verified JWT (createUserScopedClient), not
 * service-role — RLS (batch_coas_all_admin,
 * coa_documents_admin_write, supabase/migrations/
 * 20260808150000_commerce_coa_gallery.sql) is the real authorization
 * boundary for both the metadata row and the Storage upload; the
 * hasMinRole() check below is defense-in-depth for a clear 403 instead
 * of an opaque RLS/Storage error, same pattern as every other admin
 * content route in this app.
 *
 * src/middleware.ts has already confirmed the caller is signed in with
 * at least 'contributor' before this file ever runs, and — since this
 * path starts with /api/admin — automatically inherits the
 * STAGING_READ_ONLY boundary for every non-GET method with zero extra
 * code here.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createUserScopedClient, hasMinRole, isSameOriginRequest } from '../../../../lib/auth';
import {
  generateStoragePath,
  sanitizeOriginalFilename,
  validateCoaFile,
  MAX_COA_FILE_BYTES,
} from '../../../../lib/coa-file-validation';
import { COA_BUCKET } from '../../../../lib/coas';
import { isSingleLineSafe, sanitizeText } from '../../../../lib/form-validation';
import { checkRateLimit } from '../../../../lib/rate-limit';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Generous headroom over MAX_COA_FILE_BYTES for multipart boundaries/
// other form fields — rejected before ever calling request.formData(),
// which would otherwise buffer the whole body regardless.
const MAX_REQUEST_BYTES = MAX_COA_FILE_BYTES + 65_536;

export const POST: APIRoute = async ({ request, url, locals }) => {
  const session = locals.session!; // guaranteed by middleware for /api/admin/*
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

  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `coa-create:${session.userId}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
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

  const peptideName = sanitizeText(form.get('peptide_name'), 200);
  const batchIdentifier = sanitizeText(form.get('batch_identifier'), 200);
  const testingLab = sanitizeText(form.get('testing_lab'), 200);
  const testDate = sanitizeText(form.get('test_date'), 20);
  const verificationUrl = sanitizeText(form.get('verification_url'), 500);
  const notes = sanitizeText(form.get('notes'), 4000);
  const purityResult = sanitizeText(form.get('purity_result'), 200);
  const testingMethod = sanitizeText(form.get('testing_method'), 200);

  if (!peptideName || !testingLab || !testDate) {
    return json(
      { success: false, error: 'Peptide name, testing lab, and test date are required.' },
      400,
    );
  }
  if (![peptideName, batchIdentifier, testingLab, verificationUrl, testingMethod].every(isSingleLineSafe)) {
    return json({ success: false, error: 'Invalid characters in submitted fields.' }, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(testDate)) {
    return json({ success: false, error: 'Test date must be a valid date.' }, 400);
  }

  const originalFilename = sanitizeOriginalFilename(file.name);
  const storagePath = generateStoragePath(fileCheck.kind);
  const client = createUserScopedClient(session.accessToken);

  const { error: uploadError } = await client.storage
    .from(COA_BUCKET)
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) {
    return json({ success: false, error: 'Could not upload the file. Please try again.' }, 502);
  }

  const { data, error: insertError } = await client
    .from('batch_coas')
    .insert({
      peptide_name: peptideName,
      batch_identifier: batchIdentifier || null,
      testing_lab: testingLab,
      test_date: testDate,
      verification_url: verificationUrl || null,
      notes: notes || null,
      purity_result: purityResult || null,
      testing_method: testingMethod || null,
      file_path: storagePath,
      file_mime_type: file.type,
      file_size_bytes: file.size,
      original_filename: originalFilename,
      status: 'draft',
      created_by: session.userId,
    })
    .select()
    .maybeSingle();

  if (insertError || !data) {
    // Roll back the just-uploaded object rather than leaving an
    // orphaned file with no metadata row referencing it.
    await client.storage.from(COA_BUCKET).remove([storagePath]);
    return json(
      { success: false, error: 'Could not save this COA. Check your permissions and input.' },
      400,
    );
  }

  return json({ success: true, data }, 201);
};
