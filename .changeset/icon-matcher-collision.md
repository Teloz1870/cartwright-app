---
"create-cartwright": patch
---

Stop patching `/icon` into the proxy matcher on engines that exempt it themselves.

Engines from the locale-exempt release (#433) onward handle `/icon` in the proxy
HANDLER (`lib/locale-exempt.ts` → `isAssetExempt`) and keep it INSIDE the matcher
on purpose, so merchant redirects still reach it. On such a template the CLI's
old matcher patch was not a second safety net but a regression: it took `/icon`
out of the middleware entirely, swallowed sibling names like `/iconography`
because the exclusion is a prefix, and red-gated the release scaffold gate on the
engine's own `locale-exempt-routes` test.

Legacy templates — `--ref stable` is still v0.44.1, which predates #433 — and the
site profile's `proxy.static.ts` have no such branch and still get the patch.
