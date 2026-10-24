import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * create-cartwright 2.10 is a version the engine has already promised. Docs
 * that ship in every scaffold (README.md, FORK_GUIDE.md, docs/simple-site.md,
 * tests/guards/README.md) say that from 2.10 the scaffolder removes the
 * engine-only paths listed in the engine's ledger (scaffold/manifest.json →
 * `engineOnly`) and that contact-form becomes opt-in in the site profile.
 *
 * A minor changeset turns the pending release PR into 2.10.0, so until the CLI
 * reads that ledger every pending create-cartwright changeset must be a patch.
 * Otherwise a 2.10.0 ships that does none of what the docs say (R1 falsifier,
 * app#419). The work that implements the ledger names `engineOnly`; that is
 * what unlocks a minor here.
 */
const SRC = __dirname;
const CHANGESETS = join(SRC, "..", "..", "..", ".changeset");

/** Each pending changeset that names create-cartwright, with its bump (null when unreadable). */
function pendingBumps(): Array<{ file: string; bump: string | null }> {
  return readdirSync(CHANGESETS)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .flatMap((file) => {
      const front = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(CHANGESETS, file), "utf8"))?.[1] ?? "";
      if (!front.includes("create-cartwright")) return [];
      const bump = /^["']?create-cartwright["']?:\s*(patch|minor|major)\s*$/m.exec(front)?.[1] ?? null;
      return [{ file, bump }];
    });
}

function cliReadsEngineOnlyLedger(): boolean {
  return readdirSync(SRC)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .some((f) => readFileSync(join(SRC, f), "utf8").includes("engineOnly"));
}

describe("the next create-cartwright release", () => {
  it("stays a patch until the CLI does what the engine promises for 2.10", () => {
    if (cliReadsEngineOnlyLedger()) return;

    // An unreadable bump (null) fails too: it must not slip past the guard.
    const beyondPatch = pendingBumps().filter(({ bump }) => bump !== "patch");
    expect(beyondPatch, "these changesets would publish create-cartwright 2.10.0").toEqual([]);
  });
});
