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
  it('prefers a valid stored theme over the system preference', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('falls back to the system preference when nothing is stored', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
  });

  it('falls back to the system preference when the stored value is invalid', () => {
    expect(resolveTheme('not-a-theme', true)).toBe('dark');
  });
});
