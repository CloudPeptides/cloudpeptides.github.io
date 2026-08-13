/**
 * Pure helpers for the admin password-recovery flow (src/pages/api/
 * auth/forgot-password.ts, reset-password.ts) — kept out of the route
 * handlers so the validation/token-inspection logic is unit-testable
 * directly, matching src/lib/form-validation.ts's own established
 * pattern.
 */

export const MIN_PASSWORD_LENGTH = 8;

export function validateNewPassword(
  password: string,
  confirmPassword: string,
): { valid: boolean; error?: string } {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match.' };
  }
  return { valid: true };
}

/**
 * Confirms an access token was actually issued via Supabase's recovery
 * flow (the `amr` — authentication methods reference — claim), not
 * just "any currently-valid session token." Defense in depth: without
 * this, anyone holding a valid but non-recovery access/refresh token
 * pair for an account could reach the reset-password endpoint and
 * change that account's password outside of a real recovery attempt.
 * Never call this on a token that hasn't already been confirmed
 * genuine by Supabase itself (exchangeCodeForSession/setSession) —
 * decoding a JWT's payload proves nothing about authenticity by
 * itself, mirroring src/lib/auth.ts's own decodeJwtRole() warning.
 *
 * Verified against a real (unconsumed, admin.generateLink()-produced —
 * never sent by email, so this never touched the project's mailer
 * quota) Supabase-issued recovery session on 2026-08-08: the amr entry
 * this app actually receives is `{ method: 'otp', ... }`, not
 * `{ method: 'recovery', ... }` as originally assumed — that wrong
 * assumption shipped to production and made every real recovery link
 * fail with the generic "invalid or expired" message. 'recovery' is
 * kept alongside 'otp' defensively in case a different Supabase
 * version/config ever emits it. Matching bare 'otp' is safe in this
 * app specifically because no other flow here ever produces an
 * otp-method session (login.ts only ever calls signInWithPassword) —
 * if a passwordless/magic-link sign-in is ever added, this check must
 * be revisited, since it would then also satisfy this condition.
 */
export function isRecoverySession(accessToken: string): boolean {
  try {
    const payload = accessToken.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json) as { amr?: Array<{ method?: unknown }> };
    return (
      Array.isArray(claims.amr) &&
      claims.amr.some((entry) => entry?.method === 'otp' || entry?.method === 'recovery')
    );
  } catch {
    return false;
  }
}

/** Maps a known-safe subset of Supabase's own updateUser() error
 * messages to user-facing guidance; anything else collapses to a
 * generic message rather than relaying internal error detail. */
export function describePasswordUpdateError(message: string | undefined | null): string {
  const text = message ?? '';
  if (/different from the old password/i.test(text)) {
    return 'Your new password must be different from your current password.';
  }
  if (/at least/i.test(text)) {
    return text;
  }
  return 'Could not update your password. Please request a new reset link and try again.';
}

/** The redirect Supabase's recovery email sends the browser back to —
 * derived from the actual request origin so the identical code
 * produces the correct URL on both production and staging, rather than
 * a hardcoded hostname. Must be present in Supabase Auth's redirect
 * allow-list or the recovery link silently falls back to the project's
 * (unrelated) Site URL instead. */
export function buildResetRedirectUrl(origin: string): string {
  return `${origin}/admin/reset-password`;
}

/** Same as buildResetRedirectUrl, for the public researcher-account
 * gate's own /reset-password page (src/pages/api/account/
 * forgot-password.ts) — a separate URL so an admin recovery link and a
 * researcher recovery link can never be confused for one another, even
 * though both ultimately call the same exchange/updateUser logic. */
export function buildAccountResetRedirectUrl(origin: string): string {
  return `${origin}/reset-password`;
}
