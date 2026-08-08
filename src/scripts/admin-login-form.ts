/**
 * Admin login form submission — posts to src/pages/api/auth/login.ts.
 * Mirrors src/scripts/contact-form.ts's fetch/disable/error pattern.
 */
function init(): void {
  const form = document.getElementById('adminLoginForm') as HTMLFormElement | null;
  if (!form) return;

  const redirectTarget = form.dataset.redirect || '/admin';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorEl = document.getElementById('loginFormMessage');
    if (errorEl) errorEl.hidden = true;

    const email = (document.getElementById('email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value;

    const button = document.getElementById('loginSubmit') as HTMLButtonElement;
    button.disabled = true;
    button.textContent = 'Signing in…';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as { success: boolean; error?: string };

      if (result.success) {
        window.location.assign(redirectTarget);
        return;
      }
      if (errorEl) {
        errorEl.textContent = result.error || 'Sign-in failed. Please try again.';
        errorEl.hidden = false;
      }
    } catch {
      if (errorEl) {
        errorEl.textContent = 'Sign-in failed. Please try again.';
        errorEl.hidden = false;
      }
    }

    button.disabled = false;
    button.textContent = 'Sign In';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
