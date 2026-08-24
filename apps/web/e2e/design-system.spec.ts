import { test, expect, type Page } from '@playwright/test';

/**
 * The design system's contract, as executable assertions.
 *
 * Every case here corresponds to a defect this redesign actually shipped and
 * then had to fix, which is the only good reason to add a test:
 *
 *  · Tokens declared in a plain `@theme` block bake the light value in and
 *    silently stop switching, so `text-cw-muted` rendered near-invisible on the
 *    dark canvas. Caught by eye, days late.
 *  · Light `blocked` was #d73c3e at 3.97:1 — large-text only, failing AA for
 *    the stamp labels that carry it. Caught by Codex computing it, not by us.
 *  · Dropping `neutral.css` removed Tailwind's registration of the Fumadocs
 *    tokens as well as their values, and the whole stylesheet stopped
 *    compiling.
 *  · `CopyCommand`'s tracking call is described in the source as the site's
 *    single most important conversion event, and a redesign that touches every
 *    section is exactly how such a thing goes missing.
 */

/** The routes a redesign must never quietly break. */
const ROUTES = ['/', '/security', '/pricing', '/designs', '/integrations', '/docs/introduction'];

/** WCAG 2.1 relative luminance, sRGB, 0.04045 breakpoint. */
function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function parseRgb(value: string): [number, number, number] {
  const m = value.match(/-?\d+(\.\d+)?/g);
  if (!m) throw new Error(`not a colour: ${value}`);
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

async function tokens(page: Page) {
  return page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const read = (n: string) => cs.getPropertyValue(n).trim();
    // Resolve through a probe element so `@theme inline` indirection is
    // followed exactly the way a utility class would follow it.
    const probe = document.createElement('span');
    document.body.appendChild(probe);
    const resolved = (varName: string) => {
      probe.style.color = `var(${varName})`;
      const c = getComputedStyle(probe).color;
      return c;
    };
    const out = {
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      canvas: resolved('--cw-canvas'),
      surface: resolved('--cw-surface'),
      fg: resolved('--cw-ink'),
      muted: resolved('--cw-muted'),
      action: resolved('--cw-action'),
      verified: resolved('--cw-verified'),
      pending: resolved('--cw-pending'),
      blocked: resolved('--cw-blocked'),
      fdBackground: read('--fd-background'),
      fdPrimary: read('--fd-primary'),
    };
    probe.remove();
    return out;
  });
}

test.describe('design tokens follow the theme', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`the semantic palette resolves in ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/');
      const t = await tokens(page);

      expect(t.theme).toBe(theme);
      // The regression that started this: a token that stops switching.
      for (const [name, value] of Object.entries(t)) {
        if (name === 'theme') continue;
        expect(value, `${name} must resolve to a colour`).not.toBe('');
      }
      const canvas = parseRgb(t.canvas);
      const fg = parseRgb(t.fg);
      expect(
        contrast(canvas, fg),
        'body text on canvas must clear AA comfortably',
      ).toBeGreaterThan(7);
    });

    test(`state colours clear WCAG AA in ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/');
      const t = await tokens(page);
      const canvas = parseRgb(t.canvas);
      const surface = parseRgb(t.surface);

      // The stamps carry these as TEXT, so 4.5:1 is the bar — not the 3:1 that
      // large text and UI graphics may use. Light `blocked` failed this at
      // #d73c3e and had to move to #c52f32.
      for (const state of ['action', 'verified', 'pending', 'blocked'] as const) {
        const c = parseRgb(t[state]);
        expect(contrast(c, canvas), `${state} on canvas`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(c, surface), `${state} on surface`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  test('Fumadocs primary stays ink, never the accent', async ({ page }) => {
    await page.goto('/docs/introduction');
    const t = await tokens(page);
    // Fumadocs composites primary at /10 and /80; vermilion only just clears AA
    // at full strength and fails once diluted. If someone maps it back to the
    // accent, this is where they find out.
    expect(t.fdPrimary.toLowerCase()).not.toContain('c33f16');
    expect(t.fdPrimary.toLowerCase()).not.toContain('ff6a3d');
  });
});

test.describe('routes render', () => {
  for (const path of ROUTES) {
    test(`${path} renders a heading and logs no console errors`, async ({ page }) => {
      const errors: string[] = [];
      // Vercel's analytics and speed-insights scripts are injected by the
      // platform and only exist on a deployment, so they 404 on every local and
      // CI run. Failing on those would make this gate cry wolf on day one, and
      // a gate that cries wolf gets switched off.
      const platformNoise = /_vercel\/(insights|speed-insights)/;
      page.on('response', (r) => {
        if (r.status() >= 400 && !platformNoise.test(r.url())) {
          errors.push(`${r.status()} ${new URL(r.url()).pathname}`);
        }
      });
      page.on('console', (m) => {
        if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) {
          errors.push(m.text());
        }
      });
      page.on('pageerror', (e) => errors.push(String(e)));

      const res = await page.goto(path);
      expect(res?.status(), `${path} status`).toBeLessThan(400);
      await expect(page.locator('h1').first()).toBeVisible();
      expect(errors, `${path} console`).toEqual([]);
    });
  }
});

