import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { type ShopBrief } from "./brief.js";
import {
  generateThemeCss,
  generatePromptModule,
  generateSeedData,
  derivePalette,
  patchThemeCssPalette,
} from "./generate/index.js";

/**
 * Apply the AI brief to the scaffold so the shop actually renders in its own
 * design + catalog. Three activations (all on the customer's copy):
 *   1. Catalog → overwrite the REGISTERED generic template seed-data.ts, so
 *      `brand.industryTemplate: "generic"` seeds the brief's categories/products
 *      (no industry-templates/index.ts patch needed).
 *   2. Theme  → recolour the active theme file (themes/generic.css) sol-* token
 *      VALUES with the brief palette, so the storefront renders in those colours.
 *   3. Reference files → themes/<slug>.css + lib/ai/prompts/<slug>.ts.
 */
export function injectBriefFiles(targetDir: string, brief: ShopBrief): void {
  const cssDir = join(targetDir, "themes");
  const promptsDir = join(targetDir, "lib", "ai", "prompts");
  const genericSeedDir = join(targetDir, "industry-templates", "generic");

  [cssDir, promptsDir, genericSeedDir].forEach((dir) => {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  });

  // Reference theme file (correct sol-* token names) + AI prompt module.
  writeFileSync(join(cssDir, `${brief.slug}.css`), generateThemeCss(brief));
  writeFileSync(join(promptsDir, `${brief.slug}.ts`), generatePromptModule(brief));

  // 1. Catalog: overwrite the registered generic template with the brief's
  //    categories + products in the engine's IndustryTemplate shape.
  writeFileSync(join(genericSeedDir, "seed-data.ts"), generateSeedData(brief));

  // 2. Theme activation (compile-time base): recolour the active theme CSS in
  //    place. On newer engines whose design layer skips sol-* tokens, this is
  //    what renders; on the current template the design-pack injects sol-*
  //    inline, so step 3 (themeJson) is what actually wins. Keeping both covers
  //    every engine version.
  const palette = derivePalette(brief.palette);
  const genericThemePath = join(cssDir, "generic.css");
  if (existsSync(genericThemePath)) {
    const css = readFileSync(genericThemePath, "utf8");
    const patched = patchThemeCssPalette(css, palette);
    if (patched !== css) writeFileSync(genericThemePath, patched);
  }

  // 3. Theme activation (runtime override — the one that wins): seed
  //    BrandingSettings.themeJson with the 6-token palette. getActiveTheme()
  //    reads it and app/layout.tsx injects it as the LAST inline <style>, so it
  //    overrides the design-pack's default sol-* palette. Patch the scaffold's
  //    prisma/seed.ts so the customer's first `db seed` sets it.
  const seedPath = join(targetDir, "prisma", "seed.ts");
  if (existsSync(seedPath)) {
    const themeJson = JSON.stringify({
      accent: palette.accent,
      accentDeep: palette.accentDeep,
      cream: palette.cream,
      sand: palette.sand,
      ink: "#1a1a1a",
      muted: "#726d62",
    });
    const seed = readFileSync(seedPath, "utf8");
    // Inject into the BrandingSettings.upsert create block (after storeName).
    const patched = seed.replace(
      /(storeName: brand\.storeName,)/,
      `$1\n      themeJson: ${JSON.stringify(themeJson)},`,
    );
    if (patched !== seed) writeFileSync(seedPath, patched);
  }
}

export function injectModernWebDoc(targetDir: string): void {
  writeFileSync(join(targetDir, "MODERN_WEB.md"), MODERN_WEB_MD);
}

