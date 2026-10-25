import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  classifyFontSpecifier,
  describeFontInstall,
  findSpecifiers,
  hasModule,
  installFontFolders,
  scanFontImports,
  type FetchFontFolder,
} from "./design-fonts.js";

// Shaped like engine designs/brutalist/homepage.tsx (FONT1-b, #620).
const BRUTALIST_HOMEPAGE = `import type { DesignHomepageProps } from "../types";
import { Archivo as display } from "@/app/fonts/archivo/font";
import { SpaceMono as mono } from "@/app/fonts/space-mono/font";
export function Homepage(_: DesignHomepageProps) { return null; }
`;

const FONT_TS = (name: string) => `import localFont from "next/font/local";\nexport const F = localFont({ src: "./${name}.woff2" });\n`;

let root: string;
let cwd: string;
let pack: string;
let fetched: string[];

/** A fake template: writes font.ts + one woff2 for every family it is asked for. */
const fakeFetch: FetchFontFolder = async (family, dir) => {
  fetched.push(family);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "font.ts"), FONT_TS(family));
  writeFileSync(join(dir, `${family}.woff2`), Buffer.from([0, 1, 2, family.length]));
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "design-fonts-test-"));
  cwd = join(root, "project");
  pack = join(cwd, "designs", "brutalist");
  mkdirSync(pack, { recursive: true });
  fetched = [];
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("classifyFontSpecifier", () => {
  it("reads the family and module from an @/ alias import", () => {
    expect(classifyFontSpecifier("@/app/fonts/space-mono/font", "homepage.tsx", "x")).toEqual({
      family: "space-mono",
      subpath: "font",
    });
  });
  it("resolves a relative import that lands in app/fonts", () => {
    expect(classifyFontSpecifier("../../app/fonts/archivo/font", "homepage.tsx", "brutalist")).toEqual({
      family: "archivo",
      subpath: "font",
    });
  });
  it("ignores imports that do not point into app/fonts", () => {
    expect(classifyFontSpecifier("../types", "homepage.tsx", "x")).toBeNull();
    expect(classifyFontSpecifier("next/font/local", "homepage.tsx", "x")).toBeNull();
    expect(classifyFontSpecifier("@/app/globals.css", "homepage.tsx", "x")).toBeNull();
  });
  it("refuses a path that climbs out of app/fonts/<name>/", () => {
    expect(classifyFontSpecifier("@/app/fonts/../../x", "a.tsx", "x")).toBe("refused");
    expect(classifyFontSpecifier("@/app/fonts/space-mono/../../../etc/passwd", "a.tsx", "x")).toBe("refused");
    expect(classifyFontSpecifier("@/app/fonts//etc", "a.tsx", "x")).toBe("refused");
    expect(classifyFontSpecifier("@/app/fonts/Bad_Name/font", "a.tsx", "x")).toBe("refused");
  });
  it("checks a relative path's segments raw, after resolving only its leading ../ run", () => {
    const rel = (spec: string) => classifyFontSpecifier(spec, "homepage.tsx", "brutalist");
    expect(rel("../../app/fonts/../../x")).toBe("refused");
    expect(rel("../../app/fonts/space-mono/../../../etc/passwd")).toBe("refused");
    expect(rel("../../app/fonts/Bad_Name/../archivo/font")).toBe("refused");
    expect(rel("../../app/fonts/archivo//font")).toBe("refused");
    expect(rel("../../app/../app/fonts/archivo/font")).toBe("refused");
    // Passes through app/fonts and back out, or names it above the project root: refused, not ignored.
    expect(rel("../../app/../app/fonts/archivo/../../../x")).toBe("refused");
    expect(rel("../../../app/fonts/archivo/font")).toBe("refused");
    expect(rel("../../my-app/fonts-extra/x")).toBeNull();
    expect(classifyFontSpecifier("../../../app/fonts/archivo/font", "sections/hero.tsx", "brutalist")).toEqual({
      family: "archivo",
      subpath: "font",
    });
  });
});

