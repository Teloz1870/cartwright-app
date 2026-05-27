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

/**
 * Phase D4 — write `MODERN_WEB.md` into the scaffolded project listing
 * every modern web platform feature Cartwright wires up out of the box.
 *
 * The doc is meant for two audiences:
 *
 *   1. The customer's AI coding agent (Claude Code / Cursor / Copilot) —
 *      so when the agent reads the project, it has a clear inventory of
 *      the platform features available without having to grep the source.
 *   2. The customer's own marketing — every entry here is something the
 *      customer can claim about their site, lifted straight into a
 *      product page, About section, or developer blurb.
 *
 * Unconditional injection: every scaffold gets the file. Feature flags
 * are listed alongside each entry so the customer can see what is on by
 * default vs opt-in for their template (`brand.features.*`).
 *
 * Idempotent: callers can safely re-run; the file is always overwritten
 * with the current snapshot of features the CLI knows about.
 */
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

