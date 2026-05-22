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
    expect(css).toContain("--color-accent: #112233;");
    expect(css).toContain("--color-cream: #ffeedd;");
    expect(css).toContain("--color-sand: #ffeedd;"); // For nu bare bg
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
    expect(ts).toContain("export const seedData = {");
    expect(ts).toContain("Kaffe");
    expect(ts).toContain("Bønne");
    expect(ts).toContain("1000");
  });
});
