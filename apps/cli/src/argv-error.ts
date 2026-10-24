/**
 * Bad command-line input → one line on stderr and exit 2, never a stack trace.
 *
 * Every runner (the scaffolder, `design install`, `vertical install`,
 * `doctor`) reads its flags with node:util `parseArgs` in strict mode, which
 * THROWS a TypeError coded `ERR_PARSE_ARGS_*` on an unknown flag, a missing
 * option value or a stray positional. The top-level catch in index.ts used to
 * print those as "Unexpected error:" plus the whole stack and exit 1 — for
 * `--version` too, which the CLI did not know (EXT1, measured on npm 2.9.10).
 * They are the caller's typo, not our crash, so index.ts routes them here.
 */

/** The conventional exit code for a usage error (1 stays "something broke"). */
export const ARGV_ERROR_EXIT = 2;

/** True for the errors `parseArgs` throws on bad input — and nothing else. */
export function isArgvError(err: unknown): err is Error {
  if (!(err instanceof Error)) return false;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" && code.startsWith("ERR_PARSE_ARGS_");
}

/**
 * Node's own wording ("Unknown option '--bogus'", "Option '--db <value>'
 * argument missing") on one line, minus its "place it after '--'" tip — that
 * tip is for positionals that start with a dash, never what a typo meant.
 */
export function argvErrorLine(err: Error): string {
  const reason = err.message
    .replace(/\. To specify a positional argument starting with a '-'[\s\S]*$/, "")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\.$/, "");
  return `${reason}. Run create-cartwright --help to see the options.`;
}
