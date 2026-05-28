---
"create-cartwright": patch
---

Fix v2 AI-scaffolder crashing with `Unexpected status 404` on Gemini key validation.

The hardcoded `gemini-1.5-flash` model has been retired in the Gemini API, so `validateKey` received a 404 even for valid keys and crashed the whole scaffolder. Updated to `gemini-2.0-flash`.

Also hardened `resolveKeyMode`: an unexpected/thrown validation result (404, 5xx, network) now degrades gracefully to the manual (v1) scaffold instead of crashing, so a future model retirement can't brick the CLI. Fixed the stale `v2.0.0-beta` intro banner to read the real version from `package.json`.
