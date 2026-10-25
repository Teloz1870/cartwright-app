/**
 * The self-hosted font folders a design pack imports (APP-FONT-INSTALL).
 *
 * Since engine FONT1-a/b a pack may import `@/app/fonts/<family>/font` — a
 * `next/font/local` module that lives OUTSIDE designs/<slug>/ (brutalist,
 * editorial-ink and meridian already do). `design install` fetches only the
 * pack, so in a scaffold without that folder (a `--profile site` scaffold, or
 * one cut before the font existed) the pack would not compile. This module
 * finds those imports and fetches each `app/fonts/<family>/` from the same
 * template ref the pack came from.
 *
 * Rules: only a single kebab-case folder name directly under app/fonts is ever
 * fetched — a specifier that climbs (`..`), is absolute, or names anything else
 * is refused and reported, never fetched. A folder that already exists is never
 * overwritten (not even with --force: it may hold the owner's own edits); it is
 * reported as identical or as kept.
 */
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, posix, relative } from "node:path";

const FONT_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const SCANNED_EXT_RE = /\.(?:[cm]?[jt]sx?|css)$/;
// `from "x"`, `import "x"`, `import("x")`, `require("x")`, CSS `@import "x"` / `@import url("x")`.
const SPECIFIER_RE =
  /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*|@import\s+(?:url\(\s*)?)(["'])([^"'\n]+)\1/g;

export type FontImport = { family: string; subpath: string };
export type FontScan = { fonts: FontImport[]; refused: string[] };

/**
 * Classify one import specifier found in `designs/<slug>/<file>`.
 * Returns null when it does not point into app/fonts at all.
 */
export function classifyFontSpecifier(
  spec: string,
  fileInPack: string,
  slug: string,
): FontImport | "refused" | null {
  let target: string;
  if (spec.startsWith("@/app/fonts/") || spec === "@/app/fonts") {
    target = spec.slice(2);
  } else if (spec.startsWith("./") || spec.startsWith("../")) {
    // Relative: resolve against the file's place in the project.
    const resolved = posix.normalize(posix.join("designs", slug, posix.dirname(fileInPack), spec));
    if (!resolved.startsWith("app/fonts/") && resolved !== "app/fonts") return null;
    target = resolved;
  } else {
    return null;
  }
  // target is "app/fonts/<family>/<subpath…>" — every segment checked raw,
  // so `@/app/fonts/../../x` is refused rather than normalised away.
  const segments = target.split("/").slice(2);
  const [family, ...rest] = segments;
  if (!family || !FONT_NAME_RE.test(family)) return "refused";
  if (rest.some((s) => s === "" || s === "." || s === ".." || s.includes("\\"))) return "refused";
  return { family, subpath: rest.join("/") };
}

/** Every app/fonts import in a pack's files (path relative to the pack → source). */
export function scanFontImports(files: { path: string; src: string }[], slug: string): FontScan {
  const fonts = new Map<string, FontImport>();
  const refused = new Set<string>();
  for (const { path, src } of files) {
    for (const m of src.matchAll(SPECIFIER_RE)) {
      const hit = classifyFontSpecifier(m[2], path, slug);
      if (hit === "refused") refused.add(m[2]);
      else if (hit) fonts.set(`${hit.family}/${hit.subpath}`, hit);
    }
  }
  return { fonts: [...fonts.values()], refused: [...refused] };
}

function listFiles(dir: string, base = dir): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full, base));
    else out.push(relative(base, full).split("\\").join("/"));
  }
  return out.sort();
}

/** The scannable source files of a fetched pack. */
export function readPackSources(packDir: string): { path: string; src: string }[] {
  return listFiles(packDir)
    .filter((p) => SCANNED_EXT_RE.test(p))
    .map((p) => ({ path: p, src: readFileSync(join(packDir, p), "utf8") }));
}

/** True when both folders hold the same file names with the same bytes. */
export function sameTree(a: string, b: string): boolean {
  const fa = listFiles(a);
  const fb = listFiles(b);
  if (fa.length !== fb.length || fa.some((f, i) => f !== fb[i])) return false;
  return fa.every((f) => readFileSync(join(a, f)).equals(readFileSync(join(b, f))));
}

function isFile(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}
function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

const MODULE_EXTS = [".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs", ".css"];

/**
 * The imported module resolves to a FILE inside `dir`: `font` → font.ts, …;
 * TS-ESM `font.js` → font.ts; `sub` → sub/index.ts; the bare family (`""`) →
 * index.ts. A directory alone, or any other file, does not count.
 */
