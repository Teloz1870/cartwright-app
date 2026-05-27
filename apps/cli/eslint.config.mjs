import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

/**
 * ESLint v9 flat config for the create-cartwright CLI.
 *
 * Minimal on purpose: this package has `tsc --noEmit` + vitest, so ESLint
 * here is just a thin style/anti-pattern net rather than the load-bearing
 * type checker. Uses typescript-eslint's parser so `import type` and
 * generic syntax parse cleanly; rules stay conservative so existing src/
 * passes without churn.
 */
export default defineConfig([
  globalIgnores(["dist/**", "node_modules/**", "coverage/**"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        NodeJS: "readonly",
      },
    },
    rules: {
      // TypeScript handles these — turning them off in the JS-eslint pass
      // avoids false positives on `import type`-only references and
      // ambient declarations.
      "no-unused-vars": "off",
      "no-undef": "off",
      // Real footguns we still want to catch:
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-constant-condition": ["error", { checkLoops: false }],
      "no-debugger": "error",
    },
  },
]);
