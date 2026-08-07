import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      // `cloudflare:workers` only resolves inside the real Workers/
      // Miniflare runtime — aliased here so src/lib/auth.ts (the only
      // file that imports it) can still be unit-tested. See
      // tests/mocks/cloudflare-workers.ts's own header comment.
      'cloudflare:workers': fileURLToPath(
        new URL('./tests/mocks/cloudflare-workers.ts', import.meta.url),
      ),
    },
  },
});
