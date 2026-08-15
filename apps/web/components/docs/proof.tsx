import type { ReactNode } from 'react';

/**
 * Documentation components that make the docs demonstrate Trusted Operation
 * rather than describe it.
 *
 * The claim on the marketing side is that every tool declares a scope, that
 * writes stop for a person, and that what happens is recorded and reversible.
 * A docs page that says so in prose is a promise; a page where every operation
 * carries its scope, its confirmation rule and its audit event in a fixed
 * shape is the thing itself — and a missing field becomes visibly missing
 * rather than quietly absent.
 *
 * They are deliberately plain: square, ruled, no cards, no icons. Docs should
 * be more technical than the marketing pages, not more theatrical.
 */

type StampState = 'read' | 'write' | 'confirm' | 'experimental' | 'audited';

const STAMP_STATE: Record<StampState, string | undefined> = {
  read: undefined,
  write: 'action',
  confirm: 'pending',
  experimental: 'blocked',
  audited: 'verified',
};

/**
 * `READ` / `WRITE` / `CONFIRM` / `EXPERIMENTAL` / `AUDITED`.
 * Inline, so it can sit in a heading or a table cell.
 */
export function StatusStamp({ kind }: { kind: StampState }) {
  return (
    <span className="cw-stamp align-middle" data-state={STAMP_STATE[kind]}>
      {kind}
    </span>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-t border-cw-rule py-3 first:border-t-0 sm:flex-row sm:gap-6">
      <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-cw-muted sm:w-44 sm:shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-cw-fg">{children}</dd>
    </div>
  );
}

/**
 * One agent-callable operation, stated in full.
 *
 * If a tool has no confirmation rule, say `none` and say why — an empty field
 * reads as an oversight, which is the point.
 */
export function OperationContract({
  tool,
  scope,
  input,
  confirmation,
  audit,
  children,
}: {
  tool: string;
  scope: string;
  input?: string;
  confirmation: string;
  audit: string;
  children?: ReactNode;
}) {
  return (
    <dl className="my-6 border border-cw-rule px-5 py-4 not-prose">
      <Row label="tool">
        <code className="font-mono text-xs text-cw-action">{tool}</code>
      </Row>
      <Row label="scope required">
        <code className="font-mono text-xs">{scope}</code>
      </Row>
      {input && <Row label="input">{input}</Row>}
      <Row label="confirmation">{confirmation}</Row>
      <Row label="audit event">
        <code className="font-mono text-xs">{audit}</code>
      </Row>
      {children && <Row label="notes">{children}</Row>}
    </dl>
  );
}

/** An HTTP surface, with the two things people get wrong: auth and replay. */
export function Endpoint({
  method,
  path,
  auth,
  idempotency,
  gatedBy,
}: {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'OPTIONS';
  path: string;
  auth: string;
  idempotency?: string;
  gatedBy?: string;
}) {
  return (
    <dl className="my-6 border border-cw-rule px-5 py-4 not-prose">
      <Row label="endpoint">
        <code className="font-mono text-xs">
          <span className="text-cw-action">{method}</span> {path}
        </code>
      </Row>
      <Row label="authentication">{auth}</Row>
      {gatedBy && (
        <Row label="feature flag">
          <code className="font-mono text-xs">{gatedBy}</code> — answers 404 when off,
          the way an absent path does
        </Row>
      )}
      {idempotency && <Row label="replay">{idempotency}</Row>}
    </dl>
  );
}

/**
 * What the operator keeps. Exit freedom is the one claim a hosted competitor
 * structurally cannot copy, so it is worth stating as a receipt wherever a
 * page touches ownership — not only in the footer.
 */
export function ExitProof({ items }: { items: [string, string][] }) {
  return (
    <dl className="my-6 border border-cw-rule px-5 py-4 font-mono text-xs not-prose">
      {items.map(([k, v]) => (
        <div
          key={k}
          className="flex items-baseline justify-between gap-4 border-t border-cw-rule py-2.5 first:border-t-0"
        >
          <dt className="uppercase tracking-[0.14em] text-cw-muted">{k}</dt>
          <dd className="text-right text-cw-fg">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
