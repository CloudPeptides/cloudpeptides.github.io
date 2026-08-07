/**
 * Admin sign-out button — posts to src/pages/api/auth/logout.ts, then
 * hard-navigates to /admin/login regardless of the response (a failed
 * revoke call still means the cookie-clearing succeeded server-side, or
 * the user is already effectively signed out either way).
 */
function init(): void {
  const button = document.getElementById('adminSignOut');
  if (!button) return;
  button.addEventListener('click', async () => {
    (button as HTMLButtonElement).disabled = true;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore — navigating to /admin/login regardless below.
    }
    window.location.assign('/admin/login');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
