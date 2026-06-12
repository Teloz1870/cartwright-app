import pc from "picocolors";
import { type ShopBrief } from "./brief.js";

export function summarizeBuild(brief: ShopBrief): string {
  const lines = [
    pc.bold(`${brief.storeName} (${brief.slug})`),
    pc.dim(brief.tagline),
    "",
    `${pc.bold("Sells:")} ${brief.sells}`,
    `${pc.bold("Audience:")} ${brief.audience}`,
    `${pc.bold("Tone:")} ${brief.tone}`,
    "",
    `${pc.bold("Catalog:")} ${brief.categories.length} categories, ${brief.products.length} products`,
    `${pc.bold("Palette:")} ${brief.palette.primary} (primary) / ${brief.palette.background} (background)`,
  ];
  return lines.join("\n");
}
