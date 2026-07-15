import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkSentinels,
  checkReleaseMarker,
  compareSemverish,
  checkUpToDate,
  checkProfile,
  checkNode,
  parseEnvFile,
  isPlaceholderSecret,
  checkEnv,
  hasDbVerifyScript,
  checkDbVerify,
  collectChecks,
  type SpawnRunner,
} from "./doctor.js";
import { DEFAULT_REF } from "./refs.js";

const VALID_MARKER = JSON.stringify({
  engine: "cartwright",
  channel: "stable",
  ref: "v0.36.0",
  version: "v0.36.0",
  commit: "abc1234",
  releasedAt: "2026-06-15T12:00:00Z",
});

describe("checkSentinels", () => {
  it("ok when all three sentinels exist", () => {
    const res = checkSentinels({ brandConfig: true, schema: true, pkg: true });
    expect(res.status).toBe("ok");
  });
  it("fails and names the missing files", () => {
    const res = checkSentinels({ brandConfig: false, schema: true, pkg: false });
    expect(res.status).toBe("fail");
    expect(res.detail).toContain("brand.config.ts");
    expect(res.detail).toContain("package.json");
    expect(res.detail).not.toContain("schema.prisma");
    expect(res.detail).toContain("Cartwright project root");
  });
});

describe("checkReleaseMarker", () => {
  it("parses a valid marker", () => {
    const { result, marker } = checkReleaseMarker(VALID_MARKER);
    expect(result.status).toBe("ok");
    expect(marker?.version).toBe("v0.36.0");
    expect(result.detail).toContain("v0.36.0");
    expect(result.detail).toContain("stable");
  });
  it("warns when the file is missing", () => {
    const { result, marker } = checkReleaseMarker(null);
    expect(result.status).toBe("warn");
    expect(result.detail).toContain("pre-v0.22");
    expect(marker).toBeNull();
  });
  it("warns on garbage JSON", () => {
    const { result, marker } = checkReleaseMarker("{not json!");
    expect(result.status).toBe("warn");
    expect(result.detail).toContain("could not be parsed");
    expect(marker).toBeNull();
  });
  it("warns on non-object JSON", () => {
    expect(checkReleaseMarker('"just a string"').result.status).toBe("warn");
    expect(checkReleaseMarker("[1,2]").result.status).toBe("warn");
  });
  it("notes the source channel", () => {
    const raw = JSON.stringify({ version: "v0.36.0", channel: "source" });
    const { result } = checkReleaseMarker(raw);
    expect(result.status).toBe("ok");
    expect(result.detail).toContain("engine source");
  });
});

describe("compareSemverish", () => {
  const table: Array<[string, string, -1 | 0 | 1 | null]> = [
    ["v0.39.1", "v0.39.1", 0],
    ["0.39.1", "v0.39.1", 0], // v-prefix optional
    ["v0.38.0", "v0.39.1", -1],
    ["v0.39.0", "v0.39.1", -1],
    ["v0.40.0", "v0.39.1", 1],
    ["v1.0.0", "v0.99.99", 1],
    ["v0.9.0", "v0.10.0", -1], // numeric, not lexicographic
    ["v0.39.1-rc.1", "v0.39.1", 0], // base compare only — checkUpToDate flags the suffix
    ["v0.40.0-rc.1", "v0.39.1", 1], // suffix doesn't break base ordering
    ["v0.38.0-beta.2", "v0.39.1", -1],
    ["main", "v0.39.1", null],
    ["v0.39.1", "garbage", null],
  ];
  for (const [a, b, want] of table) {
    it(`${a} vs ${b} → ${String(want)}`, () => {
      expect(compareSemverish(a, b)).toBe(want);
    });
  }
});

