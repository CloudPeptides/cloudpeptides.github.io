/**
 * Researcher registration form — posts to src/pages/api/account/
 * register.ts. Client-side checks (password match, both required
 * checkboxes) are a UX convenience only; the route re-validates every
 * field server-side regardless (never trusted from here).
 */
function init(): void {
  const form = document.getElementById('registerForm') as HTMLFormElement | null;
  if (!form) return;

  const errorEl = document.getElementById('registerFormMessage');
  const successEl = document.getElementById('registerSuccessMessage');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (errorEl) errorEl.hidden = true;
    if (successEl) successEl.hidden = true;

    const fullName = (document.getElementById('fullName') as HTMLInputElement).value.trim();
    const email = (document.getElementById('email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;
    const country = (document.getElementById('country') as HTMLSelectElement).value;
    const region = (document.getElementById('region') as HTMLInputElement).value.trim();
    const researchAffiliation = (
      document.getElementById('researchAffiliation') as HTMLInputElement
    ).value.trim();
    const age18 = (document.getElementById('age18') as HTMLInputElement).checked;
    const certificationAccepted = (
      document.getElementById('certificationAccepted') as HTMLInputElement
    ).checked;
    // Cloudflare Turnstile auto-injects this hidden field into the form
    // once the widget is solved (only present at all once
    // PUBLIC_TURNSTILE_SITE_KEY is configured and the widget rendered) —
    // sent as-is; the server decides whether it's actually required.
    const turnstileToken =
      (form.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value ??
      '';

    if (password !== confirmPassword) {
      if (errorEl) {
        errorEl.textContent = 'Passwords do not match.';
        errorEl.hidden = false;
      }
      return;
    }
    if (!age18 || !certificationAccepted) {
      if (errorEl) {
        errorEl.textContent = 'You must check both required boxes to continue.';
        errorEl.hidden = false;
      }
      return;
    }

    const button = document.getElementById('registerSubmit') as HTMLButtonElement;
    button.disabled = true;
    button.textContent = 'Creating account…';

    try {
      const response = await fetch('/api/account/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          confirmPassword,
          country,
          region,
          researchAffiliation,
          age18,
          certificationAccepted,
          turnstileToken,
        }),
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: string;
        message?: string;
      };

      if (result.success) {
        form.hidden = true;
        if (successEl) {
          successEl.textContent =
            result.message ?? 'Check your email to verify your account before signing in.';
          successEl.hidden = false;
        }
        return;
      }
      if (errorEl) {
        errorEl.textContent = result.error || 'Registration failed. Please try again.';
        errorEl.hidden = false;
      }
    } catch {
      if (errorEl) {
        errorEl.textContent = 'Registration failed. Please try again.';
        errorEl.hidden = false;
      }
    }

    button.disabled = false;
    button.textContent = 'Create Account';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
