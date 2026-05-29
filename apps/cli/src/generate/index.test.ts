import { describe, it, expect } from "vitest";
import { generateThemeCss, generatePromptModule } from "./index";
import { type ShopBrief } from "../brief";

const mockBrief: ShopBrief = {
  storeName: "Test",
  slug: "test",
  tagline: "Test tag",
  sells: "Ting",
  audience: "Folk",
  tone: "Sjov",
  country: "DK",
  currency: "DKK",
  palette: { primary: "#112233", background: "#ffeedd" },
  categories: [],
  products: []
};

describe("generateThemeCss", () => {
  it("laver css fil med palette", () => {
    const css = generateThemeCss(mockBrief);
    // Must emit the real storefront token names (--color-sol-*), not --color-*.
    expect(css).toContain("--color-sol-accent: #112233;");
    expect(css).toContain("--color-sol-cream: #ffeedd;");
  });
});

describe("generatePromptModule", () => {
  it("laver ts modul med system prompt", () => {
    const ts = generatePromptModule(mockBrief);
    expect(ts).toContain("export const systemPrompt");
    expect(ts).toContain("Test tag");
    expect(ts).toContain("Sjov");
  });
});

import { generateSeedData } from "./index";
describe("generateSeedData", () => {
  it("laver ts modul med categories og products", () => {
    const brief: ShopBrief = {
      ...mockBrief,
      categories: [{ name: "Kaffe", slug: "kaffe" }],
      products: [{ name: "Bønne", categorySlug: "kaffe", priceMinor: 1000, blurb: "God" }]
    };
    const ts = generateSeedData(brief);
    // Engine-shaped IndustryTemplate (registered as genericTemplate), not the
    // old inert `seedData` object.
    expect(ts).toContain("export const genericTemplate: IndustryTemplate");
    expect(ts).toContain("Kaffe");
    expect(ts).toContain("Bønne");
    expect(ts).toContain(`"priceDkk": 1000`);
  });
});
