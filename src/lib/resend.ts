/**
 * Minimal Resend REST API wrapper — plain `fetch`, no `resend` npm
 * package added (a POST + JSON body doesn't need an SDK). Server-only:
 * this file is only ever imported from src/pages/api/*.ts Worker
 * routes, never from client-shipped code. The API key itself is read by
 * the caller via `import { env } from 'cloudflare:workers'` (the
 * Astro-7-era replacement for the removed `Astro.locals.runtime.env`)
 * and passed in — this module never reads process.env/import.meta.env
 * itself, so it can't accidentally end up depending on a client-bundled
 * env source.
 */

export interface SendEmailInput {
  apiKey: string;
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        reply_to: input.replyTo,
        subject: input.subject,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return {
        success: false,
        error: `Resend API error (${response.status}): ${body.slice(0, 300)}`,
      };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
