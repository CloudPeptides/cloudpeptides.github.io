import { describe, expect, it } from 'vitest';
import {
  buildSessionCookies,
  clearSessionCookies,
  hasMinRole,
  isSameOriginRequest,
  readSessionCookies,
  type Role,
} from '../../src/lib/auth';

describe('hasMinRole', () => {
  const roles: Role[] = ['member', 'contributor', 'editor', 'admin'];

  it('ranks roles from lowest (member) to highest (admin)', () => {
    expect(hasMinRole('member', 'contributor')).toBe(false);
    expect(hasMinRole('contributor', 'contributor')).toBe(true);
    expect(hasMinRole('editor', 'contributor')).toBe(true);
    expect(hasMinRole('admin', 'contributor')).toBe(true);
  });

  it('a contributor can never satisfy an editor+ requirement', () => {
    expect(hasMinRole('contributor', 'editor')).toBe(false);
  });

  it('an editor can never satisfy an admin-only requirement', () => {
    expect(hasMinRole('editor', 'admin')).toBe(false);
    expect(hasMinRole('admin', 'admin')).toBe(true);
  });

  it('treats null/undefined role as unauthorized for every requirement', () => {
    for (const min of roles) {
      expect(hasMinRole(null, min)).toBe(false);
      expect(hasMinRole(undefined, min)).toBe(false);
    }
  });
});

describe('isSameOriginRequest', () => {
  it('allows a request with no Origin header at all', () => {
    const request = new Request(
      'https://cloudpeptides-staging.example/api/admin/content/compounds',
    );
    expect(
      isSameOriginRequest(
        request,
        new URL('https://cloudpeptides-staging.example/api/admin/content/compounds'),
      ),
    ).toBe(true);
  });

  it('allows a request whose Origin matches the request URL', () => {
    const request = new Request('https://cloudpeptides-staging.example/api/auth/login', {
      headers: { Origin: 'https://cloudpeptides-staging.example' },
    });
    expect(
      isSameOriginRequest(request, new URL('https://cloudpeptides-staging.example/api/auth/login')),
    ).toBe(true);
  });

  it('rejects a cross-site Origin — the actual CSRF defense', () => {
    const request = new Request('https://cloudpeptides-staging.example/api/auth/login', {
      headers: { Origin: 'https://evil.example' },
    });
    expect(
      isSameOriginRequest(request, new URL('https://cloudpeptides-staging.example/api/auth/login')),
    ).toBe(false);
  });

  it('rejects a malformed Origin header rather than throwing', () => {
    const request = new Request('https://cloudpeptides-staging.example/api/auth/login', {
      headers: { Origin: 'not-a-url' },
    });
    expect(
      isSameOriginRequest(request, new URL('https://cloudpeptides-staging.example/api/auth/login')),
    ).toBe(false);
  });
});

describe('session cookies', () => {
  it('builds HttpOnly, SameSite=Lax cookies for both tokens', () => {
    const cookies = buildSessionCookies('access-tok', 'refresh-tok', true);
    expect(cookies).toHaveLength(2);
    expect(cookies[0]).toContain('cp-admin-at=access-tok');
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite=Lax');
    expect(cookies[0]).toContain('Secure');
    expect(cookies[1]).toContain('cp-admin-rt=refresh-tok');
  });

  it('omits Secure over plain http (local dev) so login still works', () => {
    const cookies = buildSessionCookies('a', 'b', false);
    expect(cookies[0]).not.toContain('Secure');
    expect(cookies[1]).not.toContain('Secure');
  });

  it('clearSessionCookies expires both cookies immediately', () => {
    const cookies = clearSessionCookies(true);
    expect(cookies[0]).toContain('cp-admin-at=;');
    expect(cookies[0]).toContain('Max-Age=0');
    expect(cookies[1]).toContain('cp-admin-rt=;');
    expect(cookies[1]).toContain('Max-Age=0');
  });

  it('readSessionCookies extracts both tokens from a Cookie header', () => {
    const { accessToken, refreshToken } = readSessionCookies(
      'other=1; cp-admin-at=abc123; cp-admin-rt=def456',
    );
    expect(accessToken).toBe('abc123');
    expect(refreshToken).toBe('def456');
  });

  it('readSessionCookies returns nulls when cookies are absent', () => {
    const { accessToken, refreshToken } = readSessionCookies(null);
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });
});
