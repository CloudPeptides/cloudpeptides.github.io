import { describe, expect, it } from 'vitest';
import { checkRateLimit, cooldownSetCookieHeader, isInCooldown } from '../../src/lib/rate-limit';

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const log = new Map<string, number[]>();
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit('1.2.3.4', now + i, log).allowed).toBe(true);
    }
  });

  it('blocks the 6th request within the window', () => {
    const log = new Map<string, number[]>();
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) checkRateLimit('1.2.3.4', now + i, log);
    const result = checkRateLimit('1.2.3.4', now + 5, log);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('allows again once the window has passed', () => {
    const log = new Map<string, number[]>();
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) checkRateLimit('1.2.3.4', now + i, log);
    const later = now + 11 * 60 * 1000;
    expect(checkRateLimit('1.2.3.4', later, log).allowed).toBe(true);
  });

  it('tracks different keys independently', () => {
    const log = new Map<string, number[]>();
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) checkRateLimit('1.2.3.4', now + i, log);
    expect(checkRateLimit('5.6.7.8', now, log).allowed).toBe(true);
  });
});

describe('cooldown cookie', () => {
  it('is not in cooldown with no cookie header', () => {
    expect(isInCooldown(null)).toBe(false);
    expect(isInCooldown('')).toBe(false);
  });

  it('a freshly-set cookie is in cooldown right after', () => {
    const now = 1_000_000;
    const setCookie = cooldownSetCookieHeader(now);
    const value = setCookie.split(';')[0]; // "cp-form-cooldown=1030000"
    expect(isInCooldown(value, now + 1000)).toBe(true);
  });

  it('cooldown expires after its window', () => {
    const now = 1_000_000;
    const setCookie = cooldownSetCookieHeader(now);
    const value = setCookie.split(';')[0];
    expect(isInCooldown(value, now + 31_000)).toBe(false);
  });

  it('ignores unrelated cookies', () => {
    expect(isInCooldown('some_other_cookie=abc')).toBe(false);
  });
});