describe("hasModule", () => {
  it("needs a real module file, not just any file or a bare directory", () => {
    const d = join(root, "archivo");
    mkdirSync(join(d, "subsets"), { recursive: true });
    writeFileSync(join(d, "font.ts"), "x");
    writeFileSync(join(d, "LICENSE.txt"), "OFL");
    expect(hasModule(d, "font")).toBe(true);
    expect(hasModule(d, "font.js")).toBe(true); // TS-ESM specifier → font.ts
    expect(hasModule(d, "faces.css")).toBe(false);
    expect(hasModule(d, "")).toBe(false); // bare family needs index.*
    expect(hasModule(d, "subsets")).toBe(false); // a directory is not a module
    writeFileSync(join(d, "subsets", "index.ts"), "x");
    writeFileSync(join(d, "index.ts"), "x");
    expect(hasModule(d, "subsets")).toBe(true);
    expect(hasModule(d, "")).toBe(true);
    expect(hasModule(join(d, "font.ts"), "")).toBe(false); // not a folder
  });
  it("never counts an extensionless file, or a .css file, for a module specifier", () => {
    const d = join(root, "inter");
    mkdirSync(join(d, "faces.js"), { recursive: true });
    writeFileSync(join(d, "font"), "no extension");
    writeFileSync(join(d, "body.css"), "x");
    writeFileSync(join(d, "faces.js", "index.css"), "x");
    writeFileSync(join(d, "index.css"), "x");
    expect(hasModule(d, "font")).toBe(false);
    expect(hasModule(d, "body")).toBe(false);
    expect(hasModule(d, "body.css")).toBe(true);
    expect(hasModule(d, "faces.js")).toBe(false);
    expect(hasModule(d, "")).toBe(false);
  });
  it("maps a .js-family specifier to its TS source only, and knows .cts/.cjs", () => {
    const d = join(root, "inter");
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, "faces.css"), "x");
    writeFileSync(join(d, "legacy.cts"), "x");
    expect(hasModule(d, "faces.js")).toBe(false); // .js never resolves to .css
    expect(hasModule(d, "legacy.cjs")).toBe(true);
    expect(hasModule(d, "legacy")).toBe(true);
  });
});

describe("scanFontImports", () => {
  it("finds each family once across files, and side-effect + CSS imports", () => {
    const scan = scanFontImports(
      [
        { path: "homepage.tsx", src: BRUTALIST_HOMEPAGE },
        { path: "chrome.tsx", src: `import "@/app/fonts/space-mono/faces.css";\n` },
        { path: "x.css", src: `@import url("../../app/fonts/archivo/faces.css");\n` },
      ],
      "brutalist",
    );
    expect([...new Set(scan.fonts.map((f) => f.family))].sort()).toEqual(["archivo", "space-mono"]);
    expect(scan.refused).toEqual([]);
  });
  it("ignores specifiers inside comments, but not inside strings that hold //", () => {
    const scan = scanFontImports(
      [
        {
          path: "homepage.tsx",
          src:
            `/**\n * Load fonts from "@/app/fonts/<family>/font", e.g.\n *   import { A } from "@/app/fonts/ghost/font";\n */\n` +
            `// import { B } from "@/app/fonts/old-face/font";\n` +
            `const u = "https://example.com//x"; import { C } from "@/app/fonts/archivo/font";\n`,
        },
        { path: "x.css", src: `/* @import "../../app/fonts/gone/a.css"; */\n@import url(../../app/fonts/space-mono/faces.css);\n` },
      ],
      "brutalist",
    );
    expect(scan.fonts.map((f) => f.family).sort()).toEqual(["archivo", "space-mono"]);
    expect(scan.refused).toEqual([]);
  });
});

