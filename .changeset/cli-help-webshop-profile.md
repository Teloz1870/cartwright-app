---
"create-cartwright": patch
---

`--help` no longer implies a webshop needs `--profile full`: the profile and template notes now say a webshop is `--profile light --template generic`, and that `full` only adds the agent marketplace, UCP identity-linking, the Shopify (Hoptify) importer, the agentic surfaces and the uncurated design packs. The stale "all 26 designs" count is gone from the help text (the engine ships 30; a number in `--help` drifts). Measured 2026-09-06: three of three AI replays moving a WooCommerce shop scaffolded `--profile full` after reading the old text.
