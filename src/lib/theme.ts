/**
 * Pure theme-resolution logic, extracted from src/scripts/theme-toggle.ts
 * so it's unit-testable without a DOM. The anti-FOUC inline bootstrap
 * script in BaseLayout.astro duplicates this same logic inline (it must
 * run before any Vite-bundled module, so it can't import this file) —
 * keep the two in sync if this logic ever changes.
 *
 * Default is always 'light' (design handoff — light is the approved
 * primary experience, dark is an alternate theme the visitor opts into).
 * `prefers-color-scheme` is deliberately NOT consulted for the default —
 * only an explicit stored choice can select dark.
 */
export type Theme = 'light' | 'dark';

export function parseStoredTheme(value: string | null): Theme | null {
  return value === 'light' || value === 'dark' ? value : null;
}

export function resolveTheme(stored: string | null): Theme {
  return parseStoredTheme(stored) ?? 'light';
}
