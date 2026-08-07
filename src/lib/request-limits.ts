/**
 * Body-size guard for the two public form routes (src/pages/api/
 * contact.ts, checkout.ts). A contact message or a several-item order
 * request never legitimately needs more than a few KB — this exists to
 * reject grossly oversized payloads (a crude DoS/abuse vector, or a
 * malformed/malicious client) before any parsing or downstream work
 * happens, cheaply, ahead of the rate-limit/Turnstile checks.
 *
 * Checks both the declared Content-Length header (fast, but a client
 * can lie about it or omit it entirely) and the actual bytes read
 * (authoritative) — a request is rejected if either exceeds the limit.
 */

export const MAX_FORM_BODY_BYTES = 16_384; // 16 KB

export interface BodyReadResult {
  ok: boolean;
  text?: string;
  error?: string;
}

export async function readBodyWithLimit(
  request: Request,
  maxBytes: number = MAX_FORM_BODY_BYTES,
): Promise<BodyReadResult> {
  const declaredLength = request.headers.get('content-length');
  if (declaredLength && Number(declaredLength) > maxBytes) {
    return { ok: false, error: 'Request body too large.' };
  }

  if (!request.body) {
    return { ok: true, text: '' };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return { ok: false, error: 'Request body too large.' };
    }
    chunks.push(value);
  }

  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, text: new TextDecoder().decode(combined) };
}
