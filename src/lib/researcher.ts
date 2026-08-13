/**
 * researcher_profiles / researcher_attestations data access — shared by
 * the middleware gate (src/middleware.ts), the public account routes
 * (src/pages/api/account/*), and the admin researcher-management pages
 * (src/pages/admin/researchers/*, src/pages/api/admin/researchers/*).
 *
 * Every function here takes the caller's own client (user-scoped via
 * createUserScopedClient(), or the service client for the one
 * pre-session-exists registration path) — RLS is the real boundary, as
 * everywhere else in this codebase (src/lib/auth.ts's own header
 * comment).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AttestationVersions, LatestAttestation } from './researcher-certification';

export interface ResearcherProfile {
  user_id: string;
  full_name: string;
  country: string;
  region: string | null;
  research_affiliation: string;
  account_status: 'active' | 'suspended';
  suspended_at: string | null;
  suspended_reason: string | null;
  suspended_by: string | null;
  force_recertify_after: string | null;
  created_at: string;
  updated_at: string;
}

const PROFILE_COLUMNS =
  'user_id, full_name, country, region, research_affiliation, account_status, suspended_at, suspended_reason, suspended_by, force_recertify_after, created_at, updated_at';

export async function getResearcherProfile(
  client: SupabaseClient,
  userId: string,
): Promise<ResearcherProfile | null> {
  const { data, error } = await client
    .from('researcher_profiles')
    .select(PROFILE_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as ResearcherProfile | null;
}

export async function getLatestAttestation(
  client: SupabaseClient,
  userId: string,
): Promise<LatestAttestation | null> {
  const { data, error } = await client
    .from('researcher_attestations')
    .select('certification_version, accepted_at')
    .eq('user_id', userId)
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as LatestAttestation | null;
}

export interface NewResearcherProfileInput {
  userId: string;
  fullName: string;
  country: string;
  region: string | null;
  researchAffiliation: string;
}

/** Registration-only: called with the service client, before the new
 * user has any session of their own (see src/pages/api/account/
 * register.ts's header comment for why). */
export async function insertResearcherProfile(
  client: SupabaseClient,
  input: NewResearcherProfileInput,
): Promise<void> {
  const { error } = await client.from('researcher_profiles').insert({
    user_id: input.userId,
    full_name: input.fullName,
    country: input.country,
    region: input.region,
    research_affiliation: input.researchAffiliation,
  });
  if (error) throw error;
}

export interface NewAttestationInput {
  userId: string;
  versions: AttestationVersions;
  country: string;
  region: string | null;
  emailVerifiedAtAcceptance: boolean;
}

export async function insertAttestation(
  client: SupabaseClient,
  input: NewAttestationInput,
): Promise<void> {
  const { error } = await client.from('researcher_attestations').insert({
    user_id: input.userId,
    account_type: 'independent_researcher',
    certification_version: input.versions.certification_version,
    research_use_policy_version: input.versions.research_use_policy_version,
    terms_version: input.versions.terms_version,
    privacy_version: input.versions.privacy_version,
    country: input.country,
    region: input.region,
    email_verified_at_acceptance: input.emailVerifiedAtAcceptance,
  });
  if (error) throw error;
}

/** Admin researcher list — one row per researcher_profiles entry, plus
 * that user's email/last-sign-in from Auth (requires the service
 * client; only ever called from admin-authorized routes, same pattern
 * as src/lib/admin/users.ts's listUsersWithRoles). */
export interface AdminResearcherRow extends ResearcherProfile {
  email: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  latest_certification_version: string | null;
  latest_certification_accepted_at: string | null;
}

export async function listResearchersForAdmin(
  service: SupabaseClient,
): Promise<AdminResearcherRow[]> {
  const [{ data: profiles, error: profileError }, { data: attestations, error: attestationError }] =
    await Promise.all([
      service.from('researcher_profiles').select(PROFILE_COLUMNS).order('created_at', {
        ascending: false,
      }),
      service
        .from('researcher_attestations')
        .select('user_id, certification_version, accepted_at')
        .order('accepted_at', { ascending: false }),
    ]);
  if (profileError) throw profileError;
  if (attestationError) throw attestationError;

  const latestByUser = new Map<string, { certification_version: string; accepted_at: string }>();
  for (const row of attestations ?? []) {
    if (!latestByUser.has(row.user_id)) {
      latestByUser.set(row.user_id, {
        certification_version: row.certification_version,
        accepted_at: row.accepted_at,
      });
    }
  }

  const { data: userList, error: listError } = await service.auth.admin.listUsers({
    perPage: 500,
  });
  if (listError) throw listError;
  const authByUser = new Map(userList.users.map((u) => [u.id, u]));

  return (profiles ?? []).map((p) => {
    const authUser = authByUser.get(p.user_id);
    const latest = latestByUser.get(p.user_id) ?? null;
    return {
      ...(p as ResearcherProfile),
      email: authUser?.email ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
      email_confirmed_at: authUser?.email_confirmed_at ?? null,
      latest_certification_version: latest?.certification_version ?? null,
      latest_certification_accepted_at: latest?.accepted_at ?? null,
    };
  });
}
