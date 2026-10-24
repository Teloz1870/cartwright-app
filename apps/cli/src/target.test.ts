import { afterEach, describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  DEFAULT_PROJECT_NAME,
  existingRemote,
  inspectScaffoldTarget,
  prepareScaffoldTarget,
  resolveProjectArg,
} from "./target";
import { hasGitRemote, titleCase } from "./scaffold";

/**
 * GRK1 + GRK2 (Grok 4.6 scaffolding from zero, 2026-09-18). Measured on
 * cartwright-app 5fef410: `npx create-cartwright .` refused every directory,
 * even an empty one, because index.ts:697 cancelled on `existsSync(targetDir)`
 * and `resolve(cwd, ".")` always exists; and index.ts:526 used the whole
 * positional as the project name, so `/tmp/cartwright-new` became
 * storeName "/tmp/cartwright New" and storeSlug "/tmp/cartwright-new".
 */
const SLUG = /^[a-z][a-z0-9-]*$/;

describe("resolveProjectArg — the name comes from the last path segment (GRK2)", () => {
  it("no positional keeps the old default and leaves the directory to the name", () => {
    expect(resolveProjectArg(undefined, "/work")).toEqual({ name: DEFAULT_PROJECT_NAME });
  });

  it("an absolute path is the directory; its basename is the name", () => {
    const t = resolveProjectArg("/tmp/x-y", "/work");
    expect(t).toEqual({ dir: "/tmp/x-y", name: "x-y" });
    expect(titleCase(resolveProjectArg("/tmp/cartwright-new/", "/work").name)).toBe("Cartwright New");
  });

  it("a relative path resolves against cwd", () => {
    expect(resolveProjectArg("./x", "/work")).toEqual({ dir: "/work/x", name: "x" });
  });

  it("`.` is the current directory, named after it", () => {
    expect(resolveProjectArg(".", "/Users/k/code/nord-kaffe")).toEqual({
      dir: "/Users/k/code/nord-kaffe",
      name: "nord-kaffe",
    });
  });

  it("spaces and capitals become a valid slug, the folder keeps its own name", () => {
    expect(resolveProjectArg("My Shop", "/work")).toEqual({ dir: "/work/My Shop", name: "my-shop" });
  });

  it("æ ø å are transliterated, not stripped", () => {
    expect(resolveProjectArg("Hegnsfabrikken-Æblehave", "/w").name).toBe("hegnsfabrikken-aeblehave");
    expect(resolveProjectArg("Ørsted Gård", "/w").name).toBe("oersted-gaard");
  });

  it("a system folder or the user's own name never becomes the shop's name", () => {
    expect(resolveProjectArg(".", "/tmp").name).toBe(DEFAULT_PROJECT_NAME);
    expect(resolveProjectArg(".", "/home").name).toBe(DEFAULT_PROJECT_NAME);
    expect(resolveProjectArg("/", "/w").name).toBe(DEFAULT_PROJECT_NAME);
    expect(resolveProjectArg(".", "/srv/kenni", "kenni").name).toBe(DEFAULT_PROJECT_NAME);
    expect(resolveProjectArg("2026", "/w").name).toBe(DEFAULT_PROJECT_NAME);
  });

  it("whatever the path, the name is a slug with no slash in it", () => {
    for (const arg of ["/tmp/cartwright-new", "../a/b/c", "./Kaffe & Kage", "x/", "-shop-", "123-shop", "Straße"]) {
      const { name } = resolveProjectArg(arg, "/work");
      expect(name, arg).toMatch(SLUG);
    }
  });
});

