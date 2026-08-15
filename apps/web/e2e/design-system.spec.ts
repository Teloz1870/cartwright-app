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

  test('the Interlock chapter stays readable without scroll animation', async ({ page }) => {
    await page.goto('/');
    // Below the breakpoint no animation is attached at all, so every stage must
    // already be legible — the still composition has to carry the argument.
    const steps = page.locator('.cw-step');
    await expect(steps).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(steps.nth(i)).toBeVisible();
    }
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
