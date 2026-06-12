---
"create-cartwright": patch
---

npm front door fixed: the published package now carries its README on npmjs.com (pnpm `embedReadme` — `pnpm publish` defaults it off, so every previous version shipped an empty registry readme despite README.md being inside the tarball), the package description now tells the real product story, and the README no longer claims the template repo is private (it is public + MIT).
