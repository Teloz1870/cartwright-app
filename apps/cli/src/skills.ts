/**
 * AI-agent skills installer.
 *
 * After the template snapshot is downloaded and dependencies installed, the
 * CLI optionally runs Chrome team's `modern-web-guidance` skill installer in
 * the customer's project directory. That places the skill in their machine's
 * agent-skills location (typically `~/.agents/skills/`) so Claude Code,
 * Cursor, and Copilot all see it on first session.
 *
 * The Cartwright-specific skill scaffolding (`.claude/skills/cartwright-guidance/`,
 * `.cursor/rules/`, `.github/copilot-instructions.md`) is part of the template
 * itself and ships unconditionally — this module only handles the upstream
 * Chrome-team install.
 *
 * Best-effort throughout: declines, timeouts, and errors degrade gracefully
 * to a printed note. The scaffold itself never fails because of this step.
 */
import { execSync } from "node:child_process";
import { confirm, isCancel, note, spinner } from "@clack/prompts";
import pc from "picocolors";

/**
 * Pinned version of the upstream skill. modern-web-guidance is pre-1.0
 * (last surveyed: 2026-05-26), so an unpinned `@latest` would risk silent
 * API drift between scaffolds. A scheduled workflow in
 * `.github/workflows/bump-modern-web-guidance.yml` opens a PR when a newer
 * version appears upstream; merge gates on manual review of the changelog.
 *
 * Once upstream hits 1.0, switch this to a semver range like "^1.0.0" and
 * retire the bump workflow.
 */
export const MODERN_WEB_GUIDANCE_VERSION = "0.0.174";

/**
 * Generous upper bound. modern-web-guidance is ~36 MB; on a typical
 * connection the install finishes in 10–20s. 30s gives slow networks room
 * without making the customer wait forever on a hung registry call.
 */
export const SKILL_INSTALL_TIMEOUT_MS = 30_000;

export type InstallSkillOpts = {
  /** Skip the prompt entirely (set by --skip-skills). */
  skip?: boolean;
  /** Bypass the prompt and install unconditionally (set by --yes). */
  assumeYes?: boolean;
};

export type InstallSkillResult =
  | { status: "skipped"; reason: "flag" | "declined" | "cancelled" }
  | { status: "installed"; version: string }
  | { status: "failed"; reason: "timeout" | "error"; error?: Error };

/**
 * Side-effecting npx install. Separated from the prompt flow so the test
 * suite can stub it directly. Never throws; always returns a result struct.
 */
export function tryInstallSkill(targetDir: string): InstallSkillResult {
  try {
    execSync(
      `npx --yes modern-web-guidance@${MODERN_WEB_GUIDANCE_VERSION} install --yes`,
      {
        cwd: targetDir,
        stdio: "ignore",
        timeout: SKILL_INSTALL_TIMEOUT_MS,
      },
    );
    return { status: "installed", version: MODERN_WEB_GUIDANCE_VERSION };
  } catch (err) {
    const error = err as NodeJS.ErrnoException & { signal?: NodeJS.Signals };
    // execSync kills the child with SIGTERM (default `killSignal`) when the
    // timeout fires; some environments also surface ETIMEDOUT.
    if (error.signal === "SIGTERM" || error.code === "ETIMEDOUT") {
      return { status: "failed", reason: "timeout", error };
    }
    return { status: "failed", reason: "error", error };
  }
}

/**
 * Prompt + install. Best-effort; never blocks scaffold completion.
 */
export async function installModernWebGuidance(
  targetDir: string,
  opts: InstallSkillOpts = {},
): Promise<InstallSkillResult> {
  if (opts.skip) {
    return { status: "skipped", reason: "flag" };
  }

  let accept = opts.assumeYes === true;

  if (!opts.assumeYes) {
    const answer = await confirm({
      message:
        "Install Chrome team's Modern Web Guidance skill for your AI coding agent? (recommended)",
      initialValue: true,
    });
    if (isCancel(answer)) {
      return { status: "skipped", reason: "cancelled" };
    }
    accept = answer === true;
  }

  if (!accept) {
    note(
      pc.dim(
        `Skipped. Install later with:\n  npx modern-web-guidance@${MODERN_WEB_GUIDANCE_VERSION} install`,
      ),
      "info",
    );
    return { status: "skipped", reason: "declined" };
  }

  const sp = spinner();
  sp.start(
    `Installing modern-web-guidance@${MODERN_WEB_GUIDANCE_VERSION} (Chrome team)…`,
  );
  const result = tryInstallSkill(targetDir);

  if (result.status === "installed") {
    sp.stop(
      pc.green(`Modern Web Guidance skill installed (v${result.version}).`),
    );
  } else if (result.reason === "timeout") {
    sp.stop(
      pc.yellow(
        `Modern Web Guidance install timed out after ${SKILL_INSTALL_TIMEOUT_MS / 1000}s — run \`npx modern-web-guidance@${MODERN_WEB_GUIDANCE_VERSION} install\` manually later.`,
      ),
    );
  } else {
    sp.stop(
      pc.yellow(
        `Modern Web Guidance install failed — run \`npx modern-web-guidance@${MODERN_WEB_GUIDANCE_VERSION} install\` manually later.`,
      ),
    );
  }

  return result;
}
