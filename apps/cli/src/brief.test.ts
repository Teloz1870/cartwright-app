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
});
