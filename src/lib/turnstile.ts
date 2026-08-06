/**
 * Cloudflare Turnstile server-side verification — the client widget
 * (src/scripts/turnstile-widget.ts) produces a token that must be
 * validated here before a submission is accepted; the widget itself
 * proves nothing on its own (never trust a client-side pass/fail).
 *
 * Turnstile is free (no paid tier — unlike the Workers Rate Limiting
 * binding, there's no billing question here at all).
 *
 * Conditionally required: if TURNSTILE_SECRET_KEY isn't configured
 * (true right now — no Turnstile site has been created yet), this is
 * skipped entirely rather than blocking every submission on a feature
 * that was never activated, matching how the Resend-config check
 * already behaves. Once a real secret key is set, verification becomes
 * mandatory automatically — no code change needed.
 */

export interface TurnstileVerifyResult {
  success: boolean;
  errorCodes?: string[];
}

export async function verifyTurnstileToken(
  secretKey: string,
  token: string,
  remoteIp?: string,
): Promise<TurnstileVerifyResult> {
  const body = new URLSearchParams();
  body.set('secret', secretKey);
  body.set('response', token);
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) {
      return { success: false, errorCodes: [`http-${response.status}`] };
    }
    const result = (await response.json()) as { success: boolean; 'error-codes'?: string[] };
    return { success: result.success === true, errorCodes: result['error-codes'] };
  } catch (err) {
    return { success: false, errorCodes: [err instanceof Error ? err.message : 'unknown-error'] };
  }
}
