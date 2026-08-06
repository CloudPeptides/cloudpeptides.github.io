/**
 * Best-effort rate limiting with no new Cloudflare resource provisioned
 * (no KV/Durable Object binding) — astro.config.mjs already documents a
 * deliberate house rule against auto-provisioning bindings that aren't
 * in active use (see its `session: false` comment), so a new KV
 * namespace for this alone isn't added without asking first.
 *
 * Two layers, both applied by the calling route:
 *  1. `checkRateLimit` — an in-memory sliding-window counter, keyed by
 *     client IP. Real but soft: it only holds for the lifetime of one
 *     Worker isolate (resets on cold start, doesn't share across
 *     Cloudflare PoPs), so treat it as a speed bump against casual
 *     abuse from one place, not a hard distributed limit.
 *  2. A short-lived cookie (set by the route, see
 *     src/pages/api/contact.ts / checkout.ts) that blocks rapid
 *     resubmission from the same browser regardless of isolate state.
 *
 * If stronger guarantees are ever needed, upgrading to Workers KV is
 * the natural next step — that's a new-resource decision, not made
 * here.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

const requestLog = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  now: number = Date.now(),
  log: Map<string, number[]> = requestLog,
): { allowed: boolean; retryAfterMs?: number } {
  const timestamps = (log.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = timestamps[0];
    log.set(key, timestamps);
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - oldest) };
  }
  timestamps.push(now);
  log.set(key, timestamps);
  return { allowed: true };
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
