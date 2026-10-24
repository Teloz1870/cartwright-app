import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/**
 * EXT1 (Grok 4.7 report, verified 2026-10-03 on npm 2.9.10): the CLI had no
 * `--version`, and node:util `parseArgs` (strict) throws on any flag it does
 * not know — so `--version`, `-v` and every typo'd flag ended in
 * "Unexpected error: TypeError [ERR_PARSE_ARGS_UNKNOWN_OPTION]" plus a stack
 * trace, exit 1. index.ts runs on import, so these run the real entry point
 * through tsx in an empty directory: exit code, stdout and stderr are what a
 * user (or an AI reading the terminal) actually gets.
 */
const require = createRequire(import.meta.url);
const TSX_CLI = join(dirname(require.resolve("tsx/package.json")), "dist", "cli.mjs");
const INDEX = join(__dirname, "index.ts");
const VERSION: string = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf8"),
).version;
const cwd = mkdtempSync(join(tmpdir(), "cw-cli-flags-"));
afterAll(() => rmSync(cwd, { recursive: true, force: true }));

function cli(...args: string[]) {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NO_COLOR: "1",
    CARTWRIGHT_TELEMETRY: "0",
    DO_NOT_TRACK: "1",
  };
  delete env.FORCE_COLOR;
  const r = spawnSync(process.execPath, [TSX_CLI, INDEX, ...args], {
    cwd,
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 60_000,
  });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

const NO_STACK = /Unexpected error|TypeError|\n\s+at /;

describe("--version / -v", () => {
  for (const flag of ["--version", "-v"]) {
    it(`${flag} prints the package version and exits 0`, () => {
      const r = cli(flag);
      expect(r.code).toBe(0);
      expect(r.stdout.trim()).toBe(`create-cartwright ${VERSION}`);
      expect(r.stderr).toBe("");
    }, 60_000);
  }
});

describe("bad flags are a one-line usage error, never a stack trace", () => {
  const cases: Array<[string[], RegExp]> = [
    [["--bogus"], /^Unknown option '--bogus'\. Run create-cartwright --help/],
    [["--db"], /^Option '--db <value>' argument missing\. Run create-cartwright --help/],
    [["doctor", "--bogus"], /^Unknown option '--bogus'\. Run create-cartwright --help/],
  ];
  for (const [args, line] of cases) {
    it(`${args.join(" ")} → exit 2, one line on stderr`, () => {
      const r = cli(...args);
      expect(r.code).toBe(2);
      expect(r.stdout).toBe("");
      expect(r.stderr.trim()).toMatch(line);
      expect(r.stderr.trim().split("\n")).toHaveLength(1);
      expect(r.stderr).not.toMatch(NO_STACK);
    }, 60_000);
  }
});