describe("checkUpToDate", () => {
  it("ok when equal", () => {
    expect(checkUpToDate("v0.39.1", "v0.39.1").status).toBe("ok");
  });
  it("warns when older, pointing at the docs — no network", () => {
    const res = checkUpToDate("v0.36.0", "v0.39.1");
    expect(res.status).toBe("warn");
    expect(res.detail).toContain("behind v0.39.1");
    expect(res.detail).toContain("cartwright.app/docs");
    expect(res.detail).toContain("No network");
  });
  it("ok (note) when newer than this CLI's known latest", () => {
    const res = checkUpToDate("v9.9.9", "v0.39.1");
    expect(res.status).toBe("ok");
    expect(res.detail).toContain("ahead");
  });
  it("skips when there is no version", () => {
    expect(checkUpToDate(null, "v0.39.1").status).toBe("skip");
    expect(checkUpToDate(undefined, "v0.39.1").status).toBe("skip");
  });
  it("skips when the version is not a tag", () => {
    expect(checkUpToDate("next", "v0.39.1").status).toBe("skip");
  });
  it("warns on a pre-release engine with the same base version", () => {
    const res = checkUpToDate("v0.39.1-rc.1", "v0.39.1");
    expect(res.status).toBe("warn");
    expect(res.detail).toContain("pre-release");
    expect(res.detail).toContain("stable tag");
  });
  it("warns when the latest side carries a suffix and bases are equal", () => {
    expect(checkUpToDate("v0.39.1", "v0.39.1-rc.1").status).toBe("warn");
  });
  it("older pre-release still reports plain 'behind'", () => {
    expect(checkUpToDate("v0.38.0-beta.2", "v0.39.1").status).toBe("warn");
    expect(checkUpToDate("v0.38.0-beta.2", "v0.39.1").detail).toContain("behind");
  });
});

describe("checkProfile", () => {
  it("ok when the marker is absent (full or pre-profile scaffold)", () => {
    const res = checkProfile(null);
    expect(res.status).toBe("ok");
    expect(res.detail).toContain("full profile or a pre-profile scaffold");
  });
  it("reports profile + kept designs", () => {
    const raw = JSON.stringify({
      profile: "light",
      generatedBy: "create-cartwright@2.5.3",
      keptDesigns: ["aurora-site", "fable", "meridian"],
    });
    const res = checkProfile(raw);
    expect(res.status).toBe("ok");
    expect(res.detail).toContain('"light"');
    expect(res.detail).toContain("3 designs kept");
  });
  it("warns on garbage", () => {
    expect(checkProfile("!!").status).toBe("warn");
  });
});

describe("checkNode", () => {
  it("ok on 22 and above", () => {
    expect(checkNode("v22.11.0").status).toBe("ok");
    expect(checkNode("v24.1.0").status).toBe("ok");
  });
  it("warns below 22", () => {
    const res = checkNode("v20.19.0");
    expect(res.status).toBe("warn");
    expect(res.detail).toContain("≥ 22");
  });
});

describe("parseEnvFile", () => {
  it("parses the common shapes", () => {
    const env = parseEnvFile(
      [
        "# a comment",
        "",
        "AUTH_SECRET=plainvalue",
        'DATABASE_URL="file:./prisma/dev.db"',
        "TURSO_AUTH_TOKEN='single-quoted'",
        "export EXPORTED=yes",
        "WITH_EQUALS=a=b=c",
        "SPACED = padded ",
        "not a line",
      ].join("\n"),
    );
    expect(env.AUTH_SECRET).toBe("plainvalue");
    expect(env.DATABASE_URL).toBe("file:./prisma/dev.db");
    expect(env.TURSO_AUTH_TOKEN).toBe("single-quoted");
    expect(env.EXPORTED).toBe("yes");
    expect(env.WITH_EQUALS).toBe("a=b=c");
    expect(env.SPACED).toBe("padded");
    expect(Object.keys(env)).toHaveLength(6);
  });
  it("strips an inline comment after a quoted value", () => {
    const env = parseEnvFile('AUTH_SECRET="real-value" # prod secret\n');
    expect(env.AUTH_SECRET).toBe("real-value");
  });
  it("strips an inline comment after an unquoted value", () => {
    const env = parseEnvFile("DATABASE_URL=file:./prisma/dev.db # local sqlite\n");
    expect(env.DATABASE_URL).toBe("file:./prisma/dev.db");
  });
  it("preserves # inside quotes", () => {
    const env = parseEnvFile('PASSWORD="p#ss w#rd" # trailing\nOTHER=\'a # b\'\n');
    expect(env.PASSWORD).toBe("p#ss w#rd");
    expect(env.OTHER).toBe("a # b");
  });
  it("keeps unquoted fragments without whitespace before # intact", () => {
    expect(parseEnvFile("KEY=a#b\n").KEY).toBe("a#b");
  });
  it("returns {} on empty input", () => {
    expect(parseEnvFile("")).toEqual({});
  });
});

