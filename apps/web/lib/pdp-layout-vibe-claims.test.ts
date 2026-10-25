import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Two engine v0.64.0 sentences that app #428 dated, pinned against the engine
 * (falsifier on app #428, NIT: "From the release after v0.63.0", "From engine
 * v0.65.0", or "also sets the … body" → "keeps the … body" left the suite green).
 * Measured on engine tag v0.64.0 (8b134686). Each pin is the whole sentence, so a
 * changed release number or a flipped verb turns it red.
 */
const ROOT = join(__dirname, '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');
// The paragraph (blank-line separated) holding the needle, its soft line breaks folded to
// spaces, so a reflowed paragraph that renders the same text still matches (reviewer NIT, R1).
const paragraphWith = (src: string, needle: string) =>
  (src.split(/\n\s*\n/).find((p) => p.includes(needle)) ?? '').replace(/\s*\n\s*/g, ' ');

describe('a design pack\'s pdpLayout gets the product in the page\'s language from v0.64.0 (engine #692, ARG2)', () => {
  const overrides = read('content/docs/designs/webshop-overrides.mdx');

  it('dates the localized product to v0.64.0 and keeps v0.63.0\'s stored row', () => {
    // app/[locale]/product/[slug]/page.tsx at v0.64.0: layoutProduct = { ...product, name:
    // productName, description: productDescription || product.description } (:401), passed as
    // <PdpLayout product={layoutProduct}> (:757); productDescription prefers a genomeEntityCopy
    // override when that flag is on (:177-179). `translations` and `attributes` come from the
    // spread, unchanged. v0.63.0 passed the stored `product`.
    const pdp = paragraphWith(overrides, '**`pdpLayout`**');
    expect(pdp).toMatch(/From v0\.64\.0 it receives the product with `name` and `description` already in the page's language — the copy the product page itself renders: the stored translation for that language when there is one, else the base copy, and for the description a `genomeEntityCopy` override when that flag is on\./);
    expect(pdp).toMatch(/`translations` and `attributes` stay as stored, so a pack localizes attributes itself\./);
    expect(pdp).toMatch(/On v0\.63\.0 it receives the stored row, so on any language but the shop's default its `name` and `description` are the base language's\./);
    // The whole page, not the one paragraph (reviewer NIT, R1).
    expect(overrides).not.toMatch(/release after v0\.63\.0/);
  });
});

describe('the vibe-coding page says how a page\'s vibe HTML is cleared, and what a page save keeps (engine #695)', () => {
  const vibe = read('content/docs/features/vibe-coding.mdx');
  const clear = paragraphWith(vibe, 'Switch back by clearing the field.');

  it('says a Sandbox save sets both bodies to its placeholder', () => {
    // app/admin/vibe-sandbox/VibeSandboxClient.tsx at v0.64.0 posts body "Vibe Page Layout"
    // (:257, "required body placeholder") and translations.en.body "Vibe Page Layout" (:267).
    expect(clear).toMatch(/For a page, empty its Danish and English HTML in the Vibe Sandbox and save\./);
    expect(clear).toMatch(/A Sandbox save also sets the page's Danish and English body to its `Vibe Page Layout` placeholder, so write the body again in `\/admin\/sider` afterwards;/);
  });

  it('says mockup.clear clears the homepage\'s field and keeps its body', () => {
    // lib/tools/mockup.ts at v0.64.0: clearMockup updates only vibeHtml: null and translations
    // with the per-locale vibe HTML stripped (stripVibeHtmlFromTranslations); body is not written.
    expect(clear).toMatch(/for the homepage, `mockup\.clear` clears the field and keeps the body\./);
  });

  it('dates the page save that keeps vibe HTML to v0.64.0, and the one that emptied it to v0.63.0', () => {
    // app/admin/actions.ts updatePage at v0.64.0: vibeHtml = formData.has("vibeHtml") ? … : undefined
    // (:365), so PageForm (which posts no vibeHtml) leaves it alone. At v0.63.0 the same line read
    // formData.get("vibeHtml")?.toString() || null (:357), so every page-form save nulled it.
    expect(clear).toMatch(/From engine v0\.64\.0 saving a page in `\/admin\/sider` leaves its vibe HTML alone; up to v0\.63\.0 that save emptied it\./);
    // The whole page, not the one paragraph (reviewer NIT, R1).
    expect(vibe).not.toMatch(/release after v0\.63\.0/);
  });
});
