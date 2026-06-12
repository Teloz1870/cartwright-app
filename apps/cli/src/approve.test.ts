import { describe, it, expect } from "vitest";
import { summarizeBuild } from "./approve";
import { type ShopBrief } from "./brief";

describe("summarizeBuild", () => {
  it("formats the brief for the clack note (English labels)", () => {
    const brief: ShopBrief = {
      storeName: "Test Shop",
      slug: "test-shop",
      tagline: "Test",
      sells: "Testing",
      audience: "Testers",
      tone: "Fun",
      country: "DK",
      currency: "DKK",
      palette: { primary: "#000000", background: "#ffffff" },
      categories: [{ name: "Cats", slug: "cats" }],
      products: [{ name: "Cat 1", categorySlug: "cats", priceMinor: 1000, blurb: "A cat" }]
    };

    const lines = summarizeBuild(brief);
    expect(lines).toContain("Test Shop (test-shop)");
    expect(lines).toContain("1 categories, 1 products");
  });
});
