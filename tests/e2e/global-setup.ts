import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startPreviewServer } from '../../scripts/lib/preview-server.mjs';

const PREVIEW_URL = 'http://localhost:4321';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.resolve(__dirname, '.auth');
export const RESEARCHER_STORAGE_STATE = path.join(AUTH_DIR, 'researcher.json');

// A dedicated, already-certified test account (mandatory researcher-
// account gate, 2026-08-13) — seeded once via a one-off admin script
// against the real Supabase project (auth.admin.createUser +
// researcher_profiles/researcher_attestations rows), same account every
// run. Not a secret worth protecting: it has the lowest ('member') role
// and can do nothing an admin/service credential could — it exists only
// so the e2e suite can reach past the login gate the same way a real
// researcher would, via the real /api/account/login route.
const TEST_EMAIL = 'e2e-researcher-test@cloudpeptides.invalid';
const TEST_PASSWORD = 'E2eResearcherTestAccount!2026';

async function seedResearcherStorageState(): Promise<void> {
  const response = await fetch(`${PREVIEW_URL}/api/account/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  if (!response.ok) {
    throw new Error(
      `e2e researcher login setup failed (${response.status}): ${await response.text()}. ` +
        "Has the test account been seeded in this environment's Supabase project?",
    );
  }
  const setCookies =
    typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  const cookies = setCookies.map((raw) => {
    const [pair] = raw.split(';');
    const eq = pair.indexOf('=');
    return {
      name: pair.slice(0, eq),
      value: pair.slice(eq + 1),
      domain: 'localhost',
      path: '/',
      expires: -1,
      httpOnly: raw.toLowerCase().includes('httponly'),
      secure: false,
      sameSite: 'Lax' as const,
    };
  });

  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(RESEARCHER_STORAGE_STATE, JSON.stringify({ cookies, origins: [] }, null, 2));
}

export default async function globalSetup(): Promise<void> {
  await startPreviewServer();
  await seedResearcherStorageState();
}
