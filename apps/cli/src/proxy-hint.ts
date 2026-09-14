/**
 * giget 3 downloads the template with Node's own `fetch`, which ignores
 * HTTP_PROXY / HTTPS_PROXY unless the process was started with
 * NODE_USE_ENV_PROXY=1 (Node 24+). giget 1 honoured those variables itself,
 * so a proxy user who upgrades would see "Template fetch failed" with no clue.
 * Say the one thing they need, only when it applies — and never echo the
 * proxy URL, which routinely carries credentials.
 */
const PROXY_VARS = ["HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"] as const;

export function proxyHint(env: NodeJS.ProcessEnv = process.env): string | null {
  const name = PROXY_VARS.find((v) => env[v]);
  if (!name || env.NODE_USE_ENV_PROXY === "1") return null;
  return (
    `${name} is set, but Node's fetch only honours it when NODE_USE_ENV_PROXY=1 is also set ` +
    `(Node 24+). Re-run with: NODE_USE_ENV_PROXY=1 npx create-cartwright@latest …`
  );
}
