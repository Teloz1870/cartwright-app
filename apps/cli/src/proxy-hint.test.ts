import { describe, expect, it } from "vitest";
import { proxyHint } from "./proxy-hint.js";

describe("proxyHint — the one line a proxy user needs after a failed template fetch", () => {
  it("says nothing when no proxy variable is set", () => {
    expect(proxyHint({})).toBeNull();
  });

  it("says nothing when the proxy is already wired into Node's fetch", () => {
    expect(proxyHint({ HTTPS_PROXY: "http://proxy.corp:3128", NODE_USE_ENV_PROXY: "1" })).toBeNull();
  });

  it.each(["HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"])(
    "names %s and the missing flag, without echoing the proxy URL",
    (name) => {
      const hint = proxyHint({ [name]: "http://user:secret@proxy.corp:3128" });
      expect(hint).toContain(name);
      expect(hint).toContain("NODE_USE_ENV_PROXY=1");
      expect(hint).not.toContain("secret");
      expect(hint).not.toContain("proxy.corp");
    },
  );
});
