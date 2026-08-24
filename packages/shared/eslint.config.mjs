import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

/**
 * ESLint v9 flat config for @cartwright/shared.
 *
 * Minimal on purpose, mirroring apps/cli: this package has `tsc --noEmit`,
 * so ESLint is just a thin anti-pattern net. typescript-eslint's parser is
 * used so `import type` and generic syntax parse cleanly; rules stay
 * conservative so existing src/ passes without churn.
 */
export default defineConfig([
  globalIgnores(["dist/**", "node_modules/**", "coverage/**"]),
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
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
