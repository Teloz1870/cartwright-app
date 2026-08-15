import { defineConfig, devices } from '@playwright/test';

/**
 * Deliberately NOT pixel-snapshot testing.
 *
 * Baselines rendered on a maintainer's macOS and compared on Linux CI differ on
 * font antialiasing and subpixel layout, so a screenshot suite here would fail
 * constantly for reasons that are not defects — and a gate that cries wolf gets
 * switched off, which is worse than no gate.
 *
 * What these tests assert instead is the design system's contract: that tokens
 * resolve in both themes, that the four state colours still clear WCAG AA, that
 * no page scrolls sideways on a phone, and that the conversion event survives.
 * Those are deterministic, fast, and they are exactly the failures the redesign
 * actually hit.
 */
const PORT = 3100;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Production build, not dev: the dev overlay injects its own fonts and
    // styles, and `@theme` resolution differs enough to hide real regressions.
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
