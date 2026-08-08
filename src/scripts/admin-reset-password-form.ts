/**
 * Password-reset completion page. On load, extracts whichever
 * credential shape Supabase's recovery redirect provided — a `code`
 * query param, or an `access_token`/`refresh_token`/`type=recovery`
 * URL fragment (the shape this app's server-side-only Supabase usage
 * actually produces — see src/pages/api/auth/reset-password.ts's own
 * header comment) — and clears it from the visible URL immediately via
 * history.replaceState so the token doesn't linger in the address bar
 * or browser history. If neither is present, the link is treated as
 * invalid/expired before the form is ever submittable.
 */

interface RecoveryCredential {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
}

function extractCredential(): RecoveryCredential | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) return { code };

  const rawHash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(rawHash);
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  const type = hashParams.get('type');
  if (accessToken && refreshToken && type === 'recovery') {
    return { accessToken, refreshToken };
  }
  return null;
}

function clearSensitiveUrlParts(): void {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  window.history.replaceState({}, document.title, url.toString());
}

function showExpiredState(): void {
  const form = document.getElementById('resetPasswordForm');
  const expired = document.getElementById('resetExpiredState');
  if (form) (form as HTMLElement).hidden = true;
  if (expired) expired.hidden = false;
}

function init(): void {
  const form = document.getElementById('resetPasswordForm') as HTMLFormElement | null;
  if (!form) return;

  const credential = extractCredential();
  clearSensitiveUrlParts();

  if (!credential) {
    showExpiredState();
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorEl = document.getElementById('resetFormError');
    if (errorEl) errorEl.hidden = true;

    const password = (document.getElementById('newPassword') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;

    if (password.length < 8) {
      if (errorEl) {
        errorEl.textContent = 'Password must be at least 8 characters.';
        errorEl.hidden = false;
      }
      return;
    }
    if (password !== confirmPassword) {
      if (errorEl) {
        errorEl.textContent = 'Passwords do not match.';
        errorEl.hidden = false;
      }
      return;
    }

    const button = document.getElementById('resetSubmit') as HTMLButtonElement;
    button.disabled = true;
    button.textContent = 'Updating…';

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...credential, password, confirmPassword }),
      });
      const result = (await response.json()) as { success: boolean; error?: string };

      if (result.success) {
        const successState = document.getElementById('resetSuccessState');
        form.hidden = true;
        if (successState) successState.hidden = false;
        window.setTimeout(() => {
          window.location.assign('/admin/login?reset=success');
        }, 2000);
        return;
      }

      if (result.error && /invalid or has expired/i.test(result.error)) {
        showExpiredState();
        return;
      }

      if (errorEl) {
        errorEl.textContent = result.error || 'Could not update your password. Please try again.';
        errorEl.hidden = false;
      }
    } catch {
      if (errorEl) {
        errorEl.textContent = 'Could not update your password. Please try again.';
        errorEl.hidden = false;
      }
    }

    button.disabled = false;
    button.textContent = 'Update password';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
