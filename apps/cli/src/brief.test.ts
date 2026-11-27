import { describe, it, expect } from "vitest";
import { shopBriefSchema } from "./brief";

const valid = {
  storeName: "Nordkaffe", slug: "nordkaffe", tagline: "Specialkaffe fra Aarhus",
  sells: "Ristet specialkaffe og bryggeudstyr", audience: "Hjemme-baristaer",
  tone: "Afslappet og kyndig", country: "DK", currency: "DKK",
  palette: { primary: "#3b2417", background: "#faf6f0" },
  categories: [{ name: "Bønner", slug: "bonner" }],
  products: [{ name: "Etiopien Yirgacheffe", categorySlug: "bonner", priceMinor: 9500, blurb: "Floral og lys." }],
};

describe("shopBriefSchema", () => {
  it("accepterer et gyldigt brief", () => {
    expect(shopBriefSchema.safeParse(valid).success).toBe(true);
  });
  it("afviser ugyldig hex-farve", () => {
    const bad = { ...valid, palette: { ...valid.palette, primary: "brun" } };
    expect(shopBriefSchema.safeParse(bad).success).toBe(false);
  });
  it("afviser tomt produkt-array", () => {
    expect(shopBriefSchema.safeParse({ ...valid, products: [] }).success).toBe(false);
  });
  // GHSA-mrhx-c7xc-m3w5: zod below 4.6.6 parsed every element of an array
  // before checking `.max()`, and kept one issue per bad field, so an
  // oversized brief from the model cost memory in proportion to its length.
  // From 4.6.6 the size bound is checked first and is the only issue.
  it("rejects an oversized products array on its size alone, without parsing each element", () => {
    const flood = { ...valid, products: Array.from({ length: 20_000 }, () => ({})) };
    const result = shopBriefSchema.safeParse(flood);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toHaveLength(1);
    expect(result.error?.issues[0]).toMatchObject({ code: "too_big", path: ["products"], maximum: 40 });
  });
});
