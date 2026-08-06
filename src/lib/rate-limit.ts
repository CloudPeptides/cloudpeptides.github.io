/**
 * Rate limiting + cooldown for the two public form routes
 * (src/pages/api/contact.ts, checkout.ts).
 *
 * Primary layer: Cloudflare's native Workers Rate Limiting binding
 * (wrangler.jsonc's `ratelimits`, env.FORM_RATE_LIMITER) — durable
 * across requests regardless of which isolate/PoP handles them, unlike
 * this file's previous in-memory Map (which only held for one Worker
 * isolate's lifetime and reset on cold start). `checkRateLimit` takes
 * the binding itself so it stays unit-testable with a fake.
 *
 * Secondary layer, kept but demoted per explicit instruction: a
 * short-lived per-browser cookie that blocks rapid resubmission from
 * the same browser even if the primary check is somehow bypassed.
 */

export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export async function checkRateLimit(
  binding: RateLimitBinding,
  key: string,
): Promise<{ allowed: boolean }> {
  const outcome = await binding.limit({ key });
  return { allowed: outcome.success };
}

const COOLDOWN_COOKIE_NAME = 'cp-form-cooldown';
const COOLDOWN_MS = 30 * 1000; // 30 seconds between submissions, same browser

export function isInCooldown(cookieHeader: string | null, now: number = Date.now()): boolean {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(new RegExp(`${COOLDOWN_COOKIE_NAME}=(\\d+)`));
  if (!match) return false;
  const until = Number(match[1]);
  return Number.isFinite(until) && now < until;
}

export function cooldownSetCookieHeader(now: number = Date.now()): string {
  const until = now + COOLDOWN_MS;
  return `${COOLDOWN_COOKIE_NAME}=${until}; Max-Age=${Math.ceil(COOLDOWN_MS / 1000)}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}
