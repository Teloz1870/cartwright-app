import pc from "picocolors";
import type { Profile } from "./profile-light.js";

/**
 * The "Next steps" block printed after a scaffold: a human part and an
 * AI-agent part.
 *
 * The agent part used to tell agents to run `pnpm dev`, wait for
 * http://localhost:3000/en and only THEN read .claude/CLAUDE.md — the opposite
 * of the rules files the scaffold ships. AGENTS.md and .claude/CLAUDE.md
 * ("Start the dev server (agents)") say never to assume port 3000 (Next moves
 * to 3001, 3002, … when it is taken) and to run `pnpm dev:agent`, which writes
 * the URL Next actually chose to `.cartwright/dev-url`. An agent that obeyed
 * the stdout instead polled a port its server was not on, or a server that was
 * someone else's. The agent lines now say: rules first, then `dev:agent`, then
 * the URL from the file.
 *
 * The human lines keep `dev` + the usual URL: a person reads the port off the
 * terminal Next prints to.
 *
 * `dev:agent` ships in every profile, `--profile site` included: no module
 * claims `scripts/dev-agent.mjs`, the engine's `sitePrunedScripts` does not
 * list it, and the site materializer's own script-key and path prunes keep
 * both the file and the script (scaffold-anchor-drift.test.ts replays that
 * pipeline on the real template's package.json and manifest).
 */

/** The heading both AGENTS.md and .claude/CLAUDE.md give the agent recipe. */
export const AGENT_RULES_SECTION = "Start the dev server (agents)";
/** Where `dev:agent` writes the URL Next actually chose. */
export const DEV_URL_FILE = ".cartwright/dev-url";
/** The package.json script agents start instead of `dev`. */
export const DEV_AGENT_SCRIPT = "dev:agent";

export const AGENT_BLOCK_HEADING = "AI agents (Claude / Gemini / Codex) reading this:";

export interface NextStepsInput {
  profile: Profile;
  dbReady: boolean;
  /** `pnpm`, `yarn` or `npm run`. */
  runCmd: string;
  /** The folder the user types after `cd`. */
  cdDir: string;
}

function agentBlock(s: NextStepsInput): string[] {
  const devAgent = `\`${s.runCmd} ${DEV_AGENT_SCRIPT}\``;
  const rules =
    s.profile === "site"
      ? [
          `  Read the rules first: .claude/CLAUDE.md — its first line says which sections`,
          `  this profile does not have — then its "${AGENT_RULES_SECTION}" section.`,
        ]
      : [`  Read the rules first: "${AGENT_RULES_SECTION}" in AGENTS.md or .claude/CLAUDE.md.`];
  const start =
    s.profile !== "site" && !s.dbReady
      ? `  Then run \`${s.runCmd} db:setup\` and start ${devAgent} in the background from ${s.cdDir}/.`
      : `  Then start ${devAgent} in the background from ${s.cdDir}/.`;
  return [
    pc.bold(AGENT_BLOCK_HEADING),
    ...rules.map((l) => pc.dim(l)),
    pc.dim(start),
    pc.dim(`  Never assume port 3000: ${DEV_URL_FILE} holds the URL Next actually chose.`),
    pc.dim("  Wait for that URL to return 200 and hand your user that WORKING link"),
    pc.dim("  instead of instructions."),
  ];
}

export function nextStepsLines(s: NextStepsInput): string[] {
  const { runCmd, cdDir } = s;
  const human =
    s.profile === "site"
      ? [
          pc.bold("Next steps:"),
          `  cd ${cdDir}`,
          `  ${runCmd} dev                ${pc.dim("# http://localhost:3000/en — no database, no login, just your site")}`,
          pc.dim("  Content lives in brand.config.ts; design via designs/ and the shipped packs."),
          pc.dim("  The guide for this profile: docs/simple-site.md"),
          pc.dim("  (online: https://cartwright.app/docs/getting-started/plain-website)"),
        ]
      : s.dbReady
        ? [
            pc.bold("Next steps:"),
            `  cd ${cdDir}`,
            `  ${runCmd} dev                ${pc.dim("# http://localhost:3000/en")}`,
            pc.dim("  English-only by default — add languages in brand.config.ts (locales)."),
          ]
        : [
            pc.bold("Next steps (required):"),
            `  cd ${cdDir}`,
            `  ${runCmd} db:setup           ${pc.dim("# create schema + seed admin/demo (robust; prints your login)")}`,
            `  ${runCmd} dev                ${pc.dim("# http://localhost:3000/en")}`,
            pc.dim("  English-only by default — add languages in brand.config.ts (locales)."),
          ];
  return [...human, "", ...agentBlock(s)];
}
