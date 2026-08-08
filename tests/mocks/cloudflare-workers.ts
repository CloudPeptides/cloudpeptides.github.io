/**
 * Vitest-only stand-in for the `cloudflare:workers` virtual module
 * (only resolvable inside the real Workers/Miniflare runtime). Aliased
 * in vitest.config.ts so files that `import { env } from
 * 'cloudflare:workers'` (src/lib/auth.ts) can still be unit-tested for
 * their pure logic — nothing here needs real secret values since the
 * functions under test never call createServiceClient()/read env at
 * the module level.
 */
export const env: Record<string, string | undefined> = {};
