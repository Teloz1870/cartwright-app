---
"create-cartwright": patch
---

Stop scaffolds from shipping Cartwright's own identity, and gate the anchors so it cannot silently happen again.

Three leaks, all caused by the same mechanism — a patcher anchored on a string literal the engine later changed, whose "not ours, leave it alone" fallback was **silent**:

- **`company.sameAs`** kept Cartwright's GitHub + npm profiles. `app/layout.tsx` feeds this into Organization JSON-LD, so every scaffolded site published machine-readable structured data asserting the customer's company *is* the Cartwright project.
- **The engine domain** was only stripped when it was `teloz.net`. Since the `Teloz → Cartwright` rebrand the engine brands itself `cartwright.app`, so scaffolds shipped `url: "https://cartwright.app"` as their **canonical URL**, `admin@cartwright.app` as the **seeded admin login**, and `kontakt@cartwright.app` on their `/contact` page. Stripping is now line-aware, so the documentation links in `brand.config.ts` comments survive.
- **`footer.githubUrl`** matched only the bare profile URL; the engine had moved to a repo path, so the footer's "GitHub Profile" link pointed at our repo.

Also: the AI-assistant button patch no longer emits two "template drift?" warnings on every scaffold. Engine v0.52.0 fixed those strings upstream via `tSf()`/messages, so the anchors miss by design — the patch stays for older `--ref` targets, which still need it, and stays quiet otherwise.

New `scaffold-anchor-drift.test.ts` fetches the real template at `DEFAULT_REF` and asserts the **outcome** of each identity patcher, not merely that nothing warned — the leaks above emitted no warnings at all. In CI an unreachable template fails the gate rather than skipping it.
