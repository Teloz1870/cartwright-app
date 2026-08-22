import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Minimal unit-test setup for apps/web — deliberately scoped to lib/ only.
// Pages/routes are exercised by `next build` + the deploy previews; these
// tests cover the pure Plus entitlement/token logic.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      // Mirrors tsconfig's `collections/*` → `./.source/*`. fumadocs-mdx
      // generates that directory (the `postinstall` and `types:check` scripts
      // both run it), and `lib/source.ts` imports through the alias — so
      // without this any test that reaches the docs source fails to resolve
      // rather than failing an assertion.
      collections: fileURLToPath(new URL('./.source', import.meta.url)),
    },
  },
  test: {
    include: ['lib/**/*.test.ts'],
    environment: 'node',
  },
});
