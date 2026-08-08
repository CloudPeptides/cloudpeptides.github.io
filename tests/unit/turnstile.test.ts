import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyTurnstileToken } from '../../src/lib/turnstile';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('verifyTurnstileToken', () => {
  it('returns success when siteverify approves the token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }),
    );
    const result = await verifyTurnstileToken('secret', 'token123');
    expect(result.success).toBe(true);
  });

  it('returns failure with error codes when siteverify rejects the token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
      }),
    );
    const result = await verifyTurnstileToken('secret', 'bad-token');
    expect(result.success).toBe(false);
    expect(result.errorCodes).toEqual(['invalid-input-response']);
  });

  it('treats a non-OK HTTP response as failure, not a crash', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }),
    );
    const result = await verifyTurnstileToken('secret', 'token');
    expect(result.success).toBe(false);
  });

  it('treats a network error as failure, not an unhandled rejection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const result = await verifyTurnstileToken('secret', 'token');
    expect(result.success).toBe(false);
    expect(result.errorCodes).toEqual(['network down']);
  });

  it('sends the secret, response token, and remote IP as form fields', async () => {
    let sentBody: URLSearchParams | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        sentBody = init.body as URLSearchParams;
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }),
    );
    await verifyTurnstileToken('my-secret', 'my-token', '1.2.3.4');
    expect(sentBody?.get('secret')).toBe('my-secret');
    expect(sentBody?.get('response')).toBe('my-token');
    expect(sentBody?.get('remoteip')).toBe('1.2.3.4');
  });
});
