/**
 * Voice-plan Fase 3: hardcoded demo-katalog til cartwright.app's forside-demo.
 *
 * 12 produkter på tværs af tre kategorier (kaffe, lampe, gave) så Gemini har
 * variation at fortælle om uden at vi behøver en rigtig DB. Priser i øre
 * (DKK) for at matche resten af Cartwright-templaten — Gemini formaterer
 * dem til talt sprog ud fra system-prompten.
 */

export type DemoProduct = {
  id: string;
  name: string;
  description: string;
  priceDkk: number;
  tags: string[];
};

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: "demo-coffee-01",
    name: "Helsinki Coffee Beans",
    description:
      "Single-origin Ethiopian beans, light roast with citrus notes. 250g.",
    priceDkk: 9900,
    tags: ["coffee", "ethiopian", "light roast", "gift"],
  },
  {
    id: "demo-coffee-02",
    name: "Roma Espresso Blend",
    description: "Italian-style dark roast for espresso machines. 500g bag.",
    priceDkk: 14900,
    tags: ["coffee", "espresso", "dark roast", "italian"],
  },
  {
    id: "demo-coffee-03",
    name: "Decaf Mountain Reserve",
    description: "Swiss-water decaffeinated, full-bodied chocolate notes.",
    priceDkk: 12900,
    tags: ["coffee", "decaf", "chocolate", "evening"],
  },
  {
    id: "demo-coffee-04",
    name: "Cold Brew Concentrate",
    description: "Smooth cold brew ready in seconds. 1L bottle.",
    priceDkk: 8900,
    tags: ["coffee", "cold brew", "summer", "ready-to-drink"],
  },
  {
    id: "demo-lamp-01",
    name: "Cork Floor Lamp",
    description: "Warm cork base, linen shade. 160 cm tall.",
    priceDkk: 199900,
    tags: ["lamp", "floor", "cork", "natural", "living room"],
  },
  {
    id: "demo-lamp-02",
    name: "Brass Reading Lamp",
    description: "Adjustable brass arm, perfect for reading nooks.",
    priceDkk: 129900,
    tags: ["lamp", "table", "brass", "reading", "gold"],
  },
  {
    id: "demo-lamp-03",
    name: "Mushroom Bedside Lamp",
    description: "Mid-century mushroom shape in glass and chrome.",
    priceDkk: 89900,
    tags: ["lamp", "bedside", "mushroom", "vintage", "mid-century"],
  },
  {
    id: "demo-lamp-04",
    name: "Paper Pendant Lantern",
    description: "Rice paper pendant with warm bulb, hanging cord 1.8m.",
    priceDkk: 49900,
    tags: ["lamp", "pendant", "paper", "japanese", "minimalist"],
  },
  {
    id: "demo-gift-01",
    name: "Linen Tea Towel Set",
    description: "Three Belgian linen tea towels in muted colors.",
    priceDkk: 29900,
    tags: ["gift", "kitchen", "linen", "textile", "wedding"],
  },
  {
    id: "demo-gift-02",
    name: "Ceramic Mug Pair",
    description: "Hand-thrown ceramic mugs, set of two.",
    priceDkk: 39900,
    tags: ["gift", "ceramic", "mug", "pair", "housewarming"],
  },
  {
    id: "demo-gift-03",
    name: "Beeswax Candle Trio",
    description: "Three hand-rolled beeswax candles, unscented.",
    priceDkk: 19900,
    tags: ["gift", "candle", "beeswax", "natural", "calm"],
  },
  {
    id: "demo-gift-04",
    name: "Pocket Notebook",
    description: "Cloth-bound A6 notebook, 96 dotted pages.",
    priceDkk: 14900,
    tags: ["gift", "notebook", "stationery", "writing", "small"],
  },
];
