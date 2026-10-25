import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  classifyFontSpecifier,
  describeFontInstall,
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
});
