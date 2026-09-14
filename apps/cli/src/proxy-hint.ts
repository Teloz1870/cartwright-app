/**
 * giget 3 downloads the template with Node's own `fetch`, which ignores
 * HTTP_PROXY / HTTPS_PROXY unless the process was started with
 * NODE_USE_ENV_PROXY=1 or --use-env-proxy (Node 24.0 / 22.21 and later —
 * older Node cannot proxy `fetch` at all). giget 1 honoured those variables
 * itself, so a proxy user who upgrades would see "Template fetch failed" with
 * no clue. Say the one thing they need, only when it applies — and never echo
 * the proxy URL, which routinely carries credentials.
 */
const PROXY_VARS = ["HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"] as const;

type Probe = {
  env?: NodeJS.ProcessEnv;
  nodeVersion?: string;
  execArgv?: readonly string[];
};

/** Node's fetch can read the proxy variables from 24.0.0 and 22.21.0 (docs: NODE_USE_ENV_PROXY). */
export function fetchCanUseEnvProxy(nodeVersion: string): boolean {
  // `process.versions.node` has no "v"; `process.version` does — accept both.
  const [major = 0, minor = 0] = nodeVersion.replace(/^v/, "").split(".").map(Number);
  return major >= 24 || (major === 22 && minor >= 21);
}

export function proxyHint({
  env = process.env,
  nodeVersion = process.versions.node,
  execArgv = process.execArgv,
}: Probe = {}): string | null {
  const name = PROXY_VARS.find((v) => env[v]);
  if (!name) return null;
  if (!fetchCanUseEnvProxy(nodeVersion)) {
    return (
      `${name} is set, but Node ${nodeVersion} cannot route fetch through a proxy at all — ` +
      `that arrived in Node 22.21 / 24.0. Run the same command on Node 24.`
    );
  }
  const wired =
    env.NODE_USE_ENV_PROXY === "1" ||
    /(^|\s)--use-env-proxy(\s|$)/.test(env.NODE_OPTIONS ?? "") ||
    execArgv.includes("--use-env-proxy");
  if (wired) return null;
  return (
    `${name} is set, but Node's fetch only honours it when NODE_USE_ENV_PROXY=1 is also set. ` +
    `Re-run the same command with that variable.`
  );
}
