import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock child_process so we never actually shell out to npx.
const execSyncMock = vi.fn();
vi.mock("node:child_process", () => ({
  execSync: (...args: unknown[]) => execSyncMock(...args),
}));

// Mock @clack/prompts so we control confirm() answers + silence spinners/notes.
const confirmMock = vi.fn();
vi.mock("@clack/prompts", () => ({
  confirm: (...args: unknown[]) => confirmMock(...args),
  isCancel: (v: unknown) => typeof v === "symbol",
  note: () => undefined,
  spinner: () => ({
    start: () => undefined,
    stop: () => undefined,
  }),
}));

// Import the module under test AFTER the mocks are registered.
const {
  installModernWebGuidance,
  tryInstallSkill,
  MODERN_WEB_GUIDANCE_VERSION,
  SKILL_INSTALL_TIMEOUT_MS,
} = await import("./skills");

beforeEach(() => {
  execSyncMock.mockReset();
  confirmMock.mockReset();
});

describe("installModernWebGuidance — branches", () => {
  it("--skip-skills flag → no prompt, no install, returns skipped/flag", async () => {
    const result = await installModernWebGuidance("/tmp/x", { skip: true });
    expect(result).toEqual({ status: "skipped", reason: "flag" });
    expect(confirmMock).not.toHaveBeenCalled();
    expect(execSyncMock).not.toHaveBeenCalled();
  });

  it("--yes flag → no prompt, installs unconditionally", async () => {
    execSyncMock.mockReturnValueOnce(Buffer.from(""));
    const result = await installModernWebGuidance("/tmp/x", {
      assumeYes: true,
    });
    expect(confirmMock).not.toHaveBeenCalled();
    expect(execSyncMock).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("installed");
  });

  it("prompt accept → npx invoked with pinned version + cwd=targetDir", async () => {
    confirmMock.mockResolvedValueOnce(true);
    execSyncMock.mockReturnValueOnce(Buffer.from(""));

    const result = await installModernWebGuidance("/tmp/foo");

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(execSyncMock).toHaveBeenCalledTimes(1);
    const [cmd, opts] = execSyncMock.mock.calls[0]!;
    expect(cmd).toContain(`modern-web-guidance@${MODERN_WEB_GUIDANCE_VERSION}`);
    expect(cmd).toContain("install");
    expect(opts).toMatchObject({
      cwd: "/tmp/foo",
      timeout: SKILL_INSTALL_TIMEOUT_MS,
    });
    expect(result).toEqual({
      status: "installed",
      version: MODERN_WEB_GUIDANCE_VERSION,
    });
  });

  it("prompt decline → no install, returns skipped/declined", async () => {
    confirmMock.mockResolvedValueOnce(false);

    const result = await installModernWebGuidance("/tmp/foo");

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(execSyncMock).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "skipped", reason: "declined" });
  });

  it("prompt cancelled (Ctrl+C) → no install, returns skipped/cancelled", async () => {
    confirmMock.mockResolvedValueOnce(Symbol("cancel"));

    const result = await installModernWebGuidance("/tmp/foo");

    expect(execSyncMock).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "skipped", reason: "cancelled" });
  });

  it("install timeout → failed/timeout, scaffold proceeds (no throw)", async () => {
    confirmMock.mockResolvedValueOnce(true);
    const err = Object.assign(new Error("ETIMEDOUT"), {
      signal: "SIGTERM" as NodeJS.Signals,
    });
    execSyncMock.mockImplementationOnce(() => {
      throw err;
    });

    const result = await installModernWebGuidance("/tmp/foo");

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.reason).toBe("timeout");
    }
  });

  it("install error (non-timeout) → failed/error, scaffold proceeds", async () => {
    confirmMock.mockResolvedValueOnce(true);
    execSyncMock.mockImplementationOnce(() => {
      throw new Error("network down");
    });

    const result = await installModernWebGuidance("/tmp/foo");

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.reason).toBe("error");
    }
  });
});

describe("tryInstallSkill — pure invocation", () => {
  it("pins to MODERN_WEB_GUIDANCE_VERSION", () => {
    execSyncMock.mockReturnValueOnce(Buffer.from(""));
    tryInstallSkill("/tmp/x");
    const [cmd] = execSyncMock.mock.calls[0]!;
    expect(cmd).toContain(`@${MODERN_WEB_GUIDANCE_VERSION}`);
    expect(cmd).not.toContain("@latest");
  });

  it("ETIMEDOUT code surfaces as timeout reason", () => {
    const err = Object.assign(new Error("timed out"), { code: "ETIMEDOUT" });
    execSyncMock.mockImplementationOnce(() => {
      throw err;
    });
    const result = tryInstallSkill("/tmp/x");
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.reason).toBe("timeout");
    }
  });
});
