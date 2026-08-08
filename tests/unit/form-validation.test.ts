import { describe, expect, it } from 'vitest';
import {
  isSingleLineSafe,
  isValidEmail,
  sanitizeText,
  validateCheckoutSubmission,
  validateContactSubmission,
} from '../../src/lib/form-validation';

describe('sanitizeText', () => {
  it('trims and caps length', () => {
    expect(sanitizeText('  hi  ', 10)).toBe('hi');
    expect(sanitizeText('a'.repeat(300), 10)).toBe('a'.repeat(10));
  });
  it('strips control characters', () => {
    expect(sanitizeText('hi\x00there', 20)).toBe('hithere');
  });
  it('rejects non-strings', () => {
    expect(sanitizeText(42, 20)).toBe('');
    expect(sanitizeText(undefined, 20)).toBe('');
    expect(sanitizeText(null, 20)).toBe('');
  });
});

describe('isValidEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
  });
  it('rejects malformed addresses', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isSingleLineSafe (header-injection defense)', () => {
  it('rejects newlines and carriage returns', () => {
    expect(isSingleLineSafe('a\nBcc: evil@x.com')).toBe(false);
    expect(isSingleLineSafe('a\r\nBcc: evil@x.com')).toBe(false);
  });
  it('accepts normal single-line text', () => {
    expect(isSingleLineSafe('Jane Doe')).toBe(true);
  });
});

describe('validateContactSubmission', () => {
  it('accepts a well-formed submission', () => {
    const { result, data } = validateContactSubmission({
      name: 'Jane',
      email: 'jane@example.com',
      message: 'Hello there',
    });
    expect(result.valid).toBe(true);
    expect(data).toEqual({ name: 'Jane', email: 'jane@example.com', message: 'Hello there' });
  });

  it('rejects missing fields', () => {
    expect(validateContactSubmission({ name: '', email: '', message: '' }).result.valid).toBe(
      false,
    );
  });

  it('rejects an invalid email', () => {
    const { result } = validateContactSubmission({
      name: 'Jane',
      email: 'not-an-email',
      message: 'hi',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects header-injection attempts in the name field', () => {
    const { result } = validateContactSubmission({
      name: 'Jane\nBcc: evil@x.com',
      email: 'jane@example.com',
      message: 'hi',
    });
    expect(result.valid).toBe(false);
  });
});

describe('validateCheckoutSubmission', () => {
  const baseItems = [
    { name: 'GHK-CU', spec: '50mg', price: 120, quantity: 1 },
    { name: 'AHK-CU', spec: '50mg', price: 110, quantity: 1 },
  ];

  it('accepts a well-formed order meeting the 2-kit minimum', () => {
    const { result, data } = validateCheckoutSubmission({
      name: 'Jane',
      email: 'jane@example.com',
      contact: 'discord#1234',
      payment: 'Zelle',
      notes: '',
      items: baseItems,
    });
    expect(result.valid).toBe(true);
    expect(data?.subtotal).toBe(230);
    expect(data?.shipping).toBe(15);
    expect(data?.total).toBe(245);
  });

  it('rejects an order below the 2-kit minimum', () => {
    const { result } = validateCheckoutSubmission({
      name: 'Jane',
      email: 'jane@example.com',
      contact: 'discord#1234',
      payment: 'Zelle',
      notes: '',
      items: [{ name: 'GHK-CU', spec: '50mg', price: 120, quantity: 1 }],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/minimum order/i);
  });

  it('gives free shipping at 3+ kits, recomputed server-side', () => {
    const { data } = validateCheckoutSubmission({
      name: 'Jane',
      email: 'jane@example.com',
      contact: 'discord#1234',
      payment: 'Zelle',
      notes: '',
      items: [{ name: 'GHK-CU', spec: '50mg', price: 100, quantity: 3 }],
    });
    expect(data?.shipping).toBe(0);
    expect(data?.total).toBe(300);
  });

  it('never trusts a client-supplied total (recomputes it)', () => {
    const { data } = validateCheckoutSubmission({
      name: 'Jane',
      email: 'jane@example.com',
      contact: 'discord#1234',
      payment: 'Zelle',
      notes: '',
      items: baseItems,
      subtotal: 1, // attempted tampering
      shipping: 0,
      total: 1,
    });
    expect(data?.total).toBe(245);
  });

  it('rejects a payment method outside the approved list', () => {
    const { result } = validateCheckoutSubmission({
      name: 'Jane',
      email: 'jane@example.com',
      contact: 'discord#1234',
      payment: 'Cash',
      notes: '',
      items: baseItems,
    });
    expect(result.valid).toBe(false);
  });

  it('rejects malformed cart items', () => {
    const { result } = validateCheckoutSubmission({
      name: 'Jane',
      email: 'jane@example.com',
      contact: 'discord#1234',
      payment: 'Zelle',
      notes: '',
      items: [{ name: 'X', spec: '1mg', price: -5, quantity: 1 }],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects an empty cart', () => {
    const { result } = validateCheckoutSubmission({
      name: 'Jane',
      email: 'jane@example.com',
      contact: 'discord#1234',
      payment: 'Zelle',
      notes: '',
      items: [],
    });
    expect(result.valid).toBe(false);
  });
});