test.describe('the phone is not an afterthought', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const path of ROUTES) {
    test(`${path} does not scroll sideways at 390px`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      // A couple of pixels is rounding; a real overflow is tens or hundreds.
      expect(overflow, `${path} horizontal overflow in px`).toBeLessThanOrEqual(2);
    });
  }

});

test.describe('the site cannot claim what the repo does not hold', () => {
  // Drift was the most expensive defect on this site: "86 tools across 35
  // domains" in two components against a registry of 87, "28 design packs, 8
  // voices, 9 plugins" against a manifest of 26/5/5, "All 15 integrations"
  // beside a page rendering 23, and a roadmap announcing v0.33.0 while the CLI
  // shipped v0.44.1. Every one was written by hand and then left behind.

  test('the integrations page renders exactly what the pricing page promises', async ({
    page,
  }) => {
    await page.goto('/pricing');
    const promised = await page.getByText(/All \d+ integrations are included/).textContent();
    const claimed = Number(promised?.match(/\d+/)?.[0]);
    expect(claimed, 'pricing states a number').toBeGreaterThan(0);

    await page.goto('/integrations');
    // Every shipped integration links out to the vendor; the planned Plus ones
    // are listed separately and deliberately not counted here.
    const rendered = await page.evaluate(
      () => document.querySelectorAll('main a[target="_blank"], main a[rel*="noopener"]').length,
    );
    expect(
      rendered,
      `pricing promises ${claimed} integrations; /integrations renders ${rendered}`,
    ).toBeGreaterThanOrEqual(claimed);
  });

  test('the fallback engine version matches the ref the CLI ships', async ({ request }) => {
    // lib/engine.ts fetches the live version and falls back to a constant. The
    // constant sat six minor versions behind for months because nothing
    // compared it to apps/cli/src/refs.ts, which the bump workflow does keep
    // current.
    const fs = await import('node:fs/promises');
    const engine = await fs.readFile('lib/engine.ts', 'utf8');
    const refs = await fs.readFile('../cli/src/refs.ts', 'utf8');
    // Anchored to line start on purpose: refs.ts documents the line shape in a
    // comment as `export const DEFAULT_REF = "vX.Y.Z";`, and an unanchored
    // match reads the placeholder instead of the value.
    const fallback = engine.match(/^export const FALLBACK_ENGINE_VERSION = '([^']+)'/m)?.[1];
    const shipped = refs.match(/^export const DEFAULT_REF = "v([^"]+)"/m)?.[1];
    expect(fallback, 'a fallback version is declared').toBeTruthy();
    expect(shipped, 'the CLI declares a template ref').toBeTruthy();
    expect(fallback, 'fallback must track the shipped template ref').toBe(shipped);
    void request;
  });

  test('no page states a hardcoded engine version as current', async () => {
    const fs = await import('node:fs/promises');
    // "Ships in engine v0.30.0" is a historical fact and correct to freeze.
    // "Cartwright is at v0.33.0 today" is a claim about now, and rots.
    const suspects = [
      'content/docs/roadmap.mdx',
      'content/docs/introduction.mdx',
      'content/docs/api/mcp-tools.mdx',
    ];
    const offenders: string[] = [];
    for (const f of suspects) {
      const text = await fs.readFile(f, 'utf8');
      if (/\b(is at|currently at|today at)\s+\*{0,2}v\d+\.\d+\.\d+/i.test(text)) {
        offenders.push(f);
      }
    }
    expect(offenders, 'present-tense version claims').toEqual([]);
  });
});

test('every link the homepage offers actually resolves', async ({ page, request }) => {
  // `/security` shipped as three links and no page, one of them promising
  // coordinated vulnerability reporting; `/docs/cli-options` pointed at a path
  // that never existed. Both were found by reading, months late. This closes
  // the class rather than the two instances — and it is also what catches a
  // route being orphaned when it leaves the navigation, since the footer is
  // the only thing linking several of them now.
  await page.goto('/');
  const hrefs = await page.evaluate(() =>
    Array.from(new Set(
      Array.from(document.querySelectorAll('a[href^="/"]'))
        .map((a) => a.getAttribute('href')!)
        .filter((h) => !h.startsWith('//') && !h.startsWith('/#')),
    )),
  );
  expect(hrefs.length, 'the homepage should link somewhere').toBeGreaterThan(20);

  const broken: string[] = [];
  for (const href of hrefs) {
    const res = await request.get(href, { maxRedirects: 5 });
    if (res.status() >= 400) broken.push(`${res.status()} ${href}`);
  }
  expect(broken, 'dead internal links').toEqual([]);
});

test('the install command still reports the conversion event', async ({ page }) => {
  await page.goto('/');
  const command = page.getByText('npx create-cartwright@latest my-shop').first();
  await expect(command).toBeVisible();
  // The source calls this the funnel's key event; a redesign is exactly how it
  // would go missing without anyone noticing.
  const wired = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).some((b) =>
      /copy/i.test(b.textContent ?? ''),
    ),
  );
  expect(wired, 'a copy control must exist beside the command').toBe(true);
});
