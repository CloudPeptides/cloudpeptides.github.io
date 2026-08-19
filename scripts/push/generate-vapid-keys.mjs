#!/usr/bin/env node
/**
 * One-time VAPID key-pair generator for the admin push-notification
 * feature (src/lib/web-push.ts). Run manually, locally:
 *
 *   node scripts/push/generate-vapid-keys.mjs
 *
 * Prints the public/private key pair in the raw base64url format this
 * app expects everywhere (PUBLIC_VAPID_PUBLIC_KEY / VAPID_PUBLIC_KEY /
 * VAPID_PRIVATE_KEY — see docs/implementation-log.md's push-notification
 * entry for exactly which env var goes where). Generates a fresh pair
 * every run — never reuses or persists a key itself; storing the output
 * safely (Worker secrets, never a committed file) is the operator's job.
 * Uses only Node's built-in Web Crypto (globalThis.crypto.subtle) — no
 * new dependency.
 */

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return Buffer.from(binary, 'binary')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
  'sign',
  'verify',
]);
const publicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey));
const jwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
const privateRaw = bytesToBase64Url(
  Buffer.from(jwk.d.replace(/-/g, '+').replace(/_/g, '/'), 'base64'),
);

const publicKey = bytesToBase64Url(publicRaw);

console.log('Generated a new VAPID key pair. Store these as Worker secrets — never commit them.\n');
console.log(`PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PUBLIC_KEY=${publicKey}   (same value, server-side name — see src/env.d.ts)`);
console.log(`VAPID_PRIVATE_KEY=${privateRaw}`);
console.log('\nAlso set VAPID_SUBJECT to a contact URI, e.g. mailto:info.order.thecloud@proton.me');
