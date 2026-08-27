---
"create-cartwright": patch
---

The light (default) profile keeps the full WebMCP surface — and stops shipping a broken scaffold.

Two pruning bugs made every published light scaffold since 2.7.10 fail `tsc` out of the box:
`scripts/publish-agent-card.ts` shipped while its `lib/a2a` import was pruned (now excluded with
its module), and the WebMCP prune list predated engine v0.50.0's surface (nine test files,
cross-surface imports — the agent-tools showcase imports the registrar's bindings), so 2.7.13
scaffolds broke on the partial prune. WebMCP is now deliberately KEPT in every profile (owner
decision): the whole in-browser agent surface ships dormant behind the default-off `webMcp`
runtime flag, and the layout codemod is gone — `app/[locale]/layout.tsx` materializes
byte-identically.
