import { describe, expect, it } from 'vitest';
import { parseStoredTheme, resolveTheme } from '../../src/lib/theme';

describe('parseStoredTheme', () => {
  it('accepts "light" and "dark"', () => {
    expect(parseStoredTheme('light')).toBe('light');
    expect(parseStoredTheme('dark')).toBe('dark');
  });

  it('rejects null, empty, and unrecognized values', () => {
    expect(parseStoredTheme(null)).toBeNull();
    expect(parseStoredTheme('')).toBeNull();
    expect(parseStoredTheme('system')).toBeNull();
  });
});

describe('resolveTheme', () => {
  it('uses a valid stored theme when present', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('defaults to light when nothing is stored — the approved light theme is always the default, never system preference', () => {
    expect(resolveTheme(null)).toBe('light');
  });

  it('defaults to light when the stored value is invalid', () => {
    expect(resolveTheme('not-a-theme')).toBe('light');
  });
});
