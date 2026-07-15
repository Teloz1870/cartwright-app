import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Minimal unit-test setup for apps/web — deliberately scoped to lib/ only.
// Pages/routes are exercised by `next build` + the deploy previews; these
// tests cover the pure Plus entitlement/token logic.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    include: ['lib/**/*.test.ts'],
    environment: 'node',
  },
});
