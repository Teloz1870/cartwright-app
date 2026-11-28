---
"create-cartwright": patch
---
`--start` no longer prints `open http://localhost:3000/en` before the server runs: it reads the port from Next's own `Local:` line and then prints `➜ Open: <that URL>/<your defaultLocale>`, so with port 3000 taken you are sent to 3001, not to somebody else's server. The site-profile agent block now points at the `--profile site` scaffold? callouts in `.claude/CLAUDE.md` instead of a "first line" that is the file's title, and the package README says to open the URL `pnpm dev` prints (3000 is only the default) and tells agents about `pnpm dev:agent` and `.cartwright/dev-url`.
