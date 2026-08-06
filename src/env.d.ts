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
  };
}
