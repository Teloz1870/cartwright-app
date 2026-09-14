import { describe, expect, it } from "vitest";
import { fetchCanUseEnvProxy, proxyHint } from "./proxy-hint.js";

const PROXY = "http://user:secret@proxy.corp:3128";
const on24 = { nodeVersion: "24.13.0", execArgv: [] as string[] };

describe("proxyHint — the one line a proxy user needs after a failed template fetch", () => {
  it("says nothing when no proxy variable is set", () => {
    expect(proxyHint({ env: {}, ...on24 })).toBeNull();
  });

  it.each([
    ["NODE_USE_ENV_PROXY=1", { HTTPS_PROXY: PROXY, NODE_USE_ENV_PROXY: "1" }, []],
    ["NODE_OPTIONS=--use-env-proxy", { HTTPS_PROXY: PROXY, NODE_OPTIONS: "--max-old-space-size=4096 --use-env-proxy" }, []],
    ["node --use-env-proxy", { HTTPS_PROXY: PROXY }, ["--use-env-proxy"]],
  ])("says nothing when the proxy is already wired into Node's fetch via %s", (_, env, execArgv) => {
    expect(proxyHint({ env, nodeVersion: "24.13.0", execArgv })).toBeNull();
  });

  it("does not mistake a longer NODE_OPTIONS flag for --use-env-proxy", () => {
    const env = { HTTPS_PROXY: PROXY, NODE_OPTIONS: "--use-env-proxy-nope" };
    expect(proxyHint({ env, ...on24 })).toContain("NODE_USE_ENV_PROXY=1");
  });

  it.each(["HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"])(
    "names %s and the missing flag, without echoing the proxy URL",
    (name) => {
      const hint = proxyHint({ env: { [name]: PROXY }, ...on24 });
      expect(hint).toContain(name);
      expect(hint).toContain("NODE_USE_ENV_PROXY=1");
      expect(hint).not.toContain("secret");
      expect(hint).not.toContain("proxy.corp");
    },
  );

  it("never suggests a command — the design and Voice installers share it", () => {
    expect(proxyHint({ env: { HTTPS_PROXY: PROXY }, ...on24 })).not.toContain("npx");
  });

  it.each(["22.20.0", "23.11.0", "22.0.0"])(
    "on Node %s, where fetch cannot proxy at all, says so even when the flag is already set",
    (nodeVersion) => {
      const hint = proxyHint({ env: { HTTPS_PROXY: PROXY, NODE_USE_ENV_PROXY: "1" }, nodeVersion, execArgv: [] });
      expect(hint).toContain(`Node ${nodeVersion}`);
      expect(hint).toContain("Node 24");
      expect(hint).not.toContain("NODE_USE_ENV_PROXY=1 is also set");
      expect(hint).not.toContain("secret");
    },
  );
});

describe("fetchCanUseEnvProxy — the versions Node's docs list for NODE_USE_ENV_PROXY", () => {
  it.each([
    ["24.0.0", true],
    ["24.13.0", true],
    ["v24.13.0", true],
    ["v22.20.0", false],
    ["26.1.0", true],
    ["22.21.0", true],
    ["22.20.9", false],
    ["23.11.0", false],
    ["20.19.0", false],
  ])("%s → %s", (version, ok) => {
    expect(fetchCanUseEnvProxy(version)).toBe(ok);
  });
});
