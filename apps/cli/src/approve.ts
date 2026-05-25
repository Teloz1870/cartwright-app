import pc from "picocolors";
import { type ShopBrief } from "./brief.js";

export function summarizeBuild(brief: ShopBrief): string {
  const lines = [
    pc.bold(`${brief.storeName} (${brief.slug})`),
    pc.dim(brief.tagline),
    "",
    `${pc.bold("Sælger:")} ${brief.sells}`,
    `${pc.bold("Målgruppe:")} ${brief.audience}`,
    `${pc.bold("Tone:")} ${brief.tone}`,
    "",
    `${pc.bold("Katalog:")} ${brief.categories.length} kategorier, ${brief.products.length} produkter`,
    `${pc.bold("Palette:")} ${brief.palette.primary} (Primær) / ${brief.palette.background} (Baggrund)`,
  ];
  return lines.join("\n");
}