describe("findSpecifiers", () => {
  const live = (src: string) => findSpecifiers(src, false);
  it("does not let a JSX apostrophe open a string", () => {
    expect(live(`const a = <p>Designer's note</p>; // import { G } from "@/app/fonts/ghost/font"\n`)).toEqual([]);
    expect(
      live(`<p>Designer's note</p>; const a = '/*'; import { A } from "@/app/fonts/archivo/font"; const b = '*/';\n`),
    ).toEqual(["@/app/fonts/archivo/font"]);
  });
  it("skips comments inside a template literal's ${…}", () => {
    expect(live("const cls = `${\n  // import { G } from \"@/app/fonts/ghost/font\"\n  display.className\n}`;\n")).toEqual([]);
    expect(live("const a = `x${ {k: `y${1}`}.k }z`; import \"@/app/fonts/archivo/font\";\n")).toEqual([
      "@/app/fonts/archivo/font",
    ]);
    expect(live("const tick = `${ \"`\" }`; import \"@/app/fonts/archivo/font\";\n")).toEqual(["@/app/fonts/archivo/font"]);
  });
  it("skips regex literals, so a // or a backtick in one changes nothing", () => {
    expect(live(`const re = /^https?:\\/\\//; import { A } from "@/app/fonts/archivo/font";\n`)).toEqual([
      "@/app/fonts/archivo/font",
    ]);
    expect(live("const c = s.replace(/`/g, \"\");\n// import { G } from \"@/app/fonts/ghost/font\";\n")).toEqual([]);
    expect(live(`const half = a / 2; import "@/app/fonts/archivo/font";\n`)).toEqual(["@/app/fonts/archivo/font"]);
  });
  it("reads only a string right after from/import/require, never one inside another string", () => {
    expect(live(`const label = "Loaded from "; import { A } from "@/app/fonts/archivo/font";\n`)).toEqual([
      "@/app/fonts/archivo/font",
    ]);
    expect(live(`const demo = 'import "@/app/fonts/../../x"';\n`)).toEqual([]);
    expect(live(`import x from'@/app/fonts/a/font'; const y = await import("b"); require( 'c' );\n`)).toEqual([
      "@/app/fonts/a/font",
      "b",
      "c",
    ]);
  });
  it("reads CSS @import in every form", () => {
    expect(findSpecifiers(`@import "a.css";\n@import url('b.css');\n@import url( c.css );\n/* @import "d.css"; */`, true)).toEqual([
      "a.css",
      "b.css",
      "c.css",
    ]);
  });
});

