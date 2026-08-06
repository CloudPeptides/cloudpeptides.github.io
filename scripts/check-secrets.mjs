#!/usr/bin/env node
/**
 * Scans tracked files (and, if present, the built dist/ output) for
 * accidentally-committed secrets: JWT-shaped strings (Supabase keys are
 * JWTs), common API-key patterns, and private-key headers. Run via
 * `npm run check:secrets`. Exits non-zero if anything is found.
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { globSync } from 'node:fs';

const PATTERNS = [
  {
    name: 'JWT-shaped string (possible Supabase key)',
    re: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
  },
  {
    name: 'generic API/secret key assignment with a real-looking value',
    re: /(api[_-]?key|secret[_-]?key|service[_-]?role[_-]?key)\s*[:=]\s*['"][A-Za-z0-9_\-./+]{20,}['"]/gi,
  },
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/g },
  { name: 'private key header', re: /-----BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY-----/g },
  { name: 'GitHub token', re: /gh[pousr]_[A-Za-z0-9]{30,}/g },
];

// .env.example intentionally documents variable *names* only (no values)
// and is expected to be clean; still scanned like everything else — if
// this pattern set ever flags it, that's a real problem worth seeing.
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'legacy-site',
  '.wrangler',
  'test-results',
  'playwright-report',
];

function trackedFiles() {
  return execSync('git ls-files', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .filter((f) => !EXCLUDE_DIRS.some((d) => f.startsWith(`${d}/`)));
}

function scanFile(path, contents, findings) {
  for (const { name, re } of PATTERNS) {
    const matches = contents.match(re);
    if (matches) {
      findings.push({ path, pattern: name, count: matches.length });
    }
  }
}

function main() {
  const findings = [];

  for (const path of trackedFiles()) {
    let contents;
    try {
      contents = readFileSync(path, 'utf8');
    } catch {
      continue; // binary or unreadable — skip
    }
    scanFile(path, contents, findings);
  }

  if (existsSync('dist/client')) {
    const distFiles = globSync('dist/client/**/*.{html,js,css,json}');
    for (const path of distFiles) {
      const contents = readFileSync(path, 'utf8');
      scanFile(path, contents, findings);
    }
  }

  if (findings.length === 0) {
    console.log('No secret-like patterns found in tracked files or dist/client.');
    return;
  }

  console.error(`Found ${findings.length} potential secret(s):`);
  for (const f of findings) {
    console.error(`  ${f.path}: ${f.pattern} (${f.count}x)`);
  }
  process.exit(1);
}

main();
