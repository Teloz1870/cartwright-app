import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The CLI's own `--help` is a decision surface: an AI that has decided on
 * Cartwright reads it to pick flags. Measured 2026-09-06 (replay V4, a
 * WooCommerce owner, 3 runs): every run scaffolded `--profile full --template
 * generic`, two of them straight after `--help`, whose profile note read
 * "Default: website-corporate (light) / generic (full)" under a line that said
 * "generic → webshop mode" — read as "webshop ⇒ full". Nothing on a shop or a
 * WooCommerce path needs `full`. The text is pinned by reading the source:
 * index.ts runs main() on import, so it cannot be imported in a test.
 */
const src = readFileSync(join(__dirname, "index.ts"), "utf8");
const help = src.slice(src.indexOf("const HELP_TEXT"), src.indexOf("--help, -h"));

describe("--help does not imply a webshop needs --profile full", () => {
  it("names the webshop command under light, and what full is actually for", () => {
    expect(help).toMatch(/a webshop is\s+--profile light --template generic/);
    expect(help).toMatch(/full\s+= everything the engine ships — needed only for/);
    expect(help).toMatch(/does not need full/);
    expect(help).not.toMatch(/all \d+ designs/);
    expect(help).toMatch(/UCP identity-linking,\s+the Shopify/);
    expect(help).toMatch(/work under light and full alike/);
  });

  it("the file docblock says the same, so the next editor sees it", () => {
    expect(src).toContain("nothing a shop needs");
  });
});
