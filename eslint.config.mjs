// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';
import globals from 'globals';

export default defineConfig(
  globalIgnores(['dist/**', '.astro/**', 'node_modules/**', 'legacy-site/**', '.wrangler/**']),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintPluginAstro.configs.recommended,
  // Note: eslint-plugin-jsx-a11y is intentionally not included — its
  // latest published version only supports ESLint ^9, while
  // eslint-plugin-astro requires ESLint >=10 (an unresolved upstream
  // peer-dependency conflict as of this writing). This project has no
  // JSX/React (see CLAUDE.md §4), so jsx-a11y's JSX-shaped rules would
  // have had nothing to lint here regardless. eslint-plugin-astro's own
  // "recommended" ruleset (applied above) still lints .astro templates.
  {
    // Node-environment scripts (migration/build tooling) plus the
    // root-level *.config.mjs files themselves (astro.config.mjs,
    // this file) — none of these are browser code, so they get Node
    // globals (process, console, URL, Buffer, …) instead of the
    // browser globals the rest of the app assumes. astro.config.mjs
    // specifically needs `process.env` — added 2026-08-08 alongside
    // its own SITE_ENV-conditional configPath (see that file's own
    // comment).
    files: ['scripts/**/*.mjs', '*.config.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // The admin PWA's service worker (public/admin/sw.js) runs in the
    // ServiceWorkerGlobalScope, not a normal browser window — `self`,
    // `caches`, `fetch`, `URL` etc. are that scope's own globals, not
    // undefined references. It's a static public/ file (never bundled
    // by Vite/Astro), so this is the only place it's linted at all.
    files: ['public/admin/sw.js'],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
  {
    // Ambient declaration files legitimately use triple-slash references
    // — it's the standard Astro convention for env.d.ts specifically,
    // not something an `import` can replace.
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
);
