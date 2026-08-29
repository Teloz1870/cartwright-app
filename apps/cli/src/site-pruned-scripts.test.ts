import { describe, expect, it } from "vitest";

import {
  SITE_PRUNED_SCRIPTS_FALLBACK,
  sitePrunedScriptsFor,
} from "./materializer";

/**
 * Which dev-only scripts a `--profile site` scaffold deletes is decided by the
 * ENGINE, not by this CLI. It used to be a hand-mirrored copy of the engine's
 * own list with nothing checking the two agreed, and that drift is not
 * hypothetical: `scripts/capture-locales.mjs` imports Playwright, which the
 * site profile prunes, so a scaffold keeping it ships a script it cannot run.
 *
 * The CLI now reads `sitePrunedScripts` out of `scaffold/manifest.json`. The
 * frozen fallback exists only for template refs cut before that field.
 */
describe("sitePrunedScriptsFor", () => {
  const manifest = (extra: Record<string, unknown> = {}) =>
    ({
      schema: "cartwright-scaffold-manifest-v1",
      modules: [],
      profiles: [],
      ...extra,
    }) as never;

  it("uses the engine's list when the ref declares one", () => {
    const declared = ["scripts/a.mjs", "scripts/b.ts"];
    expect(sitePrunedScriptsFor(manifest({ sitePrunedScripts: declared }))).toEqual(
      declared,
    );
  });

  it("falls back for a ref cut before the field existed", () => {
    // An older tag has no `sitePrunedScripts`. Pruning nothing at all would
    // ship a site scaffold full of scripts that cannot run, so the frozen list
    // still applies there.
    expect(sitePrunedScriptsFor(manifest())).toEqual(SITE_PRUNED_SCRIPTS_FALLBACK);
    expect(sitePrunedScriptsFor(null)).toEqual(SITE_PRUNED_SCRIPTS_FALLBACK);
  });

  it("treats an empty declaration as absent, not as 'prune nothing'", () => {
    // A generator bug that emits [] must not silently disable pruning.
    expect(sitePrunedScriptsFor(manifest({ sitePrunedScripts: [] }))).toEqual(
      SITE_PRUNED_SCRIPTS_FALLBACK,
    );
  });

  it("the fallback still names the scripts it was written for", () => {
    expect(SITE_PRUNED_SCRIPTS_FALLBACK).toContain("scripts/capture-gallery.mjs");
    expect(SITE_PRUNED_SCRIPTS_FALLBACK.length).toBeGreaterThan(10);
  });
});
