---
"create-cartwright": patch
---

Anonymous, opt-out scaffold telemetry: one PII-free ping at the end of a successful
scaffold (cli version, channel, profile, template, node major, OS, db choice — never a
name, path or identifier). Opt out with `--no-telemetry`, `CARTWRIGHT_TELEMETRY=0` or
`DO_NOT_TRACK=1`. Fail-soft with a hard 1.5 s cap; documented in the README's Telemetry
section.
