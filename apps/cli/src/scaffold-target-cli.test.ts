import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * GRK1 + R1 falsifier on app#415. target.test.ts pins the pre-flight functions;
 * this pins what index.ts DOES with them, by running the real entry point
 * (index.ts runs main() on import) the way a user does — `create-cartwright .
 * --yes` — fully offline:
 *
 * - fetch is replaced by a rejecting stub (giget, telemetry: the only network),
 * - HOME is empty and XDG_CACHE_HOME holds one fixture tarball where giget
 *   keeps its cache (github/<owner>-<repo>/<ref>.tar.gz), so the failed
 *   download falls back to it — if giget moves its cache, these fail loudly
 *   with "Template fetch failed", never pass by accident,
 * - `gh` on PATH is a stub that logs and fails, so no repository is ever
 *   created, and the env is built from scratch (no GH_TOKEN, no git config).
 *
 * Mutations of index.ts that the source-grep test let through all go red here:
 * scaffolding `.` into ./<slug>, ignoring the refusal, offering `gh repo
 * create` to a clone, and a banner that calls a clone "already on GitHub".
 */
const require = createRequire(import.meta.url);
const TSX_LOADER = pathToFileURL(join(dirname(require.resolve("tsx/package.json")), "dist", "loader.mjs")).href;
const INDEX = join(__dirname, "index.ts");
const REF = "e2e-offline-fixture";

let root = "";
let env: NodeJS.ProcessEnv = {};
let blockFetch = "";
let ghLog = "";

beforeAll(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), "cw-target-cli-")));
  const home = join(root, "home");
  const cache = join(root, "cache");
  const bin = join(root, "bin");
  for (const d of [home, bin, join(root, "tpl", "fixture")]) mkdirSync(d, { recursive: true });

  // The "template": enough files to see where it landed and what it replaced.
  const tpl = join(root, "tpl", "fixture");
  writeFileSync(join(tpl, "package.json"), '{ "name": "from-the-template" }\n');
  writeFileSync(join(tpl, "TEMPLATE_MARKER"), "template\n");
  writeFileSync(join(tpl, "README.md"), "# template readme\n");
  writeFileSync(join(tpl, ".gitignore"), "node_modules\n.env*.local\n");
  const tarDir = join(cache, "giget", "github", "Teloz1870-cartwright-template");
  mkdirSync(tarDir, { recursive: true });
  execSync(`tar czf "${join(tarDir, `${REF}.tar.gz`)}" fixture`, {
    cwd: join(root, "tpl"),
    env: { ...process.env, COPYFILE_DISABLE: "1" },
  });

  blockFetch = pathToFileURL(join(root, "block-fetch.mjs")).href;
  writeFileSync(
    join(root, "block-fetch.mjs"),
    'globalThis.fetch = () => Promise.reject(new Error("network blocked by the test"));\n',
  );
  ghLog = join(root, "gh-calls.log");
  writeFileSync(join(bin, "gh"), `#!/bin/sh\necho "$*" >> "${ghLog}"\nexit 1\n`);
  chmodSync(join(bin, "gh"), 0o755);

  env = {
    PATH: `${bin}:${process.env.PATH ?? ""}`,
    HOME: home,
    XDG_CACHE_HOME: cache,
    TMPDIR: process.env.TMPDIR ?? tmpdir(),
    NO_COLOR: "1",
    CARTWRIGHT_TELEMETRY: "0",
    DO_NOT_TRACK: "1",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_AUTHOR_NAME: "Test",
    GIT_AUTHOR_EMAIL: "test@example.test",
    GIT_COMMITTER_NAME: "Test",
    GIT_COMMITTER_EMAIL: "test@example.test",
  };
});

