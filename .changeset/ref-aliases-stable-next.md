---
"create-cartwright": minor
---

Add `--ref stable` and `--ref next` channel aliases.

- `--ref stable` (default) resolves to the latest tagged template release — same behaviour as before, but explicit.
- `--ref next` opts into the bleeding-edge `next` branch of `Teloz1870/cartwright-template`, which is updated on every push to `cartwright-private/main`. Not recommended for production scaffolds; useful for trying new features that haven't been tagged for stable release yet.
- `--ref <tag-or-branch>` continues to work for pinning to a specific historical tag or arbitrary mirror branch.

The spinner now shows `alias → resolved-ref` so users can see which tag was actually pulled (helpful for support tickets).
