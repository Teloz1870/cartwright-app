import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { type ShopBrief } from "./brief.js";
import { generateThemeCss, generatePromptModule, generateSeedData } from "./generate/index.js";

export function injectBriefFiles(targetDir: string, brief: ShopBrief): void {
  // Opret mapper
  const cssDir = join(targetDir, "themes");
  const promptsDir = join(targetDir, "lib", "ai", "prompts");
  const seedsDir = join(targetDir, "industry-templates", brief.slug);

  [cssDir, promptsDir, seedsDir].forEach((dir) => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });

  // Skriv filer
  writeFileSync(join(cssDir, `${brief.slug}.css`), generateThemeCss(brief));
  writeFileSync(join(promptsDir, `${brief.slug}.ts`), generatePromptModule(brief));
  writeFileSync(join(seedsDir, "seed-data.ts"), generateSeedData(brief));
  
  // TODO: Opdater industry-templates/index.ts for at registrere den nye seed, men 
  // det falder måske under advanced M2 scope, eller vi kan lave et simpelt append her:
}
