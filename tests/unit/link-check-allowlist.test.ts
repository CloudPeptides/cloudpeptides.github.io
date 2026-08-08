import { describe, expect, it } from 'vitest';
import { classifyBrokenLinks } from '../../scripts/lib/link-check-allowlist.mjs';

// Locks in the safety property scripts/check-links.mjs's CI gate
// depends on: the allowlist is exact-URL only, never a domain-wide
// exemption, and never a "stop failing the build entirely" switch —
// see that file's own comment for the full reasoning (added
// 2026-08-08 after doi.org/fda.gov bot-detection was found to return
// non-deterministic 403/404s to the automated crawler).

describe('classifyBrokenLinks', () => {
  const allowlist = new Set(['https://example.com/known-flaky']);

  it('puts an allowlisted broken link into allowlistedBroken, not realBroken', () => {
    const { allowlistedBroken, realBroken } = classifyBrokenLinks(
      [{ url: 'https://example.com/known-flaky', state: 'BROKEN', status: 403 }],
      allowlist,
    );
    expect(allowlistedBroken).toHaveLength(1);
    expect(realBroken).toHaveLength(0);
  });

  it('a non-allowlisted broken link still counts as realBroken — internal and other external links keep blocking', () => {
    const { allowlistedBroken, realBroken } = classifyBrokenLinks(
      [{ url: 'https://example.com/genuinely-dead', state: 'BROKEN', status: 404 }],
      allowlist,
    );
    expect(realBroken).toHaveLength(1);
    expect(allowlistedBroken).toHaveLength(0);
  });

  it('does not match by domain/prefix — a different, unverified path on an allowlisted domain still blocks', () => {
    const { allowlistedBroken, realBroken } = classifyBrokenLinks(
      [{ url: 'https://example.com/known-flaky/some-other-page', state: 'BROKEN', status: 404 }],
      allowlist,
    );
    expect(realBroken).toHaveLength(1);
    expect(allowlistedBroken).toHaveLength(0);
  });

  it('OK links are ignored entirely, allowlisted or not', () => {
    const { allowlistedBroken, realBroken } = classifyBrokenLinks(
      [{ url: 'https://example.com/known-flaky', state: 'OK', status: 200 }],
      allowlist,
    );
    expect(allowlistedBroken).toHaveLength(0);
    expect(realBroken).toHaveLength(0);
  });

  it('handles a realistic mixed batch correctly', () => {
    const { allowlistedBroken, realBroken } = classifyBrokenLinks(
      [
        { url: 'https://example.com/known-flaky', state: 'BROKEN', status: 403 },
        { url: '/research/compounds/bpc-157', state: 'OK', status: 200 },
        { url: 'https://example.com/a-real-dead-link', state: 'BROKEN', status: 404 },
      ],
      allowlist,
    );
    expect(allowlistedBroken.map((l) => l.url)).toEqual(['https://example.com/known-flaky']);
    expect(realBroken.map((l) => l.url)).toEqual(['https://example.com/a-real-dead-link']);
  });
});