export function hasModule(dir: string, subpath: string): boolean {
  if (!isDir(dir)) return false;
  const base = subpath ? join(dir, subpath) : dir;
  const index = MODULE_EXTS.some((ext) => isFile(join(base, `index${ext}`)));
  if (!subpath) return index;
  const stems = [base, base.replace(/\.[cm]?jsx?$/, "")];
  return isFile(base) || index || stems.some((s) => MODULE_EXTS.some((ext) => isFile(`${s}${ext}`)));
}

/** Fetch `app/fonts/<family>` from the template into `dir`. */
export type FetchFontFolder = (family: string, dir: string) => Promise<void>;

export type FontInstallResult = {
  added: string[];
  identical: string[];
  kept: string[];
  /** Already in the project with every imported module; the template's copy could not be fetched to compare. */
  present: string[];
  /** Already in the project but missing a module the pack imports (or not a folder); left untouched. */
  incomplete: string[];
  failed: string[];
  refused: string[];
};

/**
 * Bring in every app/fonts/<family> the pack at `packDir` imports. Folders are
 * fetched into a temp dir first and copied only when the project lacks them.
 */
export async function installFontFolders(opts: {
  cwd: string;
  packDir: string;
  slug: string;
  fetchFolder: FetchFontFolder;
}): Promise<FontInstallResult> {
  const scan = scanFontImports(readPackSources(opts.packDir), opts.slug);
  const result: FontInstallResult = {
    added: [],
    identical: [],
    kept: [],
    present: [],
    incomplete: [],
    failed: [],
    refused: scan.refused,
  };
  const families = [...new Set(scan.fonts.map((f) => f.family))].sort();
  if (families.length === 0) return result;

  const tmp = mkdtempSync(join(tmpdir(), "cartwright-fonts-"));
  try {
    for (const family of families) {
      const fetched = join(tmp, family);
      const subpaths = scan.fonts.filter((f) => f.family === family).map((f) => f.subpath);
      let fetchedOk = false;
      try {
        await opts.fetchFolder(family, fetched);
        fetchedOk = subpaths.every((s) => hasModule(fetched, s));
      } catch {
        fetchedOk = false;
      }
      // The project's own folder is judged first: it is never overwritten, so
      // whether it satisfies the pack decides the outcome, not the fetch.
      const dest = join(opts.cwd, "app", "fonts", family);
      if (existsSync(dest)) {
        if (!subpaths.every((s) => hasModule(dest, s))) result.incomplete.push(family);
        else if (!fetchedOk) result.present.push(family);
        else (sameTree(dest, fetched) ? result.identical : result.kept).push(family);
        continue;
      }
      if (!fetchedOk) {
        result.failed.push(family);
        continue;
      }
      cpSync(fetched, dest, { recursive: true });
      result.added.push(family);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  return result;
}

/** Human lines for the CLI output; empty when the pack imports no fonts. */
export function describeFontInstall(
  r: FontInstallResult,
  ref: string,
): { ok: string[]; warn: string[] } {
  const ok: string[] = [];
  const warn: string[] = [];
  const dirs = (xs: string[]) => xs.map((f) => `app/fonts/${f}/`).join(", ");
  if (r.added.length) ok.push(`Added font folders: ${dirs(r.added)}`);
  if (r.identical.length) ok.push(`Already present (identical): ${dirs(r.identical)}`);
  if (r.present.length) {
    ok.push(`Already present: ${dirs(r.present)} (the template's copy couldn't be fetched to compare)`);
  }
  if (r.kept.length) {
    warn.push(`Kept your own ${dirs(r.kept)} — it differs from the template's and was not overwritten.`);
  }
  if (r.incomplete.length) {
    warn.push(
      `Kept your own ${dirs(r.incomplete)}, but it lacks a module the design imports — it won't build until you add it. ` +
        `The template's copy: https://github.com/Teloz1870/cartwright-template/tree/${ref}/app/fonts.`,
    );
  }
  if (r.failed.length) {
    warn.push(
      `Couldn't fetch ${dirs(r.failed)} — the design imports it and won't build without it. ` +
        `Copy it from https://github.com/Teloz1870/cartwright-template/tree/${ref}/app/fonts.`,
    );
  }
  if (r.refused.length) {
    warn.push(`Refused font import path(s) outside app/fonts/<name>/: ${r.refused.join(", ")}`);
  }
  return { ok, warn };
}