describe("installFontFolders", () => {
  it("a pack importing two font modules gets both folders", async () => {
    writeFileSync(join(pack, "homepage.tsx"), BRUTALIST_HOMEPAGE);
    const r = await installFontFolders({ cwd, packDir: pack, slug: "brutalist", fetchFolder: fakeFetch });
    expect(r.added).toEqual(["archivo", "space-mono"]);
    expect(readFileSync(join(cwd, "app/fonts/archivo/font.ts"), "utf8")).toBe(FONT_TS("archivo"));
    expect(existsSync(join(cwd, "app/fonts/space-mono/space-mono.woff2"))).toBe(true);
    expect(describeFontInstall(r, "v0.64.0").ok).toEqual([
      "Added font folders: app/fonts/archivo/, app/fonts/space-mono/",
    ]);
  });

  it("an identical folder already present is reported, not re-copied", async () => {
    writeFileSync(join(pack, "homepage.tsx"), BRUTALIST_HOMEPAGE);
    await fakeFetch("archivo", join(cwd, "app/fonts/archivo"));
    fetched = [];
    const r = await installFontFolders({ cwd, packDir: pack, slug: "brutalist", fetchFolder: fakeFetch });
    expect(r.identical).toEqual(["archivo"]);
    expect(r.added).toEqual(["space-mono"]);
    expect(r.kept).toEqual([]);
  });

  it("a folder the owner changed is kept, never overwritten", async () => {
    writeFileSync(join(pack, "homepage.tsx"), BRUTALIST_HOMEPAGE);
    // Same file names as the template's, one byte-different file.
    await fakeFetch("archivo", join(cwd, "app/fonts/archivo"));
    fetched = [];
    writeFileSync(join(cwd, "app/fonts/archivo/font.ts"), "// my own edit\n");
    const r = await installFontFolders({ cwd, packDir: pack, slug: "brutalist", fetchFolder: fakeFetch });
    expect(r.kept).toEqual(["archivo"]);
    expect(readFileSync(join(cwd, "app/fonts/archivo/font.ts"), "utf8")).toBe("// my own edit\n");
    expect(describeFontInstall(r, "v0.64.0").warn[0]).toContain("Kept your own app/fonts/archivo/");
  });

  it("a malicious import path is refused and never fetched", async () => {
    writeFileSync(join(pack, "homepage.tsx"), `import x from "@/app/fonts/../../x";\n`);
    const r = await installFontFolders({ cwd, packDir: pack, slug: "brutalist", fetchFolder: fakeFetch });
    expect(r.refused).toEqual(["@/app/fonts/../../x"]);
    expect(fetched).toEqual([]);
    expect(existsSync(join(cwd, "app"))).toBe(false);
    expect(existsSync(join(root, "x"))).toBe(false);
  });

  it("a pack with no font imports fetches nothing and prints nothing", async () => {
    writeFileSync(join(pack, "index.ts"), `import type { DesignPack } from "../types";\nexport const d = {};\n`);
    const r = await installFontFolders({ cwd, packDir: pack, slug: "brutalist", fetchFolder: fakeFetch });
    expect(fetched).toEqual([]);
    expect(existsSync(join(cwd, "app"))).toBe(false);
    expect(describeFontInstall(r, "v0.64.0")).toEqual({ ok: [], warn: [] });
  });

  it("a fetch that fails, or lacks the imported module, is reported and writes nothing", async () => {
    writeFileSync(join(pack, "homepage.tsx"), BRUTALIST_HOMEPAGE);
    const r = await installFontFolders({
      cwd,
      packDir: pack,
      slug: "brutalist",
      fetchFolder: async (family, dir) => {
        if (family === "archivo") throw new Error("404");
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, "LICENSE.txt"), "OFL");
      },
    });
    expect(r.failed).toEqual(["archivo", "space-mono"]);
    expect(existsSync(join(cwd, "app"))).toBe(false);
    expect(describeFontInstall(r, "v0.64.0").warn[0]).toContain("tree/v0.64.0/app/fonts");
  });

  it("a folder you already have that satisfies the pack is not a failure when the fetch fails", async () => {
    writeFileSync(join(pack, "homepage.tsx"), `import { A } from "@/app/fonts/archivo/font";\n`);
    await fakeFetch("archivo", join(cwd, "app/fonts/archivo"));
    const r = await installFontFolders({
      cwd,
      packDir: pack,
      slug: "brutalist",
      fetchFolder: async () => {
        throw new Error("offline");
      },
    });
    expect(r.failed).toEqual([]);
    expect(r.present).toEqual(["archivo"]);
    const lines = describeFontInstall(r, "v0.64.0");
    expect(lines.warn).toEqual([]);
    expect(lines.ok[0]).toContain("Already present: app/fonts/archivo/");
  });

  it("a folder you already have that lacks the imported module is kept and flagged", async () => {
    writeFileSync(join(pack, "homepage.tsx"), BRUTALIST_HOMEPAGE);
    mkdirSync(join(cwd, "app/fonts/archivo"), { recursive: true });
    writeFileSync(join(cwd, "app/fonts/archivo/LICENSE.txt"), "mine");
    writeFileSync(join(cwd, "app/fonts/space-mono"), "a file, not a folder");
    const r = await installFontFolders({ cwd, packDir: pack, slug: "brutalist", fetchFolder: fakeFetch });
    expect(r.incomplete).toEqual(["archivo", "space-mono"]);
    expect(r.kept).toEqual([]);
    expect(readFileSync(join(cwd, "app/fonts/archivo/LICENSE.txt"), "utf8")).toBe("mine");
    expect(existsSync(join(cwd, "app/fonts/archivo/font.ts"))).toBe(false);
    expect(describeFontInstall(r, "v0.64.0").warn[0]).toContain("lacks a module the design imports");
  });

  it("a dangling symlink, at the folder or inside it, is left alone and does not crash", async () => {
    writeFileSync(join(pack, "homepage.tsx"), BRUTALIST_HOMEPAGE);
    mkdirSync(join(cwd, "app/fonts"), { recursive: true });
    const elsewhere = join(root, "elsewhere");
    symlinkSync(elsewhere, join(cwd, "app/fonts/archivo"));
    await fakeFetch("space-mono", join(cwd, "app/fonts/space-mono"));
    symlinkSync(join(root, "missing"), join(cwd, "app/fonts/space-mono/.#font.ts"));
    fetched = [];
    const r = await installFontFolders({ cwd, packDir: pack, slug: "brutalist", fetchFolder: fakeFetch });
    expect(r.incomplete).toEqual(["archivo"]);
    expect(r.kept).toEqual(["space-mono"]);
    expect(existsSync(elsewhere)).toBe(false); // nothing written through the link
  });

  it("never writes through app/ or app/fonts/ that is a symlink, and a file there does not crash", async () => {
    writeFileSync(join(pack, "homepage.tsx"), BRUTALIST_HOMEPAGE);
    const external = join(root, "external-fonts");
    mkdirSync(external);
    mkdirSync(join(cwd, "app"));
    symlinkSync(external, join(cwd, "app/fonts"));
    const r = await installFontFolders({ cwd, packDir: pack, slug: "brutalist", fetchFolder: fakeFetch });
    expect(r.blocked).toEqual(["archivo", "space-mono"]);
    expect(r.added).toEqual([]);
    expect(readdirSync(external)).toEqual([]);
    expect(describeFontInstall(r, "v0.64.0").warn[0]).toContain("never writes through one");

    unlinkSync(join(cwd, "app/fonts"));
    writeFileSync(join(cwd, "app/fonts"), "a file");
    const r2 = await installFontFolders({ cwd, packDir: pack, slug: "brutalist", fetchFolder: fakeFetch });
    expect(r2.blocked).toEqual(["archivo", "space-mono"]);
  });

  it("a folder that is itself a symlink is never reported identical", async () => {
    writeFileSync(join(pack, "homepage.tsx"), `import { A } from "@/app/fonts/archivo/font";\n`);
    const real = join(root, "real-archivo");
    await fakeFetch("archivo", real);
    mkdirSync(join(cwd, "app/fonts"), { recursive: true });
    symlinkSync(real, join(cwd, "app/fonts/archivo"));
    const r = await installFontFolders({ cwd, packDir: pack, slug: "brutalist", fetchFolder: fakeFetch });
    expect(r.identical).toEqual([]);
    expect(r.kept).toEqual(["archivo"]);
  });

  it("a fetched folder holding a symlink is not copied", async () => {
    writeFileSync(join(pack, "homepage.tsx"), `import { A } from "@/app/fonts/archivo/font";\n`);
    const r = await installFontFolders({
      cwd,
      packDir: pack,
      slug: "brutalist",
      fetchFolder: async (family, dir) => {
        await fakeFetch(family, dir);
        symlinkSync("/etc/hosts", join(dir, "extra.ts"));
      },
    });
    expect(r.failed).toEqual(["archivo"]);
    expect(existsSync(join(cwd, "app"))).toBe(false);
  });

  it("an incomplete folder of your own is reported without fetching", async () => {
    writeFileSync(join(pack, "homepage.tsx"), `import { A } from "@/app/fonts/archivo/font";\n`);
    mkdirSync(join(cwd, "app/fonts/archivo"), { recursive: true });
    const r = await installFontFolders({ cwd, packDir: pack, slug: "brutalist", fetchFolder: fakeFetch });
    expect(r.incomplete).toEqual(["archivo"]);
    expect(fetched).toEqual([]);
  });
});