describe("inspectScaffoldTarget — `.` and near-empty folders are allowed (GRK1)", () => {
  function withDir(entries: string[], fn: (dir: string) => void): void {
    const dir = mkdtempSync(join(tmpdir(), "cw-target-"));
    try {
      for (const e of entries) {
        if (e.endsWith("/")) mkdirSync(join(dir, e));
        else writeFileSync(join(dir, e), "x");
      }
      fn(dir);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  const home = "/nonexistent-home-for-test";

  it("a folder that does not exist yet is fine", () => {
    withDir([], (dir) => {
      expect(inspectScaffoldTarget(join(dir, "new-shop"), home)).toEqual({ ok: true, replaces: [] });
    });
  });

  it("an empty folder is fine — the case `create-cartwright .` always refused", () => {
    withDir([], (dir) => {
      expect(inspectScaffoldTarget(dir, home)).toEqual({ ok: true, replaces: [] });
    });
  });

  it("a fresh `git init` or GitHub clone is fine, and says what the template replaces", () => {
    withDir([".git/", ".DS_Store"], (dir) => {
      expect(inspectScaffoldTarget(dir, home)).toEqual({ ok: true, replaces: [] });
    });
    withDir([".git/", "README.md", ".gitignore"], (dir) => {
      expect(inspectScaffoldTarget(dir, home)).toEqual({ ok: true, replaces: [".gitignore", "README.md"] });
    });
  });

  it("a folder with real content is refused, naming what is in the way", () => {
    withDir([".git/", "package.json", ".env", "src/"], (dir) => {
      const r = inspectScaffoldTarget(dir, home);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toContain("is not empty (.env, package.json, src)");
    });
  });

  it("the home directory and the filesystem root are refused outright", () => {
    withDir([], (dir) => {
      const r = inspectScaffoldTarget(dir, dir);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toMatch(/home directory/);
    });
    const root = inspectScaffoldTarget("/", home);
    expect(root.ok).toBe(false);
    if (!root.ok) expect(root.reason).toMatch(/filesystem root/);
  });

  it("a file in the way is refused", () => {
    withDir(["shop"], (dir) => {
      const r = inspectScaffoldTarget(join(dir, "shop"), home);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toMatch(/not a directory/);
    });
  });
});

describe("prepareScaffoldTarget — the one pre-flight the CLI acts on", () => {
  const home = "/nonexistent-home-for-test";
  const dirs: string[] = [];
  function tmp(): string {
    const d = mkdtempSync(join(tmpdir(), "cw-prepare-"));
    dirs.push(d);
    return d;
  }
  afterEach(() => {
    while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
  });
  const git = (cwd: string, cmd: string) => execSync(`git ${cmd}`, { cwd, stdio: "ignore" });

  it("`.` in an empty folder is that folder — never ./<slug> — and forces nothing", () => {
    const dir = tmp();
    expect(prepareScaffoldTarget(resolveProjectArg(".", dir), "edited-slug", dir, home)).toEqual({
      ok: true,
      dir,
      cdDir: ".",
      replaces: [],
      force: false,
      remoteBefore: undefined,
    });
  });

  it("without a positional the folder follows the slug, as before", () => {
    const cwd = tmp();
    const r = prepareScaffoldTarget(resolveProjectArg(undefined, cwd), "kaffe", cwd, home);
    expect(r).toMatchObject({ ok: true, dir: join(cwd, "kaffe"), cdDir: "kaffe", force: false });
  });

  it("a populated folder is refused and gets no directory to write into", () => {
    const dir = tmp();
    writeFileSync(join(dir, "package.json"), "{}");
    const r = prepareScaffoldTarget(resolveProjectArg(".", dir), "x", dir, home);
    expect(r.ok).toBe(false);
    expect(r).not.toHaveProperty("dir");
  });

  it("a clone records its remote before anything is written, and only then is giget forced", () => {
    const dir = tmp();
    git(dir, "init -q");
    git(dir, "remote add origin https://example.test/shop.git");
    writeFileSync(join(dir, "README.md"), "# mine");
    expect(prepareScaffoldTarget(resolveProjectArg(".", dir), "x", dir, home)).toMatchObject({
      ok: true,
      dir,
      replaces: ["README.md"],
      force: true,
      remoteBefore: "origin",
    });
  });

  it("names the remote that is there, preferring origin", () => {
    const dir = tmp();
    git(dir, "init -q");
    git(dir, "remote add upstream https://example.test/a.git");
    expect(existingRemote(dir)).toBe("upstream");
    git(dir, "remote add origin https://example.test/b.git");
    expect(existingRemote(dir)).toBe("origin");
  });

  it("a folder inside someone else's repository has no remote of its own", () => {
    // `git remote` walks up to the parent, but the scaffold's own `git init`
    // makes a fresh repository here, with no remote at all.
    const parent = tmp();
    git(parent, "init -q");
    git(parent, "remote add origin https://example.test/mono.git");
    const child = join(parent, "shop");
    mkdirSync(child);
    expect(hasGitRemote(child)).toBe(true);
    expect(existingRemote(child)).toBeUndefined();
    expect(prepareScaffoldTarget(resolveProjectArg(".", child), "x", child, home)).toMatchObject({
      ok: true,
      remoteBefore: undefined,
    });
  });

  it("a folder name with a space is quoted in the cd line", () => {
    const cwd = tmp();
    expect(prepareScaffoldTarget(resolveProjectArg("My Shop", cwd), "my-shop", cwd, home)).toMatchObject({
      ok: true,
      cdDir: '"My Shop"',
    });
  });
});

// How index.ts acts on all of this — which folder it writes into, that a
// refusal writes nothing, what the banner says in a clone — is pinned by
// running the real entry point in scaffold-target-cli.test.ts.
