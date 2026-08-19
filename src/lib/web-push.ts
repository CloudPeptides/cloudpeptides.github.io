/**
 * Standards-based Web Push (RFC 8291 message encryption + RFC 8292
 * VAPID), implemented directly on the Web Crypto API
 * (`crypto.subtle`/`crypto.getRandomValues`) instead of the `web-push`
 * npm package. That package assumes Node's `crypto`/`https` modules and
 * is not reliably compatible with the Cloudflare Workers runtime
 * without adding the `nodejs_compat` compatibility flag (wrangler.jsonc
 * currently has neither) — a meaningful runtime-behavior change this
 * project hasn't needed for anything else. Every primitive RFC 8291/8292
 * actually require (ECDH P-256, HKDF, AES-128-GCM, ECDSA P-256/SHA-256)
 * is natively supported by Workers' `crypto.subtle`, so no new
 * dependency is added at all — this file is the whole implementation.
 *
 * VAPID key format used throughout this app (generate with
 * scripts/push/generate-vapid-keys.mjs):
 *  - public key: the raw uncompressed P-256 point (65 bytes, leading
 *    0x04), base64url-encoded — this is exactly what
 *    `PushManager.subscribe({ applicationServerKey })` expects
 *    client-side, and exactly what the `k=` VAPID auth parameter needs.
 *  - private key: the raw 32-byte EC private scalar (d), base64url-
 *    encoded.
 */

// ---------------------------------------------------------------------
// base64url helpers
// ---------------------------------------------------------------------
function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array | ArrayBuffer): string {
  const arr = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  let binary = '';
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function textToBase64Url(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

// ---------------------------------------------------------------------
// VAPID (RFC 8292) — one JWT signed per push send, audience-scoped to
// the receiving push service's origin.
// ---------------------------------------------------------------------
export interface VapidKeys {
  publicKey: string; // base64url, raw uncompressed P-256 point
  privateKey: string; // base64url, raw 32-byte scalar
  subject: string; // "mailto:..." or "https://..."
}

async function importVapidPrivateKey(vapid: VapidKeys): Promise<CryptoKey> {
  const pub = base64UrlToBytes(vapid.publicKey);
  if (pub.length !== 65 || pub[0] !== 0x04) {
    throw new Error('VAPID public key must be a 65-byte uncompressed P-256 point.');
  }
  const jwk: JsonWebKey = {
    kty: 'EC',
    crv: 'P-256',
    x: bytesToBase64Url(pub.slice(1, 33)),
    y: bytesToBase64Url(pub.slice(33, 65)),
    d: vapid.privateKey.replace(/=+$/, ''),
    ext: true,
  };
  return crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, [
    'sign',
  ]);
}

async function buildVapidAuthHeader(endpoint: string, vapid: VapidKeys): Promise<string> {
  const audience = new URL(endpoint).origin;
  const header = { typ: 'JWT', alg: 'ES256' };
  const expirySeconds = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // max allowed by RFC 8292 is 24h; 12h is comfortably under it
  const payload = { aud: audience, exp: expirySeconds, sub: vapid.subject };
  const unsigned = `${textToBase64Url(JSON.stringify(header))}.${textToBase64Url(JSON.stringify(payload))}`;

  const privateKey = await importVapidPrivateKey(vapid);
  // Web Crypto's ECDSA sign() already returns the raw (r || s) 64-byte
  // IEEE-P1363 format JWS ES256 requires — no DER re-encoding needed.
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${bytesToBase64Url(signature)}`;
  return `vapid t=${jwt}, k=${vapid.publicKey}`;
}

// ---------------------------------------------------------------------
// Message encryption (RFC 8291, "aes128gcm" content-encoding)
// ---------------------------------------------------------------------
async function encryptPayload(
  payload: Uint8Array,
  p256dhB64: string,
  authSecretB64: string,
): Promise<Uint8Array> {
  const uaPublicRaw = base64UrlToBytes(p256dhB64);
  const authSecret = base64UrlToBytes(authSecretB64);

  const uaPublicKey = await crypto.subtle.importKey(
    'raw',
    uaPublicRaw as BufferSource,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );

  const asKeyPair = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ])) as CryptoKeyPair;
  const asPublicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', asKeyPair.publicKey));

  const ecdhSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: uaPublicKey },
    asKeyPair.privateKey,
    256,
  );

  // First HKDF (RFC 8291 §3.3): combines the ECDH shared secret with
  // the subscription's auth secret and both parties' public keys into
  // a 32-byte "IKM" for the second (RFC 8188) derivation below.
  const ecdhSecretKey = await crypto.subtle.importKey('raw', ecdhSecretBits, 'HKDF', false, [
    'deriveBits',
  ]);
  const infoContext = new Uint8Array([...uaPublicRaw, ...asPublicRaw]);
  const combineInfo = new Uint8Array([
    ...new TextEncoder().encode('WebPush: info\0'),
    ...infoContext,
  ]);
  const ikmBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: authSecret as BufferSource,
      info: combineInfo as BufferSource,
    },
    ecdhSecretKey,
    256,
  );

  // RFC 8188 aes128gcm framing — a single record (push payloads are
  // always small enough to fit in one).
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const ikmKey = await crypto.subtle.importKey('raw', ikmBits, 'HKDF', false, ['deriveBits']);
  const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0');
  const cekBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: cekInfo },
    ikmKey,
    128,
  );
  const nonceBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo },
    ikmKey,
    96,
  );

  const cek = await crypto.subtle.importKey('raw', cekBits, { name: 'AES-GCM' }, false, [
    'encrypt',
  ]);
  // Single-record delimiter byte (0x02 = "last/only record", RFC 8188 §2).
  const plaintextWithDelimiter = new Uint8Array([...payload, 0x02]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceBits }, cek, plaintextWithDelimiter),
  );

  // header = salt(16) || record size(4, big-endian) || keyid length(1) || keyid(65)
  const recordSize = 4096;
  const header = new Uint8Array(16 + 4 + 1 + asPublicRaw.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, recordSize, false);
  header[20] = asPublicRaw.length;
  header.set(asPublicRaw, 21);

  return new Uint8Array([...header, ...ciphertext]);
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------
export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export type SendPushResult =
  | { outcome: 'sent' }
  | { outcome: 'expired' } // 404/410 — subscription is gone, caller should delete it
  | { outcome: 'error'; status: number; detail: string };

/**
 * Sends one push message to one subscription. Never throws for an
 * ordinary delivery failure (expired subscription, push-service error)
 * — those are reported via the return value so a caller can record them
 * per-event without a failed send ever becoming an unhandled exception
 * (src/lib/push.ts's queue-processing loop relies on this).
 */
export async function sendWebPush(
  subscription: PushSubscriptionKeys,
  payload: object,
  vapid: VapidKeys,
  ttlSeconds = 60 * 60 * 24, // 24h — matches most push services' max anyway
): Promise<SendPushResult> {
  const body = await encryptPayload(
    new TextEncoder().encode(JSON.stringify(payload)),
    subscription.p256dh,
    subscription.auth,
  );
  const authHeader = await buildVapidAuthHeader(subscription.endpoint, vapid);

  let response: Response;
  try {
    response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        TTL: String(ttlSeconds),
      },
      body: body as BodyInit,
    });
  } catch (err) {
    return {
      outcome: 'error',
      status: 0,
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  if (response.status === 404 || response.status === 410) {
    return { outcome: 'expired' };
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    return { outcome: 'error', status: response.status, detail: detail.slice(0, 500) };
  }
  return { outcome: 'sent' };
}
