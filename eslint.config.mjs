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
    // Node-environment scripts (migration/build tooling) — not browser
    // code, so they get Node globals (process, console, URL, Buffer, …)
    // instead of the browser globals the rest of the app assumes.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
);
