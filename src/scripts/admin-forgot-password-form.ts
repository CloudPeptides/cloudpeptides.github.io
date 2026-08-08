/**
 * Forgot-password form submission — posts to
 * src/pages/api/auth/forgot-password.ts. Mirrors
 * src/scripts/admin-login-form.ts's fetch/disable/error pattern. The
 * success path always shows the same generic message the server sent —
 * this page never distinguishes "email sent" from "no such account."
 */
function init(): void {
  const form = document.getElementById('forgotPasswordForm') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorEl = document.getElementById('forgotFormError');
    const successEl = document.getElementById('forgotFormSuccess');
    if (errorEl) errorEl.hidden = true;
    if (successEl) successEl.hidden = true;

    const email = (document.getElementById('email') as HTMLInputElement).value.trim();

    const button = document.getElementById('forgotSubmit') as HTMLButtonElement;
    button.disabled = true;
    button.textContent = 'Sending…';

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { success: boolean; error?: string };

      if (result.success) {
        form.hidden = true;
        if (successEl) {
          successEl.textContent =
            'If an account exists for that email address, a password reset link has been sent. Check your inbox.';
          successEl.hidden = false;
        }
        return;
      }
      if (errorEl) {
        errorEl.textContent = result.error || 'Something went wrong. Please try again.';
        errorEl.hidden = false;
      }
    } catch {
      if (errorEl) {
        errorEl.textContent = 'Something went wrong. Please try again.';
        errorEl.hidden = false;
      }
    }

    button.disabled = false;
    button.textContent = 'Send reset link';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
