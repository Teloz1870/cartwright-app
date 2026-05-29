import { describe, it, expect } from "vitest";
import {
  adjustHex,
  derivePalette,
  slugify,
  patchThemeCssPalette,
  generateThemeCss,
  generateSeedData,
} from "./index";
import { type ShopBrief } from "../brief";

const BRIEF: ShopBrief = {
  storeName: "Nordlys Keramik",
  slug: "nordlys-keramik",
  tagline: "Håndlavet stentøj fra nord",
  sells: "Handmade ceramics",
  audience: "Design lovers",
  tone: "Warm, minimal",
  country: "DK",
  currency: "DKK",
  palette: { primary: "#2e7d6b", background: "#f7f3ec" },
  categories: [
    { name: "Krus", slug: "krus" },
    { name: "Skåle", slug: "skaale" },
  ],
  products: [
    { name: "Morgenkrus", categorySlug: "krus", priceMinor: 24900, blurb: "Et solidt morgenkrus." },
    { name: "Morgenkrus", categorySlug: "krus", priceMinor: 24900, blurb: "Dup-navn for slug-test." },
    { name: "Stor Skål", categorySlug: "skaale", priceMinor: 39900, blurb: "Til salat og frugt." },
    { name: "Lille Skål", categorySlug: "skaale", priceMinor: 14900, blurb: "Til dip." },
  ],
};

describe("colour helpers", () => {
  it("adjustHex darkens and lightens", () => {
    expect(adjustHex("#808080", -50)).toBe("#404040");
    expect(adjustHex("#808080", 100)).toBe("#ffffff");
  });

  it("derivePalette maps brief colours to sol shades", () => {
    const p = derivePalette(BRIEF.palette);
    expect(p.accent).toBe("#2e7d6b");
    expect(p.cream).toBe("#f7f3ec");
    expect(p.accentDeep).not.toBe(p.accent); // darker variant
    expect(p.sand).not.toBe(p.cream); // slightly darker panel bg
  });
});

describe("slugify", () => {
  it("kebab-cases names", () => {
    expect(slugify("Morgenkrus")).toBe("morgenkrus");
    expect(slugify("Stor Skål")).toBe("stor-skal"); // NFKD folds å→a
  });
});

describe("patchThemeCssPalette", () => {
  const CSS = [
    "@theme {",
    "  --color-sol-accent: #1e3f5a;",
    "  --color-sol-accent-deep: #0f2438;",
    "  --color-sol-cream: #f4efe6;",
    "  --color-sol-sand: #e8e1d3;",
    "}",
    ":root.dark {",
    "  --color-sol-accent-deep: #000000;",
    "}",
  ].join("\n");

  it("recolours the @theme block but leaves dark-mode overrides intact", () => {
    const out = patchThemeCssPalette(CSS, derivePalette(BRIEF.palette));
    expect(out).toContain("--color-sol-accent: #2e7d6b");
    expect(out).toContain("--color-sol-cream: #f7f3ec");
    // dark-mode accent-deep (#000000) must be preserved (first-occurrence replace)
    expect(out).toContain("--color-sol-accent-deep: #000000");
    // ...and the @theme accent-deep must have changed away from the original
    expect(out).not.toContain("--color-sol-accent-deep: #0f2438");
  });
});

describe("generateThemeCss", () => {
  it("emits the brief primary as --color-sol-accent", () => {
    const css = generateThemeCss(BRIEF);
    expect(css).toContain("--color-sol-accent: #2e7d6b");
    expect(css).toContain("--color-sol-cream: #f7f3ec");
  });
});

describe("generateSeedData", () => {
  const out = generateSeedData(BRIEF);

  it("exports an engine-shaped genericTemplate", () => {
    expect(out).toContain(`import type { IndustryTemplate } from "../types"`);
    expect(out).toContain("export const genericTemplate: IndustryTemplate");
    expect(out).toContain(`label: "Nordlys Keramik"`);
  });

  it("maps priceMinor → priceDkk (øre, no division) and derives slugs", () => {
    expect(out).toContain(`"priceDkk": 24900`);
    expect(out).toContain(`"slug": "morgenkrus"`);
    // duplicate product name gets a unique slug
    expect(out).toContain(`"morgenkrus-2"`);
  });

  it("marks the first three products featured and gives every product an image", () => {
    const parsed = out.match(/"featured": true/g) || [];
    expect(parsed.length).toBe(3);
    expect(out).toContain("images.unsplash.com");
    expect(out).toContain(`"categorySlug": "krus"`);
  });
});
