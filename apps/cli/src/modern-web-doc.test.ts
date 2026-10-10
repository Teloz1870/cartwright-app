import { describe, expect, it } from "vitest";
import { MODERN_WEB_MD } from "./inject";

/**
 * Every scaffold gets MODERN_WEB.md, which tells the owner "every line here is
 * a real, shipping feature you can list on your product page" and tells their
 * AI agent to reach for these primitives first. A line naming something the
 * engine does not have is a false product claim AND a wrong instruction to the
 * agent.
 *
 * Three such lines were checked against engine origin/main (c45fd527,
 * 2026-10-10) and removed:
 *
 *  - "Passkey UI scaffolding | brand.features.passkeys | /account/security,
 *    /api/auth/passkey/*". No flag, no route, no WebAuthn code. Engine #619
 *    removed the same claim from its own surfaces. GAP8 will add WebAuthn:
 *    put a line back in the same PR that moves DEFAULT_REF to a template
 *    that has it.
 *  - "Self-hosted Web Vitals | brand.features.webVitals | /api/vitals +
 *    /admin/performance". None of the three exists. The engine removed this
 *    claim in v0.35.0 because it was never built.
 *  - "CSS interpolate-size on native <details>". No stylesheet in the engine
 *    sets interpolate-size or calc-size.
 *
 * scaffold-anchor-drift.test.ts checks the flags the doc still names against
 * the real template.
 */
describe("MODERN_WEB.md names only what the engine ships", () => {
  it("claims no passkeys or WebAuthn", () => {
    expect(MODERN_WEB_MD).not.toMatch(/passkey|webauthn/i);
  });

  it("claims no self-hosted Web Vitals pipeline", () => {
    expect(MODERN_WEB_MD).not.toMatch(/webVitals|\/api\/vitals|\/admin\/performance/);
  });

  it("claims no interpolate-size animation", () => {
    expect(MODERN_WEB_MD).not.toMatch(/interpolate-size|calc-size/);
  });

  it("says magic-link sign-in needs a Resend key instead of calling it always on", () => {
    // The login page offers magic links only when isEmailConfigured() finds a
    // Resend key; without one, password is the only sign-in method.
    const row = MODERN_WEB_MD.split("\n").find((l) => /magic[- ]link/i.test(l));
    expect(row, "the doc no longer has a magic-link row").toBeDefined();
    expect(row).toMatch(/RESEND_API_KEY/);
    expect(row).not.toMatch(/always on/i);
  });
});
