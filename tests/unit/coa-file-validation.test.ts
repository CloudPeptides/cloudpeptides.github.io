import { describe, expect, it } from 'vitest';
import {
  generateStoragePath,
  MAX_COA_FILE_BYTES,
  sanitizeOriginalFilename,
  sniffFileType,
  validateCoaFile,
} from '../../src/lib/coa-file-validation';

function bytesFrom(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

function padded(bytes: number[], totalLength = 20): Uint8Array {
  const out = new Uint8Array(totalLength);
  out.set(bytes);
  return out;
}

const REAL_PDF = padded([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // "%PDF-1.4"
const REAL_PNG = padded([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const REAL_JPEG = padded([0xff, 0xd8, 0xff, 0xe0]);
const REAL_WEBP = padded([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]); // "RIFF????WEBP"

describe('sniffFileType', () => {
  it('identifies a real PDF by its magic bytes', () => {
    expect(sniffFileType(REAL_PDF)).toBe('pdf');
  });
  it('identifies a real PNG by its magic bytes', () => {
    expect(sniffFileType(REAL_PNG)).toBe('png');
  });
  it('identifies a real JPEG by its magic bytes', () => {
    expect(sniffFileType(REAL_JPEG)).toBe('jpeg');
  });
  it('identifies a real WebP by its magic bytes (RIFF....WEBP)', () => {
    expect(sniffFileType(REAL_WEBP)).toBe('webp');
  });

  it('rejects an SVG (XML text, no matching signature) even if renamed .pdf', () => {
    const svgBytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(sniffFileType(svgBytes)).toBeNull();
  });

  it('rejects HTML content', () => {
    const htmlBytes = new TextEncoder().encode('<!DOCTYPE html><html><body>hi</body></html>');
    expect(sniffFileType(htmlBytes)).toBeNull();
  });

  it('rejects a Windows PE executable (MZ header)', () => {
    expect(sniffFileType(padded([0x4d, 0x5a, 0x90, 0x00]))).toBeNull();
  });

  it('rejects a too-short/empty buffer', () => {
    expect(sniffFileType(bytesFrom(0x25, 0x50, 0x44))).toBeNull();
    expect(sniffFileType(new Uint8Array(0))).toBeNull();
  });
});

describe('validateCoaFile', () => {
  it('accepts a real PDF with the matching declared MIME type', () => {
    const result = validateCoaFile(REAL_PDF, 'application/pdf');
    expect(result.valid).toBe(true);
    expect(result.kind).toBe('pdf');
  });

  it('rejects a file whose declared MIME type does not match its real (sniffed) type', () => {
    // Real PNG bytes, but claims to be a PDF — the declared type lies.
    const result = validateCoaFile(REAL_PNG, 'application/pdf');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/does not match/i);
  });

  it('rejects an SVG disguised with a PDF Content-Type header', () => {
    const svgBytes = new TextEncoder().encode('<svg onload="alert(1)"></svg>'.padEnd(20, ' '));
    const result = validateCoaFile(svgBytes, 'application/pdf');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/unsupported/i);
  });

  it('rejects an oversized file', () => {
    const huge = new Uint8Array(MAX_COA_FILE_BYTES + 1);
    huge.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const result = validateCoaFile(huge, 'application/pdf');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/too large/i);
  });

  it('rejects an empty file', () => {
    const result = validateCoaFile(new Uint8Array(0), 'application/pdf');
    expect(result.valid).toBe(false);
  });
});

describe('generateStoragePath', () => {
  it('never uses the original filename — a crypto-random name plus the sniffed extension', () => {
    const path = generateStoragePath('pdf');
    expect(path).toMatch(/^[0-9a-f-]{36}\.pdf$/);
  });

  it('maps each kind to its own extension', () => {
    expect(generateStoragePath('png')).toMatch(/\.png$/);
    expect(generateStoragePath('jpeg')).toMatch(/\.jpg$/);
    expect(generateStoragePath('webp')).toMatch(/\.webp$/);
  });

  it('is different on every call (no path collisions)', () => {
    expect(generateStoragePath('pdf')).not.toBe(generateStoragePath('pdf'));
  });
});

describe('sanitizeOriginalFilename', () => {
  it('keeps a normal filename as-is', () => {
    expect(sanitizeOriginalFilename('batch-report.pdf')).toBe('batch-report.pdf');
  });

  it('strips path separators — never used as a path component regardless, but defensive anyway', () => {
    expect(sanitizeOriginalFilename('../../etc/passwd')).toBe('.._.._etc_passwd');
    expect(sanitizeOriginalFilename('C:\\Windows\\evil.exe')).toBe('C:_Windows_evil.exe');
  });

  it('falls back to a safe default for header-injection attempts', () => {
    expect(sanitizeOriginalFilename('report.pdf\nBcc: evil@x.com')).toBe('upload');
  });

  it('rejects non-string input', () => {
    expect(sanitizeOriginalFilename(undefined)).toBe('');
    expect(sanitizeOriginalFilename(42)).toBe('');
  });
});
