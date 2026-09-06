---
"create-cartwright": patch
---

A scaffold no longer ships our identity or scripts it cannot run.

Measured on a real `create-cartwright@2.9.4 --profile site` scaffold: five
scripts pointed at files the profile had removed (`admin:create`,
`capture:gallery`, `dev:screenshot`, `capture:locales`, `verify:design` — the
last of which `DESIGN.md` tells the owner to run), and `brand.config.ts` shipped
`domain: "cartwright.app"`, `url: "https://cartwright.app"` and
noreply@/support@/admin@ addresses at our domain; in a database-backed profile
the seed creates its admin user from that address.

Dead scripts are now derived from the materialised tree instead of a hand-kept
key list, and the identity strip covers the engine's current domain as well as
the one it used to have. The "Built with Cartwright" link and the prose that
names us are untouched. The site profile's next-steps epilogue now points at
`docs/simple-site.md` and the online runbook.
