/**
 * Template channel constants — the SINGLE source of truth for which template
 * tag the CLI resolves by default.
 *
 * Consumed by index.ts (scaffolder), design-install.ts, vertical-install.ts
 * and doctor.ts. The bump-template-ref workflow
 * (.github/workflows/bump-template-ref.yml) seds ONLY this file on each
 * template release — keep the `export const DEFAULT_REF = "vX.Y.Z";` line
 * shape intact or the workflow's grep/sed anchors break.
 */

// Default channel resolves to the latest tag mirrored from cartwright-private.
// Bumped together with a Changeset whenever a new template tag goes out —
// bump-template-ref.yml does this automatically by opening a PR when it sees
// a newer tag on the public mirror.
export const DEFAULT_REF = "v0.39.1";

// Channel aliases the user can pass via --ref.
//   stable → DEFAULT_REF (latest tag — what default `npx create-cartwright` uses)
//   next   → bleeding-edge branch on the mirror, updated on every push to
//            cartwright-private/main. Not recommended for production scaffolds.
export const REF_ALIASES: Record<string, string> = {
  stable: DEFAULT_REF,
  next: "next",
};