const MODERN_WEB_MD = `# Cartwright Modern Web Baseline

Your Cartwright store ships with these modern web platform features wired up out of the box. Each one is built into Cartwright's default code — you don't need to write the boilerplate. Some are on by default; some are opt-in via \`brand.features.*\` in your \`brand.config.ts\`.

**For your AI coding agent:** this file is a directory of capabilities. Whenever you're asked to "add a modal", "speed up the cart", "make the page accessible", reach for the listed primitive first, not a third-party library.

**For your marketing:** every line here is a real, shipping feature you can list on your product page.

---

## Structured data (the AI-citation lever)

| Feature | Status | Where |
|---|---|---|
| JSON-LD: \`Organization\` | ✅ on root layout | \`components/JsonLd.tsx\` |
| JSON-LD: \`Product\` + \`Offer\` | ✅ on every PDP | \`app/[locale]/product/[slug]/page.tsx\` |
| JSON-LD: \`BreadcrumbList\` | ✅ on PLP + PDP | server-side via JsonLd helper |
| JSON-LD: \`AggregateRating\` | gated by \`brand.features.reviews\` | rendered on PDP when reviews are on |

Schema.org markup is what AI search engines (Google AI Overviews, Perplexity, ChatGPT browse) cite. Cartwright ships all structured data server-side — crawlers and LLM-scrapers see it without executing JS.

---

## Accessibility baseline (Phase B1)

| Feature | Status | Where |
|---|---|---|
| \`aria-live\` announcements (cart adds, review submits, errors) | ✅ always on | \`components/a11y/LiveRegion.tsx\` |
| \`prefers-reduced-motion\` respected | ✅ in globals.css + components | \`app/[locale]/globals.css\`, RevealOnScroll |
| Focus management on modals | gated by \`brand.features.popoverApi\` | native \`<dialog>\` when on |

---

## Performance baseline (Phase 0 + B2)

| Feature | Status | Where |
|---|---|---|
| Self-hosted Web Vitals (INP/LCP/CLS/FCP/TTFB) | gated by \`brand.features.webVitals\` | \`/api/vitals\` + \`/admin/performance\` |
| \`fetchpriority="high"\` on LCP candidates | ✅ via next/image \`priority\` prop | PDP hero, PLP first cards |
| \`loading="lazy"\` below the fold | ✅ next/image default + manual on raw imgs | every \`<Image>\` below-fold |
| \`decoding="async"\` on raw imgs | ✅ on case studies + tech badges | various |
| Save-data respect on heavy assets | ✅ in HeroVideo | \`components/HeroVideo.tsx\` |

---

## Modern UI primitives (Phase B3 + B4)

| Feature | Status | Where |
|---|---|---|
| Container queries on ProductCard | gated by \`brand.features.containerQueries\` | \`@sm:\` Tailwind v4 variants |
| Native \`<dialog>\` + Popover API for modals | gated by \`brand.features.popoverApi\` | \`components/WelcomeGuide.tsx\` |
| Runtime feature detection (\`<dialog>\`, popover, view transitions) | ✅ always available | \`lib/features.ts\` |
| CSS \`interpolate-size\` on native \`<details>\` | ✅ Phase 1a | accordion + FAQ sections |

---

## Navigation (Phase B5)

| Feature | Status | Where |
|---|---|---|
| View Transitions on PLP → PDP | gated by \`brand.features.viewTransitions\` | \`app/lib/view-transitions.ts\`, \`TransitionLink\` |
| Shared \`view-transition-name\` on hero image | ✅ when viewTransitions flag is on | PLP card + PDP hero |
| Graceful fallback in non-supporting browsers (Firefox) | ✅ automatic | wrapNavigation runs nav directly |

---

## Authentication (Phase 5b)

| Feature | Status | Where |
|---|---|---|
| Passkey UI scaffolding | gated by \`brand.features.passkeys\` | \`/account/security\`, \`/api/auth/passkey/*\` |
| Magic-link fallback | ✅ always on | NextAuth + Resend |

> WebAuthn ceremony wiring is in progress. Check the \`cartwright-guidance\` skill for current status.

---

## AI-agent integrations

| Feature | Status | Where |
|---|---|---|
| Project-level \`CLAUDE.md\` for Claude Code | ✅ shipped in scaffold | \`.claude/CLAUDE.md\` |
| Project-level Cursor rules | ✅ shipped in scaffold | \`.cursor/rules/cartwright.mdc\` |
| GitHub Copilot instructions | ✅ shipped in scaffold | \`.github/copilot-instructions.md\` |
| \`cartwright-guidance\` agent skill | ✅ shipped in scaffold | \`.claude/skills/cartwright-guidance/SKILL.md\` |
| \`modern-web-guidance\` (Chrome team) skill | installed during scaffold (optional) | global \`~/.agents/skills/\` |
| MCP server (\`/api/mcp\`) | gated by \`brand.features.mcpPublic\` | exposes tools to AI agents |

---

## Turning features on

Open \`brand.config.ts\`, find the \`features\` object, and flip the flag from \`false\` to \`true\`. Each flag has a JSDoc comment explaining what it switches on and any dependencies.

Typical first steps for a fresh shop:
- \`webshop: true\` — unlock cart, checkout, account routes (set automatically by \`--template coffee\` / \`--template sunglasses\` / \`--template generic\`)
- \`webVitals: true\` (after \`consentBanner: true\`) — start collecting CWV data on real customer traffic
- \`reviews: true\` — turn on the moderation flow and \`AggregateRating\` JSON-LD
- \`containerQueries: true\`, \`popoverApi: true\`, \`viewTransitions: true\` — opt in to the Phase B baseline

---

_Generated by \`create-cartwright\`. Edit freely — Cartwright won't overwrite this file on later runs._
`;

