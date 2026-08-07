/**
 * New-user creation form on /admin/users — posts to
 * src/pages/api/admin/users/index.ts. No confirmation email is sent
 * (see that route's header comment) — the admin must relay the
 * password to the new user directly.
 */
function init(): void {
  const form = document.getElementById('createUserForm') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorEl = document.getElementById('createUserError');
    if (errorEl) errorEl.hidden = true;

    const email = (document.getElementById('newUserEmail') as HTMLInputElement).value.trim();
    const password = (document.getElementById('newUserPassword') as HTMLInputElement).value;
    const role = (document.getElementById('newUserRole') as HTMLSelectElement).value;

    const button = document.getElementById('createUserSubmit') as HTMLButtonElement;
    button.disabled = true;
    button.textContent = 'Creating…';

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const result = (await response.json()) as { success: boolean; error?: string };
      if (result.success) {
        window.location.reload();
        return;
      }
      if (errorEl) {
        errorEl.textContent = result.error || 'Could not create this user.';
        errorEl.hidden = false;
      }
    } catch {
      if (errorEl) {
        errorEl.textContent = 'Could not create this user.';
        errorEl.hidden = false;
      }
    }

    button.disabled = false;
    button.textContent = 'Create user';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
