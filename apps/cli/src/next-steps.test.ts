import { describe, expect, it } from "vitest";
import {
  AGENT_BLOCK_HEADING,
  AGENT_RULES_SECTION,
  DEV_URL_FILE,
  nextStepsLines,
  type NextStepsInput,
} from "./next-steps";

/**
 * DRØM119 / DRØM160: the CLI's stdout told agents "run `pnpm dev` … wait for
 * http://localhost:3000/en … Then read .claude/CLAUDE.md", while the rules
 * files it ships say never assume port 3000, start `pnpm dev:agent` and read
 * the URL from .cartwright/dev-url. An agent obeys the order it reads first.
 */
// picocolors is on under CI=true, so compare the words, not the escape codes.
const plain = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");

function render(s: Partial<NextStepsInput>) {
  const lines = nextStepsLines({
    profile: "light",
    dbReady: true,
    runCmd: "pnpm",
    cdDir: "nord-kaffe",
    ...s,
  }).map(plain);
  const at = lines.indexOf(AGENT_BLOCK_HEADING);
  expect(at, "no AI-agent block printed").toBeGreaterThan(0);
  return { human: lines.slice(0, at).join("\n"), agent: lines.slice(at + 1).join("\n") };
}

const BLOCKS: Array<[string, Partial<NextStepsInput>]> = [
  ["site profile", { profile: "site", dbReady: false }],
  ["database ready", { profile: "light", dbReady: true }],
  ["database not set up yet", { profile: "full", dbReady: false }],
];
const RUNNERS = ["pnpm", "npm run", "yarn"];

describe("nextStepsLines — the agent block says what the rules files say", () => {
  for (const [label, state] of BLOCKS) {
    for (const runCmd of RUNNERS) {
      it(`${label} · ${runCmd}: dev:agent and .cartwright/dev-url, never localhost:3000`, () => {
        const { agent } = render({ ...state, runCmd });
        expect(agent).not.toContain("localhost:3000");
        expect(agent).toContain(`\`${runCmd} dev:agent\``);
        // The plain dev server is the human path; an agent must not be told to start it.
        expect(agent).not.toContain(`\`${runCmd} dev\``);
        expect(agent).toContain(DEV_URL_FILE);
        expect(agent).toContain(`"${AGENT_RULES_SECTION}"`);
        expect(agent).toContain("nord-kaffe/");
        expect(agent).toContain("WORKING link");
      });
    }

    it(`${label}: the rules come before the command, not after it`, () => {
      const { agent } = render(state);
      const rules = agent.indexOf("Read the rules first");
      expect(rules, "the block never sends the agent to the rules").toBeGreaterThanOrEqual(0);
      expect(rules).toBeLessThan(agent.indexOf("pnpm dev:agent"));
    });
  }

  it("database not set up yet: db:setup runs before dev:agent", () => {
    const { agent } = render({ profile: "light", dbReady: false });
    expect(agent).toContain("`pnpm db:setup`");
    expect(agent.indexOf("`pnpm db:setup`")).toBeLessThan(agent.indexOf("`pnpm dev:agent`"));
  });

  it("database ready and site: no db:setup in the agent block", () => {
    expect(render({ profile: "light", dbReady: true }).agent).not.toContain("db:setup");
    expect(render({ profile: "site", dbReady: false }).agent).not.toContain("db:setup");
  });

  it("site: the agent still learns the profile lacks sections", () => {
    expect(render({ profile: "site" }).agent).toContain(
      "its first line says which sections",
    );
  });

  it("the human lines keep `dev` and the usual URL (DRØM119: the human line may stay)", () => {
    for (const [, state] of BLOCKS) {
      const { human } = render(state);
      expect(human).toMatch(/Next steps/);
      expect(human).toContain("  cd nord-kaffe");
      expect(human).toMatch(/ {2}pnpm dev {2,}# http:\/\/localhost:3000\/en/);
      expect(human).not.toContain("dev:agent");
    }
    expect(render({ profile: "full", dbReady: false }).human).toContain("pnpm db:setup");
  });
});
