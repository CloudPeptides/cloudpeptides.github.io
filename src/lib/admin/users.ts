/**
 * User/role management — the ONE area of the admin dashboard that uses
 * the service-role key (src/lib/auth.ts's createServiceClient()),
 * because user_roles and the Auth admin API have no client-reachable
 * path at all (Blueprint v2 §16; supabase/migrations/
 * 20260806144905_grants.sql grants user_roles SELECT only, never
 * INSERT/UPDATE/DELETE, to anon or authenticated). Every function here
 * is called ONLY from src/pages/admin/users/*.astro and
 * src/pages/api/admin/users/*, which independently verify the caller
 * is an admin (via their own verified JWT) before ever constructing a
 * service client — this file itself performs no authorization, by
 * design (that's the caller's job, kept in one obvious place per route
 * rather than duplicated/hidden in here).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Role } from '../auth';

export interface AdminUserRow {
  id: string;
  email: string | null;
  role: Role;
  created_at: string;
  last_sign_in_at: string | null;
}

export async function listUsersWithRoles(service: SupabaseClient): Promise<AdminUserRow[]> {
  const [{ data: userList, error: listError }, { data: roleRows, error: roleError }] =
    await Promise.all([
      service.auth.admin.listUsers({ perPage: 200 }),
      service.from('user_roles').select('user_id, role'),
    ]);
  if (listError) throw listError;
  if (roleError) throw roleError;

  const roleByUserId = new Map((roleRows ?? []).map((r) => [r.user_id as string, r.role as Role]));
  return userList.users.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    role: roleByUserId.get(u.id) ?? 'member',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
  }));
}

/**
 * Creates a brand-new auth user with `email_confirm: true` — no
 * confirmation/invite email is ever sent (CLAUDE.md §9: sending real
 * external email requires separate explicit approval, and there is no
 * legitimate reason an internal editorial-account creation flow needs
 * to send one). The admin creating the account is responsible for
 * relaying the password to the new user out of band.
 */
export async function createUserWithRole(
  service: SupabaseClient,
  input: { email: string; password: string; role: Role },
): Promise<{ id: string; email: string | null }> {
  const { data, error } = await service.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (error) throw error;
  const userId = data.user.id;
  const { error: roleError } = await service
    .from('user_roles')
    .upsert({ user_id: userId, role: input.role });
  if (roleError) throw roleError;
  return { id: userId, email: data.user.email ?? null };
}

export async function setUserRole(
  service: SupabaseClient,
  userId: string,
  role: Role,
): Promise<void> {
  const { error } = await service.from('user_roles').upsert({ user_id: userId, role });
  if (error) throw error;
}

export async function writeAuditLog(
  service: SupabaseClient,
  entry: {
    actor_user_id: string;
    action: string;
    target_table?: string;
    target_id?: string;
    detail?: Record<string, unknown>;
  },
): Promise<void> {
  // Best-effort: a logging failure must never mask the outcome of the
  // privileged action it's recording, but it's also never silently
  // ignored — surfaced via console.error so it shows up in Worker logs.
  const { error } = await service.from('audit_log').insert(entry);
  if (error) {
    console.error('audit_log insert failed:', error.message);
  }
}
