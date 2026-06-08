import { describe, it, expect } from "vitest";
import {
  extractExportName,
  extractMeta,
  addToIndexSource,
  addToOptionsSource,
} from "./design-install.js";

const DESIGN_PACK_SRC = `import type { DesignPack } from "../types";
export const engineeredDesign: DesignPack = {
  slug: "engineered",
  name: "Engineered (dark-luxe agency)",
  description: "Premium dark-luxe agency design, three.js hero.",
  mode: "website",
  premium: true,
  source: "designs/engineered/design.md",
  tokens: { prefix: "eng", palette: {} },
  homepage: () => null,
};
`;

const INDEX_SRC = `import type { DesignPack } from "./types";
import { auroraSiteDesign } from "./aurora-site";
import { meridianDesign } from "./meridian";

const DESIGNS: Record<string, DesignPack> = {
  "aurora-site": auroraSiteDesign,
  meridian: meridianDesign,
};

export function getDesign(slug: string | null | undefined): DesignPack | null {
  if (!slug) return null;
  return DESIGNS[slug] ?? null;
}
`;

const OPTIONS_SRC = `export type DesignOption = { slug: string };

export const DESIGN_OPTIONS: DesignOption[] = [
  {
    slug: "aurora-site",
    name: "Aurora",
    description: "x",
    mode: "website",
    premium: false,
  },
];
`;

describe("extractExportName", () => {
  it("reads the exported DesignPack const", () => {
    expect(extractExportName(DESIGN_PACK_SRC)).toBe("engineeredDesign");
  });
  it("returns null when absent", () => {
    expect(extractExportName("nothing here")).toBeNull();
  });
});

describe("extractMeta", () => {
  it("reads name/description/mode/premium", () => {
    expect(extractMeta(DESIGN_PACK_SRC)).toEqual({
      name: "Engineered (dark-luxe agency)",
      description: "Premium dark-luxe agency design, three.js hero.",
      mode: "website",
      premium: true,
    });
  });
  it("defaults premium to false", () => {
    expect(extractMeta(`name: "x", mode: "webshop"`).premium).toBe(false);
  });
});

describe("addToIndexSource", () => {
  it("adds import + map entry", () => {
    const { src, status } = addToIndexSource(INDEX_SRC, "engineered", "engineeredDesign");
    expect(status).toBe("added");
    expect(src).toContain(`import { engineeredDesign } from "./engineered";`);
    expect(src).toContain(`engineered: engineeredDesign,`);
    // entry sits inside the map, before its closing brace
    expect(src.indexOf("engineered: engineeredDesign,")).toBeLessThan(src.indexOf("\n};"));
    expect(src.indexOf("meridian: meridianDesign,")).toBeLessThan(
      src.indexOf("engineered: engineeredDesign,"),
    );
  });

  it("quotes hyphenated slugs as map keys", () => {
    const { src } = addToIndexSource(INDEX_SRC, "neo-future", "neoFutureDesign");
    expect(src).toContain(`"neo-future": neoFutureDesign,`);
  });

  it("is idempotent (already registered)", () => {
    const once = addToIndexSource(INDEX_SRC, "engineered", "engineeredDesign").src;
    const twice = addToIndexSource(once, "engineered", "engineeredDesign");
    expect(twice.status).toBe("already");
    expect(twice.src).toBe(once);
  });

  it("reports anchor-missing on unrecognised source", () => {
    expect(addToIndexSource("// empty", "x", "xDesign").status).toBe("anchor-missing");
  });

  it("output still parses as balanced (smoke)", () => {
    const { src } = addToIndexSource(INDEX_SRC, "engineered", "engineeredDesign");
    const opens = (src.match(/\{/g) ?? []).length;
    const closes = (src.match(/\}/g) ?? []).length;
    expect(opens).toBe(closes);
  });
});

describe("addToOptionsSource", () => {
  const meta = {
    name: "Engineered",
    description: 'Has a "quote" inside',
    mode: "website",
    premium: true,
  };

  it("appends an entry and escapes quotes", () => {
    const { src, status } = addToOptionsSource(OPTIONS_SRC, "engineered", meta);
    expect(status).toBe("added");
    expect(src).toContain(`slug: "engineered"`);
    expect(src).toContain(`premium: true`);
    expect(src).toContain(`description: "Has a \\"quote\\" inside"`);
    // inserted before the array close
    expect(src.indexOf(`slug: "engineered"`)).toBeLessThan(src.lastIndexOf("];"));
  });

  it("is idempotent", () => {
    const once = addToOptionsSource(OPTIONS_SRC, "engineered", meta).src;
    expect(addToOptionsSource(once, "engineered", meta).status).toBe("already");
  });
});
