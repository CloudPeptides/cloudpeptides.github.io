import { describe, expect, it } from 'vitest';
import {
  buildResetRedirectUrl,
  describePasswordUpdateError,
  isRecoverySession,
  MIN_PASSWORD_LENGTH,
  validateNewPassword,
} from '../../src/lib/password-reset';

function fakeJwt(payload: Record<string, unknown>): string {
  const base64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.signature`;
}

describe('validateNewPassword', () => {
  it('requires at least MIN_PASSWORD_LENGTH characters', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(validateNewPassword('short1', 'short1').valid).toBe(false);
    expect(validateNewPassword('longenough1', 'longenough1').valid).toBe(true);
  });

  it('rejects a mismatch between password and confirmation', () => {
    const result = validateNewPassword('longenough1', 'longenough2');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/do not match/i);
  });

  it('checks length before match, giving the more specific error first', () => {
    const result = validateNewPassword('short', 'different');
    expect(result.error).toMatch(/at least/i);
  });
});

describe('isRecoverySession', () => {
  it('returns true for a token whose amr claim includes method "recovery"', () => {
    const token = fakeJwt({ amr: [{ method: 'recovery', timestamp: 123 }] });
    expect(isRecoverySession(token)).toBe(true);
  });

  it('returns false for a token issued via ordinary password sign-in', () => {
    const token = fakeJwt({ amr: [{ method: 'password', timestamp: 123 }] });
    expect(isRecoverySession(token)).toBe(false);
  });

  it('returns false when the amr claim is absent entirely', () => {
    const token = fakeJwt({ sub: 'user-1' });
    expect(isRecoverySession(token)).toBe(false);
  });

  it('returns false for a malformed token rather than throwing', () => {
    expect(isRecoverySession('not-a-jwt')).toBe(false);
    expect(isRecoverySession('')).toBe(false);
  });
});

describe('describePasswordUpdateError', () => {
  it('gives specific guidance for a same-as-old-password rejection', () => {
    expect(
      describePasswordUpdateError('New password should be different from the old password.'),
    ).toMatch(/different from your current password/i);
  });

  it('passes through a Supabase minimum-length message verbatim', () => {
    const message = 'Password should be at least 6 characters.';
    expect(describePasswordUpdateError(message)).toBe(message);
  });

  it('falls back to a generic message for anything else, never leaking internal detail', () => {
    expect(describePasswordUpdateError('some internal Postgres constraint violation')).toMatch(
      /could not update your password/i,
    );
    expect(describePasswordUpdateError(undefined)).toMatch(/could not update your password/i);
    expect(describePasswordUpdateError(null)).toMatch(/could not update your password/i);
  });
});

describe('buildResetRedirectUrl', () => {
  it('appends /admin/reset-password to the given origin', () => {
    expect(buildResetRedirectUrl('https://cloudpeptides.org')).toBe(
      'https://cloudpeptides.org/admin/reset-password',
    );
  });

  it('works identically for the staging origin — no hardcoded hostname', () => {
    expect(
      buildResetRedirectUrl('https://cloudpeptides-staging.jessica-holsopple3.workers.dev'),
    ).toBe('https://cloudpeptides-staging.jessica-holsopple3.workers.dev/admin/reset-password');
  });
});
