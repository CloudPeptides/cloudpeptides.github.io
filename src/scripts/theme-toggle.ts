/**
 * Framework-free light/dark theme toggle.
 * Progressive enhancement: without this script, the page still renders
 * correctly in the default light theme (tokens.css's `:root` values);
 * this script only adds the persisted manual override to dark. System
 * `prefers-color-scheme` is deliberately not consulted — light is always
 * the default per the approved design handoff.
 */
import { resolveTheme, type Theme } from '../lib/theme.ts';

const STORAGE_KEY = 'cp-theme';

function getCurrentTheme(): Theme {
  return resolveTheme(localStorage.getItem(STORAGE_KEY));
}

function applyTheme(theme: Theme): void {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(theme === 'dark'));
  });
}

function initThemeToggle(): void {
  applyTheme(getCurrentTheme());

  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const current =
        document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeToggle);
} else {
  initThemeToggle();
}
