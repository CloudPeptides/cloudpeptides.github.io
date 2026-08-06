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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
