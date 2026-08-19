import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendWebPush, type PushSubscriptionKeys, type VapidKeys } from '../../src/lib/web-push';

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** A real, throwaway VAPID key pair + a real, throwaway "subscription"
 * key pair — both generated fresh via Node's own Web Crypto, exactly
 * like scripts/push/generate-vapid-keys.mjs does, so encryptPayload's
 * real ECDH/HKDF/AES-GCM pipeline runs for real in this test (not a
 * stub) and only network I/O (global fetch) is mocked. */
async function realVapidKeys(): Promise<VapidKeys> {
  const keyPair = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
  ])) as CryptoKeyPair;
  const publicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey));
  const jwk = (await crypto.subtle.exportKey('jwk', keyPair.privateKey)) as JsonWebKey;
  return {
    publicKey: base64Url(publicRaw),
    privateKey: (jwk.d ?? '').replace(/=+$/, ''),
    subject: 'mailto:test@cloudpeptides.invalid',
  };
}

async function realSubscriptionKeys(): Promise<PushSubscriptionKeys> {
  const keyPair = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ])) as CryptoKeyPair;
  const publicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey));
  const authSecret = crypto.getRandomValues(new Uint8Array(16));
  return {
    endpoint: 'https://fcm.googleapis.com/fcm/send/fake-endpoint-id',
    p256dh: base64Url(publicRaw),
    auth: base64Url(authSecret),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendWebPush', () => {
  it('encrypts and sends, reporting "sent" on a 201 response, with the correct headers', async () => {
    const vapid = await realVapidKeys();
    const subscription = await realSubscriptionKeys();
    let capturedRequest: { url: string; init: RequestInit } | null = null;
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      capturedRequest = { url, init };
      return new Response(null, { status: 201 });
    });

    const result = await sendWebPush(subscription, { title: 'x', body: 'y', url: '/admin' }, vapid);

    expect(result.outcome).toBe('sent');
    expect(capturedRequest).not.toBeNull();
    const headers = capturedRequest!.init.headers as Record<string, string>;
    expect(headers['Content-Encoding']).toBe('aes128gcm');
    expect(headers['Content-Type']).toBe('application/octet-stream');
    expect(headers.Authorization).toMatch(/^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=/);
    expect(headers.Authorization).toContain(`k=${vapid.publicKey}`);
    // The whole point of RFC 8291 — the ciphertext body must never
    // contain the plaintext payload in the clear.
    const body = capturedRequest!.init.body as Uint8Array;
    const bodyText = Buffer.from(body).toString('latin1');
    expect(bodyText).not.toContain('/admin');
  });

  it('reports "expired" on 404 and 410 (subscription is gone)', async () => {
    const vapid = await realVapidKeys();
    const subscription = await realSubscriptionKeys();
    for (const status of [404, 410]) {
      vi.stubGlobal('fetch', async () => new Response(null, { status }));
      const result = await sendWebPush(subscription, { title: 't' }, vapid);
      expect(result.outcome).toBe('expired');
    }
  });

  it('reports "error" with the real status for other failures, never throwing', async () => {
    const vapid = await realVapidKeys();
    const subscription = await realSubscriptionKeys();
    vi.stubGlobal('fetch', async () => new Response('server exploded', { status: 500 }));
    const result = await sendWebPush(subscription, { title: 't' }, vapid);
    expect(result).toEqual({ outcome: 'error', status: 500, detail: 'server exploded' });
  });

  it('reports "error" with status 0 on a network failure, never throwing', async () => {
    const vapid = await realVapidKeys();
    const subscription = await realSubscriptionKeys();
    vi.stubGlobal('fetch', async () => {
      throw new Error('network unreachable');
    });
    const result = await sendWebPush(subscription, { title: 't' }, vapid);
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') {
      expect(result.status).toBe(0);
      expect(result.detail).toContain('network unreachable');
    }
  });
});
