import { describe, expect, it } from 'vitest';
import {
  checkRateLimit,
  cooldownSetCookieHeader,
  isInCooldown,
  type RateLimitBinding,
} from '../../src/lib/rate-limit';

function fakeBinding(success: boolean): RateLimitBinding {
  return { limit: async () => ({ success }) };
}

describe('checkRateLimit (Cloudflare native binding)', () => {
  it('allows when the binding reports success', async () => {
    const result = await checkRateLimit(fakeBinding(true), 'contact:1.2.3.4');
    expect(result.allowed).toBe(true);
  });

  it('blocks when the binding reports failure', async () => {
    const result = await checkRateLimit(fakeBinding(false), 'contact:1.2.3.4');
    expect(result.allowed).toBe(false);
  });

  it('passes the exact key through to the binding', async () => {
    let seenKey: string | undefined;
    const binding: RateLimitBinding = {
      limit: async (opts) => {
        seenKey = opts.key;
        return { success: true };
      },
    };
    await checkRateLimit(binding, 'checkout:5.6.7.8');
    expect(seenKey).toBe('checkout:5.6.7.8');
  });
});

describe('cooldown cookie (secondary defense)', () => {
  it('is not in cooldown with no cookie header', () => {
    expect(isInCooldown(null)).toBe(false);
    expect(isInCooldown('')).toBe(false);
  });

  it('a freshly-set cookie is in cooldown right after', () => {
    const now = 1_000_000;
    const setCookie = cooldownSetCookieHeader(now);
    const value = setCookie.split(';')[0];
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
