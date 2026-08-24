import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The bump-template-ref workflow seds two version constants by anchored line
 * shape. If either line drifts from its documented shape — or the workflow
 * loses one of its sed targets — the daily bump PR silently stops updating
 * that constant and the design-system contract e2e goes red on every release
 * (which is exactly what happened for v0.46.0 and v0.47.0). This test makes
 * the drift loud at unit-test time instead.
 */
const repoRoot = join(__dirname, "..", "..", "..");

describe("bump-workflow version anchors", () => {
  it("refs.ts keeps the DEFAULT_REF line shape the workflow seds", () => {
    const refs = readFileSync(join(repoRoot, "apps/cli/src/refs.ts"), "utf8");
    expect(refs).toMatch(/^export const DEFAULT_REF = "v\d+\.\d+\.\d+";$/m);
  });

  it("engine.ts keeps the FALLBACK_ENGINE_VERSION line shape the workflow seds", () => {
    const engine = readFileSync(join(repoRoot, "apps/web/lib/engine.ts"), "utf8");
    // No v-prefix here — the workflow strips it from the tag before this sed.
    expect(engine).toMatch(/^export const FALLBACK_ENGINE_VERSION = '\d+\.\d+\.\d+';$/m);
  });

  it("the workflow seds BOTH constants", () => {
    const workflow = readFileSync(
      join(repoRoot, ".github/workflows/bump-template-ref.yml"),
      "utf8",
    );
    expect(workflow).toContain('export const DEFAULT_REF = "');
    expect(workflow).toContain("export const FALLBACK_ENGINE_VERSION = '");
  });

  it("the two constants agree right now", () => {
    const refs = readFileSync(join(repoRoot, "apps/cli/src/refs.ts"), "utf8");
    const engine = readFileSync(join(repoRoot, "apps/web/lib/engine.ts"), "utf8");
    const shipped = refs.match(/^export const DEFAULT_REF = "v([^"]+)";$/m)?.[1];
    const fallback = engine.match(/^export const FALLBACK_ENGINE_VERSION = '([^']+)';$/m)?.[1];
    expect(shipped).toBeTruthy();
    expect(fallback).toBe(shipped);
  });
});
