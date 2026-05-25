---
"create-cartwright": patch
---

Fix `ERR_MODULE_NOT_FOUND` at runtime — relative imports now include the `.js` suffix required by Node.js ESM resolution. The package is `"type": "module"` and tsconfig uses `moduleResolution: "Bundler"` which permits extension-less imports at compile time but Node.js cannot resolve them at runtime without the explicit extension. Affected: 2.0.1 (deprecated) and 2.0.0-beta.1 if anyone tried to actually run them.
