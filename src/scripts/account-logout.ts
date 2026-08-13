/**
 * Sign-out — wired to every [data-account-logout] button (Nav.astro's
 * desktop action bar and mobile dialog). Posts to the existing,
 * role-agnostic src/pages/api/auth/logout.ts (already used by the
 * admin dashboard; it just clears whoever's session cookie is
 * present), then sends the browser to /login.
 */
function init(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-account-logout]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Best-effort — redirect regardless, matching this app's
        // existing logout posture (src/pages/api/auth/logout.ts always
        // clears cookies even if the server-side revoke call fails).
      }
      window.location.assign('/login');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