describe("isPlaceholderSecret", () => {
  const placeholders = [undefined, "", "  ", "changeme", "CHANGE_ME", "todo", "placeholder", "replace-me", "your-secret-here", "xxx", "<generate-one>", "..."];
  for (const v of placeholders) {
    it(`treats ${JSON.stringify(v)} as placeholder`, () => {
      expect(isPlaceholderSecret(v)).toBe(true);
    });
  }
  it("accepts a real secret", () => {
    expect(isPlaceholderSecret("dGhpcy1pcy1hLXJlYWwtc2VjcmV0LXZhbHVlCg==")).toBe(false);
  });
});

describe("checkEnv", () => {
  it("warns when .env.local is missing", () => {
    const res = checkEnv({ envLocalExists: false, env: {} });
    expect(res.status).toBe("warn");
    expect(res.detail).toContain(".env.local not found");
  });
  it("ok with AUTH_SECRET + DATABASE_URL", () => {
    const res = checkEnv({
      envLocalExists: true,
      env: { AUTH_SECRET: "a-real-secret-0123456789", DATABASE_URL: "file:./prisma/dev.db" },
    });
    expect(res.status).toBe("ok");
  });
  it("ok with AUTH_SECRET + the Turso pair", () => {
    const res = checkEnv({
      envLocalExists: true,
      env: {
        AUTH_SECRET: "a-real-secret-0123456789",
        TURSO_DATABASE_URL: "libsql://x.turso.io",
        TURSO_AUTH_TOKEN: "tok",
      },
    });
    expect(res.status).toBe("ok");
  });
  it("fails on a placeholder AUTH_SECRET", () => {
    const res = checkEnv({
      envLocalExists: true,
      env: { AUTH_SECRET: "changeme", DATABASE_URL: "file:./prisma/dev.db" },
    });
    expect(res.status).toBe("fail");
    expect(res.detail).toContain("AUTH_SECRET");
  });
  it("fails when only half the Turso pair is set", () => {
    const res = checkEnv({
      envLocalExists: true,
      env: { AUTH_SECRET: "a-real-secret-0123456789", TURSO_DATABASE_URL: "libsql://x" },
    });
    expect(res.status).toBe("fail");
    expect(res.detail).toContain("database URL");
  });
});

describe("hasDbVerifyScript", () => {
  it("detects the script", () => {
    expect(hasDbVerifyScript(JSON.stringify({ scripts: { "db:verify": "tsx x.ts" } }))).toBe(true);
  });
  it("false when absent / garbage / null", () => {
    expect(hasDbVerifyScript(JSON.stringify({ scripts: {} }))).toBe(false);
    expect(hasDbVerifyScript("{oops")).toBe(false);
    expect(hasDbVerifyScript(null)).toBe(false);
  });
});

describe("checkDbVerify", () => {
  const runner =
    (status: number | null, error = false): SpawnRunner =>
    () => ({ status, error });

  it("skips when pnpm is missing", () => {
    const res = checkDbVerify({ hasScript: true, pnpmOnPath: false, cwd: "/x", run: runner(0) });
    expect(res.status).toBe("skip");
    expect(res.detail).toContain("pnpm not found");
  });
  it("skips when the script is missing", () => {
    const res = checkDbVerify({ hasScript: false, pnpmOnPath: true, cwd: "/x", run: runner(0) });
    expect(res.status).toBe("skip");
  });
  it("ok on exit 0", () => {
    expect(
      checkDbVerify({ hasScript: true, pnpmOnPath: true, cwd: "/x", run: runner(0) }).status,
    ).toBe("ok");
  });
  it("warns with the drift message on exit 2 (concrete CI consequence)", () => {
    const res = checkDbVerify({ hasScript: true, pnpmOnPath: true, cwd: "/x", run: runner(2) });
    expect(res.status).toBe("warn");
    expect(res.detail).toContain("drift");
    expect(res.detail).toContain("ci.yml");
    expect(res.detail).toContain("prisma/migrations/README.md");
  });
  it("warns with a manual-run hint when db:verify times out", () => {
    const timeoutRunner: SpawnRunner = () => ({ status: null, error: true, timedOut: true });
    const res = checkDbVerify({ hasScript: true, pnpmOnPath: true, cwd: "/x", run: timeoutRunner });
    expect(res.status).toBe("warn");
    expect(res.detail).toContain("timed out after 60s");
    expect(res.detail).toContain("pnpm db:verify");
  });
  it("warns 'could not verify' on other exits", () => {
    const res = checkDbVerify({ hasScript: true, pnpmOnPath: true, cwd: "/x", run: runner(1) });
    expect(res.status).toBe("warn");
    expect(res.detail).toContain("could not verify");
  });
  it("warns when the spawn itself errors", () => {
    const res = checkDbVerify({
      hasScript: true,
      pnpmOnPath: true,
      cwd: "/x",
      run: runner(null, true),
    });
    expect(res.status).toBe("warn");
  });
});

