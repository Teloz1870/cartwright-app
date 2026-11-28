import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  createLocalUrlWatcher,
  defaultLocaleFrom,
  holdProcessSigint,
  parseLocalUrl,
  startDevServer,
  type StartDevServerDeps,
} from "./dev-start";

/**
 * APP-START-PORT: `--start` printed `open http://localhost:3000/en` before the
 * server ran. With 3000 taken, `next dev` moves to 3001 and that line handed
 * the user a link to somebody else's server. These tests play a dev server
 * whose port 3000 was taken (no real process): its stdout carries Next's own
 * Local line for 3001, split across chunks and coloured as Next colours it.
 */
const plain = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");

/** Next 16's banner when 3000 is busy, ANSI included. */
const NEXT_ON_3001 = [
  "\x1b[33m⚠\x1b[39m Port 3000 is in use by an unknown process, using available port 3001 instead.\n",
  "   \x1b[1m\x1b[35m▲ Next.js 16.4.6\x1b[39m\x1b[22m (Turbopack)\n   - Local:        http://localhost:30",
  "01\n   - Network:      http://192.168.1.20:3001\n\n \x1b[32m✓\x1b[39m Starting...\n",
];

const BRAND_EN = `export const brand = {\n  locales: ["en"] as const,\n  defaultLocale: "en",\n};\n`;

function fakeServer(chunks: string[], opts: { fail?: Error } = {}) {
  const out: string[] = [];
  const err: string[] = [];
  const spawned: Array<{ cmd: string; args: string[]; options: Record<string, unknown> }> = [];
  let sigintHeld = 0;
  /** The hold count while the server is still running (before it exits). */
  let heldWhileRunning = -1;
  const spawn = ((cmd: string, args: string[], options: Record<string, unknown>) => {
    spawned.push({ cmd, args, options });
    const child = new EventEmitter() as EventEmitter & { stdout: EventEmitter };
    child.stdout = new EventEmitter();
    setImmediate(() => {
      heldWhileRunning = sigintHeld;
      if (opts.fail) {
        child.emit("error", opts.fail);
        return;
      }
      for (const c of chunks) child.stdout.emit("data", Buffer.from(c));
      child.emit("close", 0);
    });
    return child;
  }) as unknown as StartDevServerDeps["spawn"];
  const deps: StartDevServerDeps = {
    spawn,
    write: (s) => out.push(String(s)),
    writeError: (s) => err.push(s),
    isTTY: false,
    env: {},
    holdSigint: () => {
      sigintHeld++;
      return () => sigintHeld--;
    },
  };
  return {
    deps,
    out: () => plain(out.join("")),
    err: () => plain(err.join("")),
    spawned,
    sigintHeld: () => sigintHeld,
    heldWhileRunning: () => heldWhileRunning,
  };
}

const INPUT = {
  packageManager: "pnpm",
  runCmd: "pnpm",
  cdDir: "nord-kaffe",
  cwd: "/tmp/nord-kaffe",
  brandConfigSrc: BRAND_EN,
};

