import { describe, expect, it } from "vitest";
import { parseArgs } from "node:util";
import { argvErrorLine, isArgvError } from "./argv-error.js";

/** The error node:util `parseArgs` really throws for these argv (EXT1). */
function thrownBy(args: string[], allowPositionals = true): unknown {
  try {
    parseArgs({
      args,
      allowPositionals,
      options: { db: { type: "string" }, yes: { type: "boolean" } },
    });
  } catch (err) {
    return err;
  }
  throw new Error(`parseArgs accepted ${args.join(" ")}`);
}

describe("argv errors", () => {
  it("recognises every parseArgs input error, and nothing else", () => {
    expect(isArgvError(thrownBy(["--bogus"]))).toBe(true);
    expect(isArgvError(thrownBy(["--yes=no"]))).toBe(true);
    expect(isArgvError(thrownBy(["stray"], false))).toBe(true);
    // A real crash keeps its stack: same class, no parse-args code.
    expect(isArgvError(new TypeError("Cannot read properties of undefined"))).toBe(false);
    expect(isArgvError(Object.assign(new Error("x"), { code: "ENOENT" }))).toBe(false);
    expect(isArgvError("ERR_PARSE_ARGS_UNKNOWN_OPTION")).toBe(false);
  });

  it("keeps node's reason on one line and drops the '--' positional tip", () => {
    expect(argvErrorLine(thrownBy(["--bogus"]) as Error)).toBe(
      "Unknown option '--bogus'. Run create-cartwright --help to see the options.",
    );
    // The ambiguous-value message is three lines in node; it stays one here.
    const ambiguous = argvErrorLine(thrownBy(["--db", "-x"]) as Error);
    expect(ambiguous).not.toContain("\n");
    expect(ambiguous).toMatch(/^Option '--db' argument is ambiguous\. Did you forget /);
    expect(ambiguous).toMatch(/\. Run create-cartwright --help to see the options\.$/);
  });
});
