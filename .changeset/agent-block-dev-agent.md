---
"create-cartwright": patch
---
The "AI agents reading this" block after a scaffold now says what the project's own rules files say: read "Start the dev server (agents)" in AGENTS.md or .claude/CLAUDE.md first, start `pnpm dev:agent` in the background, and take the URL from `.cartwright/dev-url` instead of assuming `localhost:3000`. An agent no longer waits on port 3000 while the server it started runs on 3001.
