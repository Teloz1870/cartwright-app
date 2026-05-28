---
"create-cartwright": patch
---

Remove the upstream Teloz footer attribution from scaffolded projects.

`components/Footer.tsx` hardcodes "Ejet og drevet af Teloz ApS" (linking to teloz.net) plus a personal GitHub link — correct for the engine repo (which is the live Teloz site) but wrong on every customer's footer. The scaffolder now rewrites the customer's footer copy (store name, neutral URL, GitHub link removed) and also neutralizes `legalName` + the footer disclaimer in `brand.config.ts`. Pure-text replacements, so the customer's build is unaffected.
