/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Client-safe — the Supabase anon key is meaningless without RLS behind it. */
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  /**
   * Explicit opt-in flag gating the dev-only fixture preview (see
   * src/lib/fixtures.ts). Deliberately NOT `import.meta.env.DEV`:
   * verified live that the Cloudflare adapter's `astro preview` (used by
   * the e2e/build verification suite, not just `astro dev`) also
   * evaluates DEV as true, which would have let fixture content leak
   * into what's supposed to be an honest build+preview check. This flag
   * must never be set in `.env.local`, CI vars/secrets, or any Cloudflare
   * environment — only ever exported ephemerally in the shell command
   * that launches a one-off local review server.
   */
  readonly PUBLIC_ENABLE_DEV_FIXTURES?: string;
  /** Turnstile sitekeys are designed to be public (unlike the secret
   * key) — safe under the PUBLIC_ prefix, read client-side to render
   * the widget (src/scripts/turnstile-widget.ts). */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    /** Set by src/middleware.ts — true only when the live request's
     * hostname matches astro.config.mjs's configured `site` (the
     * intended production domain). False on the *.workers.dev staging
     * Worker, local dev, and any other host. Read by BaseLayout.astro
     * to default the <meta name="robots"> tag. */
    indexable: boolean;
    /** Per-request Content-Security-Policy script-src nonce, set by
     * src/middleware.ts before the page renders. Pass to every inline
     * `<script>` tag's `nonce` attribute. Undefined for prerendered/
     * static routes (middleware doesn't run at build time) — those
     * routes' CSP (scripts/postbuild-headers.mjs) allows inline scripts
     * by a different, documented allowance instead, so an absent nonce
     * attribute there is expected, not a bug. */
    cspNonce: string;
    /** Resolved, server-verified admin session (src/lib/auth.ts),
     * populated by src/middleware.ts for every /admin and /api/admin
     * request so pages/routes don't each re-verify the cookie
     * themselves. Null for every other route (never resolved there —
     * no reason to pay the verification round-trip on public pages)
     * and for /admin/login itself. */
    session: import('./lib/auth').Session | null;
    /** Set by src/middleware.ts from env.STAGING_READ_ONLY — true only
     * on the staging Worker after production has launched. Purely
     * informational here (drives AdminLayout.astro's read-only banner)
     * — the actual write-blocking enforcement lives in middleware.ts
     * itself, server-side, regardless of what any page renders. */
    stagingReadOnly: boolean;
  }
}

/**
 * Narrow, hand-written ambient types for the two Worker-only secrets
 * (src/pages/api/contact.ts, checkout.ts) — deliberately NOT generated
 * via `wrangler types` / worker-configuration.d.ts. That generated file
 * pulls in Cloudflare's full Workers runtime type library, which
 * declares its own global `Element` interface (part of their
 * HTMLRewriter API) that merges with — and breaks — the browser DOM
 * lib's `Element` used throughout this project's client scripts and
 * tests (confirmed live: regenerating it caused 45 cascading
 * `HTMLSelectElement`/`dispatchEvent`/`.value` type errors in files
 * that were never touched). Hand-typing just the two var names needed
 * avoids that collision entirely; extend this if more Worker-only env
 * vars are ever added.
 */
declare module 'cloudflare:workers' {
  export const env: {
    RESEND_API_KEY?: string;
    RESEND_FROM_ADDRESS?: string;
    /** Server-only — validated via Turnstile's siteverify API
     * (src/lib/turnstile.ts), never sent to the client. */
    TURNSTILE_SECRET_KEY?: string;
    /** Cloudflare's native Workers Rate Limiting binding
     * (wrangler.jsonc's `ratelimits`) — durable across requests
     * regardless of which isolate/PoP handles them, replacing the prior
     * in-memory-only limiter. Shape confirmed against wrangler's own
     * generated types, not guessed:
     * https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/ */
    FORM_RATE_LIMITER: {
      limit(options: { key: string }): Promise<{ success: boolean }>;
    };
    /** Server-only, bypasses RLS entirely — read only by
     * src/lib/auth.ts's createServiceClient(), used only inside
     * src/pages/api/admin/users/* (user_roles/audit_log have no client
     * write grant at all, per supabase/migrations/20260806144905_grants.sql,
     * so no other code path is even possible). Never referenced from
     * client-shipped code. Set via `wrangler secret put
     * SUPABASE_SERVICE_ROLE_KEY --config wrangler.jsonc`, never written
     * to any file. */
    SUPABASE_SERVICE_ROLE_KEY?: string;
    /** Plain Worker var (not a secret — never sensitive), unset/"false"
     * everywhere except staging after production launches. See
     * src/lib/site-env.ts's isStagingReadOnly() for the full reasoning:
     * staging and production share one Supabase project, so this is
     * the application-level control that stops the staging Worker from
     * writing to what is, after cutover, the real production database.
     * Read once, centrally, in src/middleware.ts — never per-route. */
    STAGING_READ_ONLY?: string;
  };
}
