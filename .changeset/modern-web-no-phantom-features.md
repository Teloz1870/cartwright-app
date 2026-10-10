---
"create-cartwright": patch
---
`MODERN_WEB.md`, written into every new scaffold, no longer lists features the engine does not have: the passkey row (no `passkeys` flag, no `/account/security` or `/api/auth/passkey/*` route, no WebAuthn code), the self-hosted Web Vitals row and its "turn it on" step (no `webVitals` flag, no `/api/vitals` or `/admin/performance`), and the `interpolate-size` row (no stylesheet uses it). The Authentication table now says what sign-in really is: email and password, plus magic links once a Resend key is set, and no login at all in a `--profile site` scaffold.
