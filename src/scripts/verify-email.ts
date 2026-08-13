/**
 * Reads the email-confirmation callback (either a PKCE `?code=` query
 * param, or implicit-flow tokens in the URL hash fragment — Supabase
 * can produce either shape depending on project config, and the hash
 * form is only ever readable client-side) and exchanges it for a real
 * session via src/pages/api/account/verify-session.ts, which sets this
 * app's HttpOnly session cookies. On success, sends the visitor on to
 * /certify (the mandatory next step for a brand-new researcher
 * account) rather than assuming they're already certified.
 */
function parseHashTokens(): { accessToken: string; refreshToken: string } | null {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

async function init(): Promise<void> {
  const statusEl = document.getElementById('verifyStatus');
  const errorEl = document.getElementById('verifyErrorMessage');
  const continueLink = document.getElementById('verifyContinueLink') as HTMLAnchorElement | null;

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const hashTokens = parseHashTokens();

  if (!code && !hashTokens) {
    if (statusEl) statusEl.hidden = true;
    if (errorEl) {
      errorEl.textContent =
        'This verification link is missing required information. Please use the link from your email exactly as sent, or sign in to request a new one.';
      errorEl.hidden = false;
    }
    return;
  }

  try {
    const response = await fetch('/api/account/verify-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        code
          ? { code }
          : { accessToken: hashTokens!.accessToken, refreshToken: hashTokens!.refreshToken },
      ),
    });
    const result = (await response.json()) as { success: boolean; error?: string };

    // Clear the sensitive fragment/query from the visible URL either way.
    window.history.replaceState(null, '', '/verify-email');

    if (result.success) {
      if (statusEl) {
        statusEl.textContent =
          'Your email is verified. Continue to complete your researcher certification.';
      }
      if (continueLink) continueLink.hidden = false;
      window.location.assign('/certify');
      return;
    }

    if (statusEl) statusEl.hidden = true;
    if (errorEl) {
      errorEl.textContent = result.error || 'Could not verify your email. Please try signing in.';
      errorEl.hidden = false;
    }
  } catch {
    if (statusEl) statusEl.hidden = true;
    if (errorEl) {
      errorEl.textContent = 'Could not verify your email. Please try signing in.';
      errorEl.hidden = false;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  void init();
}

export {};
