---
"create-cartwright": patch
---

Make `next build` (and Vercel deploys) actually pass on a fresh scaffold.

Two issues broke the production build of every scaffold (dev did not catch them because `next dev` does not fail on type errors):

- **industryTemplate narrowed to a literal.** The brand-config patch wrote `industryTemplate: "generic"` as a bare literal. Seven files compare `brand.industryTemplate === "saas"`, which then became a "no overlap" type error. It is now emitted with a union cast (`as "saas" | "coffee" | …`), matching the existing `mode` cast.
- **Dependency drift from lockfile deletion.** `tryInstall` deleted the template's committed `package-lock.json`, so `npm install` resolved `^` ranges to newer, untested versions — e.g. a newer Stripe SDK that rejects the pinned `apiVersion` literal. It now keeps the lockfile matching the chosen package manager, so installs are deterministic and match the versions the template was tested against.

Verified end-to-end: a fresh `--db=sqlite` scaffold now passes `npm run build`.
