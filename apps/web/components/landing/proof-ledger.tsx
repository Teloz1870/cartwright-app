import Link from 'next/link';
import { Station } from '@/components/landing/station';
import { ENGINE_FACTS } from '@/lib/engine-facts';

/**
 * One dense evidence table, replacing eleven agent cards and nine feature cards.
 *
 * Mapping arrays of claims onto identically-weighted rounded cards is the
 * disease every dev-tool site has: it gives MCP discovery, deterministic
 * negotiation, escrow and OAuth the same rectangular importance because that is
 * what is cheap to build. A ledger says the opposite — these are entries, they
 * have columns, and each one is answerable.
 *
 * Every count comes from `lib/engine-facts.ts`. Nothing here is typed twice.
 */
const ROWS = [
  {
    surface: 'AI admin',
    proof: `${ENGINE_FACTS.adminToolCount} allowlisted tools`,
    guardrail: `${ENGINE_FACTS.confirmGatedCount} require confirmation · every call audited`,
    meaning: 'The machine cannot silently alter the shop.',
    href: '/security',
  },
  {
    surface: 'MCP',
    proof: `${ENGINE_FACTS.toolCount} tools · ${ENGINE_FACTS.scopeCount} scopes`,
    guardrail: 'Hashed keys, expiry, per-tool scope checks',
    meaning: 'Your agent can operate the shop, not merely talk about it.',
    href: '/docs/architecture/mcp-server',
  },
  {
    surface: 'ACP',
    proof: 'Checkout sessions + product feed',
    guardrail: 'Deterministic totals, idempotent completion',
    meaning: 'Buyer agents can complete real commerce.',
    href: '/docs/features/agentic-commerce-protocol',
  },
  {
    surface: 'Discovery',
    proof: '/llms.txt + JSON-LD',
    guardrail: 'Generated from shop data, never hand-written',
    meaning: 'Machines understand the store without scraping it.',
    href: '/docs/features/agent-optimization',
  },
  {
    surface: 'Voice',
    proof: 'Gemini Live, server-dispatched tools',
    guardrail: 'Ephemeral tokens · session and daily caps',
    meaning: 'Customers can shop by speaking, under the same gates.',
    href: '/docs/ai/voice-shop',
  },
  {
    surface: 'Local AI',
    proof: 'Ollama provider',
    guardrail: 'Capability-tiered per model; unknown models read-only',
    meaning: 'Sensitive workflows need not leave the machine.',
    href: '/docs/features/local-ai-ollama',
  },
];

export function ProofLedger() {
  return (
    <Station
      index="03"
      label="Receipts"
      id="s03"
      title="Every claim has a receipt."
    >
      <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[54rem] border-collapse text-left">
            <thead>
              <tr className="border-y border-cw-rule">
                {['Surface', 'Shipping proof', 'Guardrail', 'What it means for you'].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="py-3 pr-8 font-mono text-[0.6875rem] font-normal uppercase tracking-[0.14em] text-cw-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.surface} className="border-b border-cw-rule align-baseline">
                  <th scope="row" className="py-5 pr-8 text-sm font-medium text-cw-fg">
                    <Link href={r.href} className="underline-offset-4 hover:underline">
                      {r.surface}
                    </Link>
                  </th>
                  <td className="py-5 pr-8 font-mono text-xs text-cw-action">{r.proof}</td>
                  <td className="py-5 pr-8 text-sm text-cw-muted">{r.guardrail}</td>
                  <td className="py-5 text-sm text-cw-fg">{r.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </Station>
  );
}
