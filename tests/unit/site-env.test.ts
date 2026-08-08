import { describe, expect, it } from 'vitest';
import { isIndexableHost, isStagingReadOnly } from '../../src/lib/site-env';

// Locks in the exact guarantee this domain-preparation phase depends
// on: astro.config.mjs's `site` can safely be set to the real
// production domain (cloudpeptides.org) before that domain is
// attached to anything, because indexability is gated on the live
// request's *actual* hostname matching `site` — never on `site`'s
// value alone. The staging Worker's real hostname must never match,
// regardless of what `site` says.

describe('isIndexableHost', () => {
  const PRODUCTION_SITE = 'https://cloudpeptides.org';

  it('is true when the request hostname matches the production site exactly', () => {
    expect(isIndexableHost('cloudpeptides.org', PRODUCTION_SITE)).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isIndexableHost('CloudPeptides.org', PRODUCTION_SITE)).toBe(true);
  });

  it('is false for the staging Worker hostname, even though it is a real, live, deployed host', () => {
    expect(
      isIndexableHost('cloudpeptides-staging.jessica-holsopple3.workers.dev', PRODUCTION_SITE),
    ).toBe(false);
  });

  it('is false for the old GitHub Pages hostname now that site has moved on', () => {
    expect(isIndexableHost('cloudpeptides.github.io', PRODUCTION_SITE)).toBe(false);
  });

  it('is false for a www subdomain — apex and www are distinct hosts unless site itself is www', () => {
    expect(isIndexableHost('www.cloudpeptides.org', PRODUCTION_SITE)).toBe(false);
  });

  it('is false for localhost / any local dev hostname', () => {
    expect(isIndexableHost('localhost', PRODUCTION_SITE)).toBe(false);
  });

  it('fails safe to false when site is undefined', () => {
    expect(isIndexableHost('cloudpeptides.org', undefined)).toBe(false);
  });

  it('accepts a URL instance as well as a string for site', () => {
    expect(isIndexableHost('cloudpeptides.org', new URL(PRODUCTION_SITE))).toBe(true);
  });
});

// The shared-database safety boundary (docs/planning/
// production-cutover-plan.md §1) — must fail toward "writable" (today's
// behavior) for anything except the exact opt-in string, since Worker
// vars are always strings and a typo here would otherwise silently
// disable the read-only protection instead of enabling it.
describe('isStagingReadOnly', () => {
  it('is true only for the exact string "true"', () => {
    expect(isStagingReadOnly('true')).toBe(true);
  });

  it('is false when unset', () => {
    expect(isStagingReadOnly(undefined)).toBe(false);
  });

  it('is false for "false"', () => {
    expect(isStagingReadOnly('false')).toBe(false);
  });

  it('fails safe to false for near-miss values, not silently true', () => {
    expect(isStagingReadOnly('True')).toBe(false);
    expect(isStagingReadOnly('TRUE')).toBe(false);
    expect(isStagingReadOnly('1')).toBe(false);
    expect(isStagingReadOnly('yes')).toBe(false);
    expect(isStagingReadOnly('')).toBe(false);
  });
});
