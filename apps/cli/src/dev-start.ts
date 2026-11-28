import { spawn as nodeSpawn } from "node:child_process";
import pc from "picocolors";

/**
 * What `--start` prints about the dev server it launches (APP-START-PORT).
 *
 * It used to print `open http://localhost:3000/en` BEFORE the server ran.
 * When port 3000 is taken, `next dev` moves to 3001, 3002, … — and the one
 * line meant to hand the user a working link pointed at somebody else's
 * server, or at nothing. The port is not known until Next prints it, so:
 *
 *   1. The line printed before the start promises no URL (`startingLine`).
 *   2. The CLI reads Next's own `- Local: http://localhost:NNNN` line from the
 *      server's stdout — the same line the engine's `scripts/dev-agent.mjs`
 *      treats as the source of truth for the port — and only then prints
 *      `➜ Open: <that origin>/<defaultLocale>` (`createLocalUrlWatcher`).
 *
 * The locale is read from the scaffold's own brand.config.ts, not assumed:
 * no match ⇒ no suffix, and the bare origin still redirects to the default
 * locale.
 */

/** The line printed before the dev server starts. It names no port: none is known yet. */
export function startingLine(runCmd: string, cdDir: string): string {
  return (
    `Starting ${runCmd} dev in ${cdDir}/ — port 3000 is only the default; ` +
    `the URL it really chose is printed below once Next reports it.`
  );
}

const ANSI = /\x1b\[[0-9;]*m/g;

/**
 * The origin from Next's `- Local:        http://localhost:3001` line, or
 * null while that line has not (fully) arrived. The trailing whitespace is
 * required so a chunk cut mid-URL (`http://localhost:30`) never matches.
 */
export function parseLocalUrl(output: string): string | null {
  const m = output.replace(ANSI, "").match(/Local:\s+(https?:\/\/[^\s]+?)\/?\s/);
  return m ? m[1] : null;
}

/** `defaultLocale` from a brand.config.ts source; "" when it has none. */
export function defaultLocaleFrom(brandConfigSrc: string | null): string {
  const m = brandConfigSrc?.match(/defaultLocale:\s*["']([A-Za-z-]+)["']/);
  return m ? m[1] : "";
}

/** The line that hands the user the URL the dev server actually chose. */
export function openLine(origin: string, locale: string): string {
  return `➜ Open: ${origin}${locale ? `/${locale}` : ""}`;
}

/**
 * Feed it the dev server's stdout chunk by chunk; it calls `onUrl` exactly
 * once, with the observed origin, when Next's Local line is complete.
 */
export function createLocalUrlWatcher(onUrl: (origin: string) => void): (chunk: string) => void {
  let buffer = "";
  let done = false;
  return (chunk) => {
    if (done) return;
    buffer += chunk;
    const origin = parseLocalUrl(buffer);
    if (!origin) {
      // Keep the tail only: the Local line arrives in the first screenful.
      if (buffer.length > 64_000) buffer = buffer.slice(-4_000);
      return;
    }
    done = true;
    buffer = "";
    onUrl(origin);
  };
}

export interface StartDevServerInput {
  /** `pnpm`, `yarn` or `npm`. */
  packageManager: string;
  /** `pnpm`, `yarn` or `npm run` — what the user would type. */
  runCmd: string;
  /** The folder the user types after `cd`. */
  cdDir: string;
  /** The scaffold's absolute path. */
  cwd: string;
  /** The scaffold's brand.config.ts, or null when it cannot be read. */
  brandConfigSrc: string | null;
}

export interface StartDevServerDeps {
  spawn: typeof nodeSpawn;
  /** Where the CLI's own lines and the server's passthrough go. */
  write: (s: string | Buffer) => void;
  writeError: (s: string) => void;
  /** True when the CLI writes to a terminal (keeps the server's colours on). */
  isTTY: boolean;
  env: NodeJS.ProcessEnv;
  /** Ctrl+C reaches the server through the terminal; the CLI must outlive it. */
  holdSigint: () => () => void;
}

const defaultDeps = (): StartDevServerDeps => ({
  spawn: nodeSpawn,
  write: (s) => process.stdout.write(s),
  writeError: (s) => console.error(s),
  isTTY: process.stdout.isTTY === true,
  env: process.env,
  holdSigint: () => {
    const ignore = () => {};
    process.on("SIGINT", ignore);
    return () => process.off("SIGINT", ignore);
  },
});

/**
 * Runs `<pm> dev` in the foreground until it exits. Its stdout is piped only
 * so the Local line can be read; every byte is passed through unchanged.
 */
export async function startDevServer(
  input: StartDevServerInput,
  deps: StartDevServerDeps = defaultDeps(),
): Promise<void> {
  const { packageManager, runCmd, cdDir, cwd } = input;
  deps.write(pc.dim(`\n${startingLine(runCmd, cdDir)}\n\n`));
  const locale = defaultLocaleFrom(input.brandConfigSrc);
  const watch = createLocalUrlWatcher((origin) => {
    deps.write(`\n   ${pc.bold(openLine(origin, locale))}\n\n`);
  });
  const [cmd, ...args] =
    packageManager === "npm" ? ["npm", "run", "dev"] : [packageManager, "dev"];
  const child = deps.spawn(cmd, args, {
    cwd,
    stdio: ["inherit", "pipe", "inherit"],
    env:
      deps.isTTY && deps.env.FORCE_COLOR === undefined
        ? { ...deps.env, FORCE_COLOR: "1" }
        : deps.env,
  });
  const release = deps.holdSigint();
  child.stdout?.on("data", (chunk: Buffer) => {
    deps.write(chunk);
    watch(chunk.toString());
  });
  try {
    await new Promise<void>((resolve) => {
      child.on("error", (err) => {
        deps.writeError(pc.red(`Could not start ${runCmd} dev: ${err.message}`));
        resolve();
      });
      child.on("close", () => resolve());
    });
  } finally {
    release();
  }
}