afterAll(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

function folder(name: string): string {
  const dir = join(root, "work", name);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function git(cwd: string, cmd: string): string {
  return execSync(`git ${cmd}`, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

/** A folder made the way the README says: `git clone <repo> <name>`. */
function clone(name: string): { dir: string; bare: string } {
  const seed = folder(`${name}-seed`);
  git(seed, "init -q");
  writeFileSync(join(seed, "README.md"), "# my repo\n");
  git(seed, "add -A");
  git(seed, "commit -qm init");
  const bare = join(root, "work", `${name}.git`);
  git(root, `clone -q --bare "${seed}" "${bare}"`);
  git(join(root, "work"), `clone -q "${bare}" "${name}"`);
  return { dir: join(root, "work", name), bare };
}

function scaffold(cwd: string, ...args: string[]) {
  const r = spawnSync(
    process.execPath,
    ["--import", TSX_LOADER, "--import", blockFetch, INDEX, ...args, "--yes", "--profile", "full", "--no-install", "--skip-skills", "--no-start", `--ref=${REF}`],
    { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 },
  );
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

/** The command the banner tells the user to run next, in the "Put it online" block. */
function printedCommand(out: string): string {
  const m = out.match(/^ {5}(git .+)$/m);
  if (!m) throw new Error(`no git command in the banner:\n${out}`);
  return m[1];
}

describe.skipIf(process.platform === "win32")("create-cartwright . — the real entry point, offline", () => {
  it("an empty folder: the template lands IN it, named after it (GRK1, GRK2)", () => {
    const dir = folder("nord-kaffe");
    const r = scaffold(dir, ".", "--no-git");
    expect(r.out).toContain(`Created nord-kaffe at ${dir}`);
    expect(r.code).toBe(0);
    expect(existsSync(join(dir, "TEMPLATE_MARKER"))).toBe(true);
    expect(existsSync(join(dir, "nord-kaffe"))).toBe(false);
  }, 60_000);

  it("a folder with a package.json is refused, and not one file in it changes", () => {
    const dir = folder("my-own-app");
    writeFileSync(join(dir, "package.json"), '{ "name": "mine" }\n');
    writeFileSync(join(dir, ".env"), "SECRET=1\n");
    const r = scaffold(dir, ".", "--no-git");
    expect(r.code).toBe(1);
    expect(r.out).toContain(`Directory "${dir}" is not empty (.env, package.json)`);
    expect(r.out).not.toContain("Fetching cartwright template");
    expect(readdirSync(dir).sort()).toEqual([".env", "package.json"]);
    expect(readFileSync(join(dir, "package.json"), "utf8")).toBe('{ "name": "mine" }\n');
  }, 60_000);

  it("a clone: no new GitHub repo, the banner says git push, and that push works", () => {
    const { dir, bare } = clone("cloned-shop");
    const r = scaffold(dir, ".", "--github");
    expect(r.code).toBe(0);
    expect(existsSync(ghLog)).toBe(false); // --github, yet gh was never asked: origin exists

    expect(r.out).not.toContain("already on GitHub");
    expect(r.out).not.toContain("runs on every push");
    expect(r.out).toContain("inactive until you push the scaffold commit to origin");
    expect(git(dir, "status -sb")).toMatch(/\[ahead 1\]/);

    const cmd = printedCommand(r.out);
    expect(cmd).toBe("git push -u origin HEAD");
    execSync(cmd, { cwd: dir, env, stdio: "ignore" });
    expect(git(dir, "status -sb")).not.toMatch(/ahead/);
    expect(git(bare, "cat-file -t HEAD:TEMPLATE_MARKER").trim()).toBe("blob");
  }, 60_000);

  it("a clone with --no-git: commit and push to the origin it has, never a second origin", () => {
    const { dir, bare } = clone("agent-shop");
    const r = scaffold(dir, ".", "--no-git");
    expect(r.code).toBe(0);
    expect(r.out).not.toContain("gh repo create");
    expect(r.out).not.toContain("until this project has a remote");
    expect(r.out).toContain("inactive until you commit it and push to origin");

    const cmd = printedCommand(r.out);
    expect(cmd).toMatch(/^git add -A && git commit -m .+ && git push -u origin HEAD$/);
    execSync(cmd, { cwd: dir, env, stdio: "ignore" });
    expect(git(bare, "cat-file -t HEAD:TEMPLATE_MARKER").trim()).toBe("blob");
    expect(git(dir, "status --porcelain")).toBe("");
  }, 60_000);
});