describe("collectChecks (integration against a fake scaffold)", () => {
  /** A stub runner: pnpm exists, db:verify exits with the given code. */
  const stubRunner =
    (dbVerifyExit: number): SpawnRunner =>
    (cmd, args) => {
      if (args.includes("--version")) return { status: 0 };
      if (args.includes("db:verify")) return { status: dbVerifyExit };
      return { status: 1, error: true };
    };

  function makeScaffold(dir: string): void {
    writeFileSync(join(dir, "brand.config.ts"), "export const brand = {};\n");
    mkdirSync(join(dir, "prisma"), { recursive: true });
    writeFileSync(join(dir, "prisma", "schema.prisma"), "// schema\n");
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "fake-shop", scripts: { "db:verify": "tsx scripts/db-verify.ts" } }),
    );
    mkdirSync(join(dir, ".cartwright"), { recursive: true });
    writeFileSync(join(dir, ".cartwright", "release.json"), VALID_MARKER);
    writeFileSync(
      join(dir, ".cartwright", "profile.json"),
      JSON.stringify({ profile: "light", keptDesigns: ["aurora-site", "fable"] }),
    );
    writeFileSync(
      join(dir, ".env.local"),
      'AUTH_SECRET="dGhpcy1pcy1hLXJlYWwtc2VjcmV0Cg=="\nDATABASE_URL="file:./prisma/dev.db"\n',
    );
  }

  it("aggregates statuses for a healthy (but older-engine) scaffold", () => {
    const dir = mkdtempSync(join(tmpdir(), "cw-doctor-"));
    try {
      makeScaffold(dir);
      const { checks, ok } = collectChecks(dir, {
        run: stubRunner(0),
        nodeVersion: "v22.11.0",
      });
      const byId = Object.fromEntries(checks.map((c) => [c.id, c]));
      expect(byId.project.status).toBe("ok");
      expect(byId.release.status).toBe("ok");
      // Marker is v0.36.0 — older than the DEFAULT_REF this CLI ships with.
      expect(byId["up-to-date"].status).toBe("warn");
      expect(byId["up-to-date"].detail).toContain(DEFAULT_REF);
      expect(byId.profile.status).toBe("ok");
      expect(byId.profile.detail).toContain("2 designs kept");
      expect(byId.node.status).toBe("ok");
      expect(byId.env.status).toBe("ok");
      expect(byId.db.status).toBe("ok");
      // Warnings never fail the run.
      expect(ok).toBe(true);
      expect(checks).toHaveLength(7);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("surfaces drift + placeholder env as warn/fail", () => {
    const dir = mkdtempSync(join(tmpdir(), "cw-doctor2-"));
    try {
      makeScaffold(dir);
      writeFileSync(join(dir, ".env.local"), "AUTH_SECRET=changeme\n");
      const { checks, ok } = collectChecks(dir, {
        run: stubRunner(2),
        nodeVersion: "v22.11.0",
      });
      const byId = Object.fromEntries(checks.map((c) => [c.id, c]));
      expect(byId.env.status).toBe("fail");
      expect(byId.db.status).toBe("warn");
      expect(byId.db.detail).toContain("drift");
      expect(ok).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("short-circuits to a single fail outside a Cartwright project", () => {
    const dir = mkdtempSync(join(tmpdir(), "cw-doctor3-"));
    try {
      const { checks, ok } = collectChecks(dir, { run: stubRunner(0) });
      expect(checks).toHaveLength(1);
      expect(checks[0].id).toBe("project");
      expect(checks[0].status).toBe("fail");
      expect(ok).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("merges .env and .env.local with local precedence", () => {
    const dir = mkdtempSync(join(tmpdir(), "cw-doctor4-"));
    try {
      makeScaffold(dir);
      // DB url only in .env; .env.local overrides a placeholder from .env.
      writeFileSync(join(dir, ".env"), "DATABASE_URL=file:./prisma/dev.db\nAUTH_SECRET=changeme\n");
      writeFileSync(join(dir, ".env.local"), "AUTH_SECRET=real-secret-0123456789\n");
      const { checks } = collectChecks(dir, { run: stubRunner(0), nodeVersion: "v22.0.0" });
      const env = checks.find((c) => c.id === "env");
      expect(env?.status).toBe("ok");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
