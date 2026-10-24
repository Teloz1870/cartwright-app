import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, join, parse, relative, resolve } from "node:path";

/**
 * Where a scaffold goes, and what it is called (GRK1 + GRK2).
 *
 * The positional argument is a PATH — `my-shop`, `.`, `../clients/x`,
 * `/tmp/x-y` — and the project name is the slug of its last segment. Before
 * this, the whole positional was the name, so `/tmp/cartwright-new` reached
 * brand.config.ts as `storeName: "/tmp/cartwright New"` and a storeSlug with
 * slashes in it; and the pre-flight refused every directory that existed,
 * which made `create-cartwright .` impossible even in an empty folder — the
 * way Cursor and Claude Code users start.
 */
export const DEFAULT_PROJECT_NAME = "my-cartwright-shop";

/** Folders that say where something lives, not what a shop is called. */
const SYSTEM_DIR_NAMES = new Set(["tmp", "temp", "home", "users", "root", "private", "var"]);

/** What `git init`, a GitHub repo created with a README, or Finder leave behind. */
const TOLERATED_ENTRIES = [".git", ".gitignore", "README.md", ".DS_Store"];

/** The template ships its own copy of these, and it wins (its .gitignore covers .env.local). */
const REPLACED_ENTRIES = new Set([".gitignore", "README.md"]);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^[^a-z]+|-+$/g, "");
}

/**
 * `dir` is set only when a positional was given: the path fixes the directory
 * and the name is derived from it. Without one, the directory follows the
 * name (prompted, or the AI brief's slug), exactly as before.
 */
export type ProjectArg = { dir?: string; name: string };

export function resolveProjectArg(arg: string | undefined, cwd: string, homeName?: string): ProjectArg {
  if (!arg) return { name: DEFAULT_PROJECT_NAME };
  const dir = resolve(cwd, arg);
  const slug = slugify(basename(dir));
  const isSystemName = SYSTEM_DIR_NAMES.has(slug) || (homeName !== undefined && slug === slugify(homeName));
  return { dir, name: slug && !isSystemName ? slug : DEFAULT_PROJECT_NAME };
}

export type TargetCheck = { ok: true; replaces: string[] } | { ok: false; reason: string };

/**
 * May the template be extracted into `dir`? A missing or empty folder, or one
 * holding only TOLERATED_ENTRIES, is fine; anything else is refused with the
 * entries that are in the way, so nothing a user wrote is overwritten. The
 * home directory and the filesystem root are refused even when empty.
 */
export function inspectScaffoldTarget(dir: string, home: string): TargetCheck {
  if (dir === parse(dir).root) {
    return { ok: false, reason: `Refusing to scaffold into the filesystem root (${dir}).` };
  }
  if (resolve(dir) === resolve(home)) {
    return { ok: false, reason: `Refusing to scaffold into your home directory (${dir}). Pass a folder name instead.` };
  }
  if (!existsSync(dir)) return { ok: true, replaces: [] };
  if (!statSync(dir).isDirectory()) {
    return { ok: false, reason: `"${dir}" exists and is not a directory.` };
  }
  const entries = readdirSync(dir).sort();
  const blocking = entries.filter((e) => !TOLERATED_ENTRIES.includes(e));
  if (blocking.length > 0) {
    const shown = blocking.slice(0, 6).join(", ") + (blocking.length > 6 ? ` and ${blocking.length - 6} more` : "");
    return {
      ok: false,
      reason:
        `Directory "${dir}" is not empty (${shown}). Scaffold into a new or empty folder — ` +
        `only ${TOLERATED_ENTRIES.join(", ")} may already be there.`,
    };
  }
  return { ok: true, replaces: entries.filter((e) => REPLACED_ENTRIES.has(e)) };
}

/**
 * The remote of a repository that already lives AT `dir` — a GitHub clone, or
 * `git init` + `git remote add` — read before the scaffold writes anything.
 * Only a `.git` in `dir` itself counts: in a folder nested inside another
 * repository `git remote` answers for the parent, while the scaffold's own
 * `git init` then creates a fresh repository with no remote at all.
 */
export function existingRemote(dir: string): string | undefined {
  if (!existsSync(join(dir, ".git"))) return undefined;
  try {
    const out = execFileSync("git", ["remote"], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const names = out.split("\n").map((n) => n.trim()).filter(Boolean);
    return names.includes("origin") ? "origin" : names[0];
  } catch {
    return undefined;
  }
}

export type PreparedTarget =
  | { ok: false; reason: string }
  | {
      ok: true;
      dir: string;
      /** What to type to get there: the relative path, or "." when scaffolding where we stand. */
      cdDir: string;
      replaces: string[];
      /** giget refuses a non-empty folder unless forced, so force exactly what the check let through. */
      force: boolean;
      /** The folder's remote before the scaffold, if it had one — its commit is then NOT on GitHub yet. */
      remoteBefore: string | undefined;
    };

/**
 * The whole pre-flight in one call, so the CLI cannot pick a directory, a
 * force flag or a remote fact that the check did not see: the positional's
 * path wins over the name, a refused folder has no `dir` to write into, and
 * the remote is recorded before anything is written.
 */
export function prepareScaffoldTarget(target: ProjectArg, slug: string, cwd: string, home: string): PreparedTarget {
  const dir = target.dir ?? resolve(cwd, slug);
  const check = inspectScaffoldTarget(dir, home);
  if (!check.ok) return check;
  const rel = relative(cwd, dir) || ".";
  return {
    ok: true,
    dir,
    cdDir: /\s/.test(rel) ? `"${rel}"` : rel,
    replaces: check.replaces,
    force: existsSync(dir) && readdirSync(dir).length > 0,
    remoteBefore: existingRemote(dir),
  };
}
