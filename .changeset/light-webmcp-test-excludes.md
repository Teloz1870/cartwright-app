---
"create-cartwright": patch
---

Light profile prunes the WebMCP 2.0 unit-test surface (five upcoming engine
test files that import light-pruned modules), so a fresh `--profile light`
scaffold stays green when the engine's per-route WebMCP tools land. The new
`components/webmcp/` per-page mounts are deliberately kept — they gate on the
default-off `webMcp` flag and import only core modules.
