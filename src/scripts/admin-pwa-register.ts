/**
 * Registers the admin PWA's service worker (public/admin/sw.js).
 * Imported only from src/layouts/AdminLayout.astro — never reaches the
 * public/researcher-facing site, which has no service worker at all.
 * Explicit `scope: '/admin/'` matches the file's own default scope
 * (its directory) — stated here anyway so the intent is visible in
 * code, not just inferred from URL placement.
 */
function init(): void {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/admin/sw.js', { scope: '/admin/' }).catch((err) => {
    console.error('admin service worker registration failed:', err);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