describe("startDevServer — port 3000 taken", () => {
  it("hands the user the port Next chose, with the scaffold's locale, never 3000", async () => {
    const s = fakeServer(NEXT_ON_3001);
    await startDevServer(INPUT, s.deps);
    const out = s.out();
    expect(out).toContain("➜ Open: http://localhost:3001/en");
    // The only "3000" left is Next's own warning, passed through.
    expect(out).not.toMatch(/localhost:3000/);
    // The server's output is passed through untouched.
    expect(out).toContain("- Network:      http://192.168.1.20:3001");
  });

  it("prints no URL before the server has said which one it took", async () => {
    const s = fakeServer(NEXT_ON_3001);
    await startDevServer(INPUT, s.deps);
    const before = s.out().split("➜ Open:")[0].split("⚠")[0];
    expect(before).toContain("Starting pnpm dev in nord-kaffe/");
    expect(before).not.toMatch(/https?:\/\//);
  });

  it("prints the URL once, after Next's Local line", async () => {
    const s = fakeServer([...NEXT_ON_3001, "   - Local:        http://localhost:3001\n"]);
    await startDevServer(INPUT, s.deps);
    const out = s.out();
    expect(out.match(/➜ Open:/g)).toHaveLength(1);
    expect(out.indexOf("➜ Open:")).toBeGreaterThan(out.indexOf("- Local:"));
  });

  it("the locale is the scaffold's, not a fixed /en", async () => {
    const s = fakeServer(NEXT_ON_3001);
    await startDevServer({ ...INPUT, brandConfigSrc: `  defaultLocale: "da",\n` }, s.deps);
    expect(s.out()).toContain("➜ Open: http://localhost:3001/da");
    const bare = fakeServer(NEXT_ON_3001);
    await startDevServer({ ...INPUT, brandConfigSrc: null }, bare.deps);
    expect(bare.out()).toMatch(/➜ Open: http:\/\/localhost:3001\n/);
  });

  it("no Local line, no invented URL", async () => {
    const s = fakeServer(["something else entirely\n"]);
    await startDevServer(INPUT, s.deps);
    expect(s.out()).not.toContain("➜ Open:");
  });

  it("runs the package manager's dev script in the scaffold, stdout piped, and holds Ctrl+C until it exits", async () => {
    const s = fakeServer(NEXT_ON_3001);
    await startDevServer({ ...INPUT, packageManager: "npm", runCmd: "npm run" }, s.deps);
    expect(s.spawned).toHaveLength(1);
    expect(s.spawned[0].cmd).toBe("npm");
    expect(s.spawned[0].args).toEqual(["run", "dev"]);
    expect(s.spawned[0].options.cwd).toBe("/tmp/nord-kaffe");
    expect(s.spawned[0].options.stdio).toEqual(["inherit", "pipe", "inherit"]);
    // Held while the server runs, released once it has exited.
    expect(s.heldWhileRunning()).toBe(1);
    expect(s.sigintHeld()).toBe(0);
  });

  it("the default hold keeps a SIGINT listener (so Node does not exit) and the release removes it", () => {
    const before = process.listenerCount("SIGINT");
    const release = holdProcessSigint();
    expect(process.listenerCount("SIGINT")).toBe(before + 1);
    release();
    expect(process.listenerCount("SIGINT")).toBe(before);
  });

  it("a server that cannot start says so and releases Ctrl+C", async () => {
    const s = fakeServer([], { fail: new Error("spawn pnpm ENOENT") });
    await startDevServer(INPUT, s.deps);
    expect(s.err()).toContain("Could not start pnpm dev: spawn pnpm ENOENT");
    expect(s.heldWhileRunning()).toBe(1);
    expect(s.sigintHeld()).toBe(0);
  });
});

describe("parseLocalUrl / createLocalUrlWatcher", () => {
  it("waits for the whole URL when a chunk ends mid-port", () => {
    expect(parseLocalUrl("   - Local:        http://localhost:30")).toBeNull();
    const seen: string[] = [];
    const watch = createLocalUrlWatcher((o) => seen.push(o));
    watch("   - Local:        http://localhost:30");
    expect(seen).toEqual([]);
    watch("01\n");
    expect(seen).toEqual(["http://localhost:3001"]);
  });

  it("drops a trailing slash and reads through Next's colours", () => {
    expect(parseLocalUrl("\x1b[2m- Local:\x1b[22m        \x1b[36mhttp://localhost:3002/\x1b[39m\n")).toBe(
      "http://localhost:3002",
    );
  });

  it("defaultLocaleFrom reads single or double quotes, else nothing", () => {
    expect(defaultLocaleFrom(`defaultLocale: 'de'`)).toBe("de");
    expect(defaultLocaleFrom(BRAND_EN)).toBe("en");
    expect(defaultLocaleFrom("export const brand = {};")).toBe("");
    expect(defaultLocaleFrom(null)).toBe("");
  });
});

const HERE = dirname(fileURLToPath(import.meta.url));

describe("index.ts --start", () => {
  const src = readFileSync(join(HERE, "index.ts"), "utf8");
  it("hands the start to startDevServer and hard-codes no dev URL", () => {
    expect(src).toContain("await startDevServer(");
    expect(src).not.toMatch(/localhost:3000/);
  });
  it("starts the server in the scaffold and passes it the scaffold's own brand.config.ts", () => {
    const call = src.slice(src.indexOf("await startDevServer("));
    const args = call.slice(0, call.indexOf("});"));
    expect(args).toContain("cwd: targetDir,");
    expect(src).toContain('const brandConfigPath = join(targetDir, "brand.config.ts");');
    expect(args).toContain('brandConfigSrc: existsSync(brandConfigPath) ? readFileSync(brandConfigPath, "utf8") : null,');
  });
});

describe("README (the npm package page)", () => {
  const readme = readFileSync(join(HERE, "..", "README.md"), "utf8");
  it("sends a human to the URL the server prints, 3000 only as the default", () => {
    expect(readme).not.toMatch(/Open `http:\/\/localhost:3000`/);
    expect(readme).toContain("Open the URL `pnpm dev` prints");
    expect(readme).toMatch(/3000` by default/);
  });
  it("tells an agent about dev:agent and .cartwright/dev-url", () => {
    expect(readme).toContain("`pnpm dev:agent`");
    expect(readme).toContain("`.cartwright/dev-url`");
  });
});
