/**
 * contact_submissions / contact_submission_replies data access — shared
 * by src/pages/api/contact.ts (insert, own-row RLS) and the admin
 * contact-submissions pages/routes (list/get/reply, admin-role RLS).
 * See supabase/migrations/20260820100000_contact_submissions.sql for
 * the full schema/RLS reasoning, and src/lib/order-requests.ts for the
 * pattern this deliberately mirrors.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export type ContactSubmissionStatus = 'new' | 'read' | 'replied';

export const CONTACT_SUBMISSION_STATUSES: ContactSubmissionStatus[] = ['new', 'read', 'replied'];

export interface ContactSubmissionRow {
  id: string;
  researcher_user_id: string | null;
  name: string;
  email: string;
  message: string;
  status: ContactSubmissionStatus;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmissionReplyRow {
  id: string;
  submission_id: string;
  admin_user_id: string | null;
  body: string;
  resend_message_id: string | null;
  sent_at: string;
  created_at: string;
}

/** Inserts the contact_submissions row under the submitting
 * researcher's own user-scoped client (src/pages/api/contact.ts) —
 * RLS (`researcher_user_id = auth.uid()`) is the real boundary, not
 * this function. */
export async function insertContactSubmission(
  client: SupabaseClient,
  input: { researcherUserId: string; name: string; email: string; message: string },
): Promise<ContactSubmissionRow> {
  const { data, error } = await client
    .from('contact_submissions')
    .insert({
      researcher_user_id: input.researcherUserId,
      name: input.name,
      email: input.email,
      message: input.message,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as ContactSubmissionRow;
}

// ---------------------------------------------------------------------
// Admin read/list/reply surface
// ---------------------------------------------------------------------
export interface ContactSubmissionListFilters {
  status?: ContactSubmissionStatus;
  search?: string;
  sort?: 'newest' | 'oldest';
  page: number;
  pageSize: number;
}

export async function listContactSubmissionsForAdmin(
  client: SupabaseClient,
  filters: ContactSubmissionListFilters,
): Promise<{ rows: ContactSubmissionRow[]; total: number }> {
  let query = client.from('contact_submissions').select('*', { count: 'exact' });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.search) {
    const term = filters.search.trim();
    if (term) {
      query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,message.ilike.%${term}%`);
    }
  }
  query = query.order('created_at', { ascending: filters.sort === 'oldest' });

  const start = (filters.page - 1) * filters.pageSize;
  const end = start + filters.pageSize - 1;
  const { data, count, error } = await query.range(start, end);
  if (error) throw error;
  return { rows: (data ?? []) as ContactSubmissionRow[], total: count ?? 0 };
}

export async function getContactSubmissionCounts(
  client: SupabaseClient,
): Promise<Record<ContactSubmissionStatus, number> & { total: number }> {
  const { data, error } = await client.from('contact_submissions').select('status');
  if (error) throw error;
  const counts = Object.fromEntries(CONTACT_SUBMISSION_STATUSES.map((s) => [s, 0])) as Record<
    ContactSubmissionStatus,
    number
  >;
  for (const row of data ?? []) {
    const status = row.status as ContactSubmissionStatus;
    if (status in counts) counts[status]++;
  }
  return { ...counts, total: (data ?? []).length };
}

export interface ContactSubmissionDetail {
  submission: ContactSubmissionRow;
  replies: ContactSubmissionReplyRow[];
}

export async function getContactSubmissionDetail(
  client: SupabaseClient,
  id: string,
): Promise<ContactSubmissionDetail | null> {
  const { data: submission, error } = await client
    .from('contact_submissions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!submission) return null;

  const { data: replies, error: repliesError } = await client
    .from('contact_submission_replies')
    .select('*')
    .eq('submission_id', id)
    .order('sent_at', { ascending: false });
  if (repliesError) throw repliesError;

  return {
    submission: submission as ContactSubmissionRow,
    replies: (replies ?? []) as ContactSubmissionReplyRow[],
  };
}

/** Marks a submission 'read' — only ever called from a 'new' row (the
 * caller checks first), so this never downgrades an already-'replied'
 * submission back to a lesser state. */
export async function markContactSubmissionRead(
  client: SupabaseClient,
  submissionId: string,
): Promise<void> {
  const { error } = await client
    .from('contact_submissions')
    .update({ status: 'read' })
    .eq('id', submissionId)
    .eq('status', 'new');
  if (error) {
    console.error('contact_submissions read-status update failed:', error.message);
  }
}

/** Records a sent reply and marks the submission 'replied' — the email
 * send itself happens in the caller (src/pages/api/admin/
 * contact-submissions/[id]/reply.ts), matching checkout.ts/contact.ts's
 * existing convention of keeping the Resend call in the route, not in
 * this data-access module. */
export async function addContactSubmissionReply(
  client: SupabaseClient,
  input: {
    submissionId: string;
    adminUserId: string;
    body: string;
    resendMessageId: string | null;
  },
): Promise<ContactSubmissionReplyRow> {
  const { data, error } = await client
    .from('contact_submission_replies')
    .insert({
      submission_id: input.submissionId,
      admin_user_id: input.adminUserId,
      body: input.body,
      resend_message_id: input.resendMessageId,
    })
    .select('*')
    .single();
  if (error) throw error;

  const { error: statusError } = await client
    .from('contact_submissions')
    .update({ status: 'replied' })
    .eq('id', input.submissionId);
  if (statusError) throw statusError;

  return data as ContactSubmissionReplyRow;
}
