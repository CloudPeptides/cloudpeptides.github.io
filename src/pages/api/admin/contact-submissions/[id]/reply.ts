/**
 * Admin reply to a contact-form submission — the only place this app
 * ever sends email on this form's behalf now that inbound notification
 * email is retired (src/pages/api/contact.ts, 2026-08-20). Uses the
 * acting admin's own JWT (createUserScopedClient) for the DB write —
 * RLS (contact_submissions_update_admin,
 * contact_submission_replies_insert_admin) is the real boundary, not
 * this route's own hasMinRole check (defense-in-depth, same pattern as
 * src/pages/api/admin/order-requests/[id]/status.ts). The actual Resend
 * send stays in this route rather than the lib module, matching
 * checkout.ts/contact.ts's existing convention.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createServiceClient, createUserScopedClient, hasMinRole } from '../../../../../lib/auth';
import { writeAuditLog } from '../../../../../lib/admin/users';
import {
  addContactSubmissionReply,
  getContactSubmissionDetail,
} from '../../../../../lib/contact-submissions';
import { sanitizeText } from '../../../../../lib/form-validation';
import { checkRateLimit } from '../../../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../../../lib/request-limits';
import { sendEmail } from '../../../../../lib/resend';

const REPLY_FROM_SUBJECT = 'Re: your message to Cloud Peptides';
const MAX_REPLY_LENGTH = 4000;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, url, locals, params }) => {
  const session = locals.session!;
  const submissionId = params.id;
  if (!submissionId) return json({ success: false, error: 'Missing submission id.' }, 400);

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

  const rate = await checkRateLimit(env.ADMIN_RATE_LIMITER, `contact-reply:${session.userId}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const bodyRead = await readBodyWithLimit(request, 8_192);
  if (!bodyRead.ok) {
    return json({ success: false, error: bodyRead.error ?? 'Invalid request body.' }, 413);
  }
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(bodyRead.text ?? '');
  } catch {
    return json({ success: false, error: 'Invalid request body.' }, 400);
  }

  const replyBody = sanitizeText(input.body, MAX_REPLY_LENGTH);
  if (!replyBody) {
    return json({ success: false, error: 'Reply message is required.' }, 400);
  }

  const apiKey = env.RESEND_API_KEY;
  const fromAddress = env.RESEND_FROM_ADDRESS;
  if (!apiKey || !fromAddress) {
    return json(
      { success: false, error: 'Email delivery is not configured in this environment yet.' },
      503,
    );
  }

  const client = createUserScopedClient(session.accessToken);
  const detail = await getContactSubmissionDetail(client, submissionId).catch(() => null);
  if (!detail) {
    return json({ success: false, error: 'Submission not found.' }, 404);
  }

  const emailResult = await sendEmail({
    apiKey,
    from: fromAddress,
    to: detail.submission.email,
    subject: REPLY_FROM_SUBJECT,
    text: replyBody,
  });
  if (!emailResult.success) {
    console.error('contact-submission reply email failed:', emailResult.error);
    return json(
      { success: false, error: 'Could not send the reply email. Please try again.' },
      502,
    );
  }

  let reply;
  try {
    reply = await addContactSubmissionReply(client, {
      submissionId,
      adminUserId: session.userId,
      body: replyBody,
      resendMessageId: null,
    });
  } catch (err) {
    console.error(
      'contact-submission reply insert failed:',
      err instanceof Error ? err.message : err,
    );
    // The email genuinely sent — telling the admin it failed would be
    // dishonest and could cause a duplicate reply. Report success for
    // the send but surface the record-keeping gap distinctly.
    return json(
      {
        success: true,
        warning: 'Reply email sent, but could not be recorded in the submission history.',
      },
      200,
    );
  }

  try {
    const service = createServiceClient();
    await writeAuditLog(service, {
      actor_user_id: session.userId,
      action: 'contact_submission_reply',
      target_table: 'contact_submissions',
      target_id: submissionId,
      detail: { reply_id: reply.id },
    });
  } catch (err) {
    console.error(
      'contact-submission reply audit log failed:',
      err instanceof Error ? err.message : err,
    );
  }

  return json({ success: true, reply }, 200);
};
