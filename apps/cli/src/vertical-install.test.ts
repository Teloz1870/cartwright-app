import { describe, it, expect } from "vitest";
import {
  extractPresetExportName,
  extractPresetName,
  addToVerticalsIndex,
  addToVerticalOptions,
} from "./vertical-install.js";

const PRESET_SRC = `import type { VerticalPreset } from "../types";
export const salonPreset: VerticalPreset = {
  slug: "salon",
  name: "Salon / Spa",
  description: "Calm, polished, indulgent voice.",
  keywords: ["salon", "spa"],
  identity: { tone: "luxurious" },
  suggestedDesignSlug: "aurora-site",
  scene: "orb",
  genomeOverrides: {},
};
`;

const INDEX_SRC = `import type { VerticalPreset } from "./types";
import { kindergartenPreset } from "./kindergarten/preset";
import { carpenterPreset } from "./carpenter/preset";

const VERTICALS: Record<string, VerticalPreset> = {
  kindergarten: kindergartenPreset,
  carpenter: carpenterPreset,
};

export function getVertical(slug: string | null | undefined): VerticalPreset | null {
  if (!slug) return null;
  return VERTICALS[slug] ?? null;
}
`;

const OPTIONS_SRC = `import type { VerticalOption, VerticalPreset } from "./types";
import { kindergartenPreset } from "./kindergarten/preset";
import { carpenterPreset } from "./carpenter/preset";

function toOption(p: VerticalPreset): VerticalOption {
  return { slug: p.slug };
}

export const VERTICAL_OPTIONS: VerticalOption[] = [
  toOption(kindergartenPreset),
  toOption(carpenterPreset),
];
`;

describe("extractPresetExportName", () => {
  it("reads the exported preset const", () => {
    expect(extractPresetExportName(PRESET_SRC)).toBe("salonPreset");
  });
  it("returns null when absent", () => {
    expect(extractPresetExportName("nothing here")).toBeNull();
  });
});

describe("extractPresetName", () => {
  it("reads the display name", () => {
    expect(extractPresetName(PRESET_SRC)).toBe("Salon / Spa");
  });
  it("returns null when absent", () => {
    expect(extractPresetName("const x = 1")).toBeNull();
  });
});

describe("addToVerticalsIndex", () => {
  it("adds the preset import + map entry", () => {
    const { src, status } = addToVerticalsIndex(INDEX_SRC, "salon", "salonPreset");
    expect(status).toBe("added");
    expect(src).toContain(`import { salonPreset } from "./salon/preset";`);
    expect(src).toContain(`salon: salonPreset,`);
    // entry sits inside the map, before its closing brace
    expect(src.indexOf("salon: salonPreset,")).toBeLessThan(src.indexOf("\n};"));
    // import lands after the last existing preset import
    expect(src.indexOf(`from "./carpenter/preset"`)).toBeLessThan(
      src.indexOf(`from "./salon/preset"`),
    );
  });

  it("quotes hyphenated slugs as map keys", () => {
    const { src } = addToVerticalsIndex(INDEX_SRC, "co-working", "coWorkingPreset");
    expect(src).toContain(`"co-working": coWorkingPreset,`);
  });

  it("is idempotent (already registered)", () => {
    const once = addToVerticalsIndex(INDEX_SRC, "salon", "salonPreset").src;
    const twice = addToVerticalsIndex(once, "salon", "salonPreset");
    expect(twice.status).toBe("already");
    expect(twice.src).toBe(once);
  });

  it("reports anchor-missing on unrecognised source", () => {
    expect(addToVerticalsIndex("// empty", "x", "xPreset").status).toBe("anchor-missing");
  });

  it("output stays brace-balanced (smoke)", () => {
    const { src } = addToVerticalsIndex(INDEX_SRC, "salon", "salonPreset");
    const opens = (src.match(/\{/g) ?? []).length;
    const closes = (src.match(/\}/g) ?? []).length;
    expect(opens).toBe(closes);
  });
});

describe("addToVerticalOptions", () => {
  it("adds the preset import + toOption() entry", () => {
    const { src, status } = addToVerticalOptions(OPTIONS_SRC, "salon", "salonPreset");
    expect(status).toBe("added");
    expect(src).toContain(`import { salonPreset } from "./salon/preset";`);
    expect(src).toContain(`toOption(salonPreset),`);
    // inserted before the array close
    expect(src.indexOf("toOption(salonPreset),")).toBeLessThan(src.lastIndexOf("];"));
    // and after the existing entries
    expect(src.indexOf("toOption(carpenterPreset),")).toBeLessThan(
      src.indexOf("toOption(salonPreset),"),
    );
  });

  it("is idempotent", () => {
    const once = addToVerticalOptions(OPTIONS_SRC, "salon", "salonPreset").src;
    const twice = addToVerticalOptions(once, "salon", "salonPreset");
    expect(twice.status).toBe("already");
    expect(twice.src).toBe(once);
  });

  it("reports anchor-missing on unrecognised source", () => {
    expect(addToVerticalOptions("// empty", "x", "xPreset").status).toBe("anchor-missing");
  });
});
