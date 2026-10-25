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
 * reported as identical, kept, present or incomplete. Nothing is ever written
 * through a symlink: not at app/, app/fonts/ or the folder, and a fetched
 * folder holding one is not copied.
 */
import { cpSync, lstatSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, posix, relative } from "node:path";

const FONT_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const SCANNED_EXT_RE = /\.(?:[cm]?[jt]sx?|css)$/;
// The code right before a string that makes it a module specifier: `from "x"`,
// `import "x"`, `import("x")`, `require("x")`, CSS `@import "x"` / `@import url("x")`.
const SPEC_LEAD_RE = /(?:\bfrom|\bimport|\bimport\s*\(|\brequire\s*\(|@import|@import\s+url\()\s*$/;
const CSS_BARE_URL_LEAD_RE = /@import\s+url\(\s*$/;
const WORD_END_RE = /[\p{L}\p{N}_$]$/u;
// A quote right after a word is JSX text (`Designer's`), unless the word is a keyword.
const KEYWORD_END_RE =
  /(?:^|[^\p{L}\p{N}_$])(?:from|import|return|typeof|case|in|of|void|await|yield|export|default|else|do|delete|throw|new)$/u;
// A `/` after one of these (or at the start) opens a regex literal, not a division.
const REGEX_LEAD_RE =
  /(?:^|[(,=:[!&|?{};+\-*%~^]|(?:^|[^\p{L}\p{N}_$])(?:return|typeof|case|do|else|in|of|void|delete|throw|new|yield|await))$/u;

/**
 * The module specifiers in one source file. A small lexer, not a regex over the
 * text: comments, regex literals and template literals (with `${…}` nesting) are
 * skipped, and a string counts only when the code right before it is `from`,
 * `import`, `import(`, `require(` or CSS `@import` — so a specifier quoted in a
 * comment, or a string that merely ends in "from ", is never read as an import.
 * CSS has only block comments and strings.
 */
export function findSpecifiers(src: string, css: boolean): string[] {
  const specs: string[] = [];
  let tail = ""; // recent code; each string, comment or regex collapses to one space
  const push = (s: string) => {
    tail = (tail + s).slice(-64);
  };
  const resume: number[] = []; // brace depth at which an open template's `${` closes
  let depth = 0;
  // Read a template body from j; stops after the closing backtick or after a `${`.
  const template = (j: number): number => {
    while (j < src.length) {
      if (src[j] === "\\") j += 2;
      else if (src[j] === "`") return j + 1;
      else if (src[j] === "$" && src[j + 1] === "{") {
        resume.push(depth++);
        return j + 2;
      } else j++;
    }
    return j;
  };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (c === "/" && next === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? src.length : end + 2;
      push(" ");
    } else if (!css && c === "/" && next === "/") {
      const end = src.indexOf("\n", i);
      i = end === -1 ? src.length : end;
      push(" ");
    } else if (!css && c === "`") {
      i = template(i + 1);
      push(" ");
    } else if (!css && c === "}" && resume.length && resume[resume.length - 1] === depth - 1) {
      depth--;
      resume.pop();
      i = template(i + 1);
      push(" ");
    } else if (c === '"' || c === "'") {
      if (!css && WORD_END_RE.test(tail) && !KEYWORD_END_RE.test(tail)) {
        push(c);
        i++;
        continue;
      }
      let j = i + 1;
      while (j < src.length && src[j] !== c && src[j] !== "\n") j += src[j] === "\\" ? 2 : 1;
      if (src[j] === c && SPEC_LEAD_RE.test(tail)) specs.push(src.slice(i + 1, j));
      i = j + 1;
      push(" ");
    } else if (css && CSS_BARE_URL_LEAD_RE.test(tail) && !/[\s)]/.test(c)) {
      let j = i;
      while (j < src.length && !/[\s()"']/.test(src[j])) j++;
      if (/^\s*\)/.test(src.slice(j, j + 64))) specs.push(src.slice(i, j));
      i = j;
      push(" ");
    } else if (!css && c === "/" && REGEX_LEAD_RE.test(tail.trimEnd())) {
      let j = i + 1;
      let inClass = false;
      while (j < src.length && src[j] !== "\n" && (inClass || src[j] !== "/")) {
        if (src[j] === "\\") j++;
        else if (src[j] === "[") inClass = true;
        else if (src[j] === "]") inClass = false;
        j++;
      }
      if (src[j] === "/") {
        i = j + 1;
        push(" ");
      } else {
        push(c); // no closing slash on this line: a division after all
        i++;
      }
    } else {
      if (!css && c === "{") depth++;
      else if (!css && c === "}") depth--;
      push(c);
      i++;
    }
  }
  return specs;
}

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
    // Relative: only the leading `./` + `../` run is resolved against the
    // file's place in the project; everything after it stays raw, so a `..`
    // or empty segment inside app/fonts is checked below, not normalised away.
    const parts = spec.split("/");
    let lead = 0;
    while (lead < parts.length && (parts[lead] === "." || parts[lead] === "..")) lead++;
    const base = posix.normalize(posix.join("designs", slug, posix.dirname(fileInPack), ...parts.slice(0, lead)));
    const joined = [base === "." ? "" : base, ...parts.slice(lead)].filter((s, k) => k > 0 || s !== "").join("/");
    if (!joined.startsWith("app/fonts/") && joined !== "app/fonts") {
      // Not a clean app/fonts path, yet it names app/fonts somewhere (passes
      // through it, reaches it after a later `..`, or climbs above the project
      // first): refused, not ignored.
      const named = parts.some((p, k) => p === "app" && parts[k + 1] === "fonts");
      return named || /^app\/fonts(?:\/|$)/.test(posix.normalize(joined)) ? "refused" : null;
    }
    target = joined;
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
    for (const spec of findSpecifiers(src, path.endsWith(".css"))) {
      const hit = classifyFontSpecifier(spec, path, slug);
      if (hit === "refused") refused.add(spec);
      else if (hit) fonts.set(`${hit.family}/${hit.subpath}`, hit);
    }
  }
  return { fonts: [...fonts.values()], refused: [...refused] };
}

/**
 * Every entry below `dir`, never following a symlink (lstat): a link is
 * listed as an entry of its own, so a dangling one cannot throw here.
 */
function listFiles(dir: string, base = dir): { path: string; link: boolean }[] {
  const out: { path: string; link: boolean }[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = lstatSync(full);
    if (st.isDirectory()) out.push(...listFiles(full, base));
    else out.push({ path: relative(base, full).split("\\").join("/"), link: st.isSymbolicLink() });
  }
  return out.sort((x, y) => (x.path < y.path ? -1 : x.path > y.path ? 1 : 0));
}

/** The scannable source files of a fetched pack (symlinks are not read). */
export function readPackSources(packDir: string): { path: string; src: string }[] {
  return listFiles(packDir)
    .filter((f) => !f.link && SCANNED_EXT_RE.test(f.path))
    .map((f) => ({ path: f.path, src: readFileSync(join(packDir, f.path), "utf8") }));
}

/** A symlink, at the path itself or anywhere below it (never followed). */
function hasLink(p: string): boolean {
  return lstatSync(p).isSymbolicLink() || (isDir(p) && listFiles(p).some((f) => f.link));
}

/** True when both folders hold the same regular files with the same bytes; any symlink, the roots included, makes them differ. */
export function sameTree(a: string, b: string): boolean {
  if (lstatSync(a).isSymbolicLink() || lstatSync(b).isSymbolicLink()) return false;
  const fa = listFiles(a);
  const fb = listFiles(b);
  if (fa.length !== fb.length || fa.some((f, i) => f.link || fb[i].link || f.path !== fb[i].path)) return false;
  return fa.every((f) => readFileSync(join(a, f.path)).equals(readFileSync(join(b, f.path))));
}

/**
 * `app/` and `app/fonts/` are real folders here, or absent — never a symlink
 * (a copy would land outside the project) and never a file (the copy would throw).
 */
function fontsParentWritable(cwd: string): boolean {
  for (const p of [join(cwd, "app"), join(cwd, "app", "fonts")]) {
    try {
      if (!lstatSync(p).isDirectory()) return false;
    } catch {
      return true; // absent: so is everything below it
    }
  }
  return true;
}

/** Something is at `p` — a dangling symlink included, which existsSync would miss. */
function occupied(p: string): boolean {
  try {
    lstatSync(p);
    return true;
  } catch {
    return false;
  }
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

// What an extensionless specifier or a folder's index resolves to (never .css).
const RESOLVE_EXTS = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"];
// A specifier that names a file with its extension (`faces.css`, `font.ts`).
const MODULE_FILE_RE = /\.(?:[cm]?[jt]s|[jt]sx|css)$/;
// TS ESM: a `.js`-family specifier names the emitted file, so it maps to its TS source only.
const JS_SPECIFIER_SOURCES: Record<string, string[]> = {
  ".js": [".ts", ".tsx"],
  ".jsx": [".tsx"],
  ".mjs": [".mts"],
  ".cjs": [".cts"],
};

/**
 * The imported module resolves to a FILE inside `dir`: `font` → font.ts, …;
 * TS-ESM `font.js` → font.ts; `sub` → sub/index.ts; the bare family (`""`) →
 * index.ts. A directory alone, or any other file, does not count.
 */
export function hasModule(dir: string, subpath: string): boolean {
  if (!isDir(dir)) return false;
  const base = subpath ? join(dir, subpath) : dir;
  const index = RESOLVE_EXTS.some((ext) => isFile(join(base, `index${ext}`)));
  if (!subpath) return index;
  if (MODULE_FILE_RE.test(base) && isFile(base)) return true;
  const jsExt = /\.(?:[cm]?js|jsx)$/.exec(base)?.[0];
  if (jsExt && JS_SPECIFIER_SOURCES[jsExt].some((ext) => isFile(base.slice(0, -jsExt.length) + ext))) return true;
  return index || RESOLVE_EXTS.some((ext) => isFile(`${base}${ext}`));
}

/** Fetch `app/fonts/<family>` from the template into `dir`. */
export type FetchFontFolder = (family: string, dir: string) => Promise<void>;

export type FontInstallResult = {
  added: string[];
  identical: string[];
  kept: string[];
  /** Already in the project with every imported module; the template's copy could not be fetched to compare. */
  present: string[];
  /** Already in the project but missing a module the pack imports (or not a folder); left untouched, not fetched. */
  incomplete: string[];
  /** Fetched, but not written: `app/` or `app/fonts/` is a symlink or a file here. */
  blocked: string[];
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
    blocked: [],
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
      // The project's own folder is judged first: it is never overwritten, so
      // whether it satisfies the pack decides the outcome, not the fetch — and
      // one that lacks a module is reported without fetching anything.
      const dest = join(opts.cwd, "app", "fonts", family);
      const local = occupied(dest);
      if (local && !subpaths.every((s) => hasModule(dest, s))) {
        result.incomplete.push(family);
        continue;
      }
      let fetchedOk = false;
      try {
        await opts.fetchFolder(family, fetched);
        // A symlink in the fetched copy would be copied as a link to anywhere.
        fetchedOk = subpaths.every((s) => hasModule(fetched, s)) && !hasLink(fetched);
      } catch {
        fetchedOk = false;
      }
      if (local) {
        if (!fetchedOk) result.present.push(family);
        else (sameTree(dest, fetched) ? result.identical : result.kept).push(family);
        continue;
      }
      if (!fetchedOk) {
        result.failed.push(family);
        continue;
      }
      if (!fontsParentWritable(opts.cwd)) {
        result.blocked.push(family);
        continue;
      }
      try {
        cpSync(fetched, dest, { recursive: true });
        result.added.push(family);
      } catch {
        result.failed.push(family);
      }
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
  if (r.blocked.length) {
    warn.push(
      `Didn't write ${dirs(r.blocked)} — app/ or app/fonts/ is a symlink or a file here, and the CLI never writes through one. ` +
        `Copy it from https://github.com/Teloz1870/cartwright-template/tree/${ref}/app/fonts.`,
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
