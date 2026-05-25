"use client";

import { useState, useTransition } from "react";
import {
  setInboxVendorAction,
  verifyEmailDnsAction,
} from "./actions";
import {
  buildExpectedRecords,
  INBOX_VENDOR_LABELS,
  type DnsRecordGroup,
  type InboxVendor,
} from "@/lib/email/dns-records";
import type { DnsCheckResult, DnsCheckStatus } from "@/lib/email/dns-verify";

type Props = {
  initialDomain: string | null;
  initialInboxVendor: string | null;
  initialEmailFrom: string;
  initialEmailFromName: string;
};

const INBOX_VENDOR_OPTIONS: Array<{ value: ""; label: string } | { value: InboxVendor; label: string }> = [
  { value: "", label: "— Ikke valgt —" },
  { value: "cloudflare", label: INBOX_VENDOR_LABELS.cloudflare },
  { value: "improvmx", label: INBOX_VENDOR_LABELS.improvmx },
  { value: "zoho", label: INBOX_VENDOR_LABELS.zoho },
  { value: "m365", label: INBOX_VENDOR_LABELS.m365 },
];

const STATUS_CLASSES: Record<DnsCheckStatus, string> = {
  ok: "bg-green-100 text-green-800",
  missing: "bg-amber-100 text-amber-900",
  mismatch: "bg-red-100 text-red-800",
  skipped: "bg-sol-cream text-sol-muted",
  error: "bg-orange-100 text-orange-900",
};

const STATUS_LABEL: Record<DnsCheckStatus, string> = {
  ok: "OK",
  missing: "Mangler",
  mismatch: "Forkert",
  skipped: "Springet over",
  error: "Fejl",
};

export default function EmailDomainPanel({
  initialDomain,
  initialInboxVendor,
  initialEmailFrom,
  initialEmailFromName,
}: Props) {
  const [vendor, setVendor] = useState<InboxVendor | "">(
    isInboxVendor(initialInboxVendor) ? initialInboxVendor : "",
  );
  const [savingVendor, startVendorTransition] = useTransition();
  const [verifying, startVerifyTransition] = useTransition();
  const [verifyResult, setVerifyResult] = useState<
    | { domain: string; checks: DnsCheckResult[]; verifiedAt: Date }
    | { error: string }
    | null
  >(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const recordGroups: DnsRecordGroup[] = initialDomain
    ? buildExpectedRecords({
        domain: initialDomain,
        inboxVendor: vendor || null,
      })
    : [];

  function handleVendorChange(next: string) {
    const previousValue = vendor;
    const nextValue = isInboxVendor(next) ? next : "";
    setVendor(nextValue);
    startVendorTransition(async () => {
      const result = await setInboxVendorAction(nextValue);
      if (!result.ok) {
        // Rul tilbage hvis server-action fejlede
        setVendor(previousValue);
        alert(result.error);
      }
    });
  }

  function handleVerify() {
    setVerifyResult(null);
    startVerifyTransition(async () => {
      const result = await verifyEmailDnsAction();
      if (result.ok) {
        setVerifyResult({
          domain: result.domain,
          checks: result.checks,
          verifiedAt: new Date(),
        });
      } else {
        setVerifyResult({ error: result.error });
      }
    });
  }

  async function copyValue(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1500);
    } catch {
      // ignore — clipboard kan være blokeret (fx iframe uden permissions)
    }
  }

  return (
    <section className="rounded-2xl border border-sol-ink/10 bg-white p-6 shadow-sm">
      <header className="mb-5">
        <h2 className="text-lg font-black text-sol-ink">Email-domæne & DNS</h2>
        <p className="mt-1 text-sm text-sol-muted">
          Vælg din indbakke-løsning, kopier de præcise DNS-records til din DNS-udbyder, og kør verify når du har gemt dem. Komplet baggrund:{" "}
          <a
            href="https://cartwright.app/docs/email"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-sol-accent underline"
          >
            cartwright.app/docs/email
          </a>
          .
        </p>
      </header>

      {/* Status-summary: hvad er sat i dag */}
      <div className="mb-5 grid gap-2 rounded-lg border border-sol-ink/10 bg-sol-cream/40 p-4 text-sm md:grid-cols-2">
        <div>
          <span className="block text-[10px] font-black uppercase tracking-widest text-sol-muted">Domæne</span>
          <span className="font-mono font-bold text-sol-ink">
            {initialDomain ?? "(ikke sat — sæt i /admin/setup)"}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-black uppercase tracking-widest text-sol-muted">Afsender</span>
          <span className="font-mono font-bold text-sol-ink">
            {initialEmailFromName
              ? `${initialEmailFromName} <${initialEmailFrom || "(brand.config)"}>`
              : initialEmailFrom || "(brand.config default)"}
          </span>
        </div>
      </div>

      {/* Vendor-selector */}
      <div className="mb-5">
        <label htmlFor="inboxVendor" className="mb-1 block text-xs font-black uppercase tracking-widest text-sol-muted">
          Indbakke-løsning
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            id="inboxVendor"
            value={vendor}
            onChange={(e) => handleVendorChange(e.target.value)}
            disabled={savingVendor}
            className="rounded-lg border border-sol-ink/15 bg-white px-3 py-2 text-sm font-semibold text-sol-ink focus:border-sol-accent focus:outline-none focus:ring-2 focus:ring-sol-accent/25 disabled:opacity-60"
          >
            {INBOX_VENDOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {savingVendor && <span className="text-xs text-sol-muted">Gemmer…</span>}
        </div>
      </div>

      {/* Record-grupper */}
      {!initialDomain ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
          Sæt dit domæne i /admin/setup før du kan se DNS-records.
        </p>
      ) : (
        <div className="space-y-4">
          {recordGroups.map((group, gi) => (
            <details key={group.title} open={gi < 2}>
              <summary className="cursor-pointer rounded-lg bg-sol-cream/50 px-3 py-2 text-sm font-black text-sol-ink hover:bg-sol-cream">
                {group.title}
              </summary>
              {group.description && (
                <p className="mt-2 px-3 text-xs text-sol-muted">{group.description}</p>
              )}
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[640px] border-separate border-spacing-0 text-xs">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-sol-muted">
                      <th className="border-b border-sol-ink/10 px-2 py-1.5">Type</th>
                      <th className="border-b border-sol-ink/10 px-2 py-1.5">Host</th>
                      <th className="border-b border-sol-ink/10 px-2 py-1.5">Værdi</th>
                      <th className="border-b border-sol-ink/10 px-2 py-1.5 text-right">Pri</th>
                      <th className="border-b border-sol-ink/10 px-2 py-1.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.records.map((rec, ri) => {
                      const key = `${gi}-${ri}`;
                      return (
                        <tr key={key} className="align-top">
                          <td className="border-b border-sol-ink/5 px-2 py-2 font-mono font-bold text-sol-ink">
                            {rec.type}
                          </td>
                          <td className="border-b border-sol-ink/5 px-2 py-2 font-mono text-sol-ink">
                            {rec.host}
                          </td>
                          <td className="border-b border-sol-ink/5 px-2 py-2">
                            <code className="block break-all font-mono text-sol-ink">
                              {rec.value}
                            </code>
                            {rec.note && (
                              <p className="mt-1 text-[11px] italic text-sol-muted">
                                {rec.note}
                              </p>
                            )}
                          </td>
                          <td className="border-b border-sol-ink/5 px-2 py-2 text-right font-mono text-sol-muted">
                            {rec.priority ?? "—"}
                          </td>
                          <td className="border-b border-sol-ink/5 px-2 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => copyValue(key, rec.value)}
                              className="rounded-full border border-sol-ink/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-sol-muted hover:bg-sol-accent hover:text-white hover:border-sol-accent"
                            >
                              {copiedKey === key ? "Kopieret" : "Kopier"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      )}

      {/* Verify-knap + resultater */}
      <div className="mt-6 border-t border-sol-ink/10 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-sol-ink">
              Verificér DNS
            </h3>
            <p className="mt-1 text-xs text-sol-muted">
              Spørger public DNS hvad der faktisk er live. Nye records kan tage
              5-30 min før de bliver synlige.
            </p>
          </div>
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || !initialDomain}
            className="rounded-full bg-sol-accent px-5 py-2 text-sm font-black uppercase tracking-wider text-white transition hover:bg-sol-accent/90 disabled:opacity-50"
          >
            {verifying ? "Tjekker…" : "Verificér nu"}
          </button>
        </div>

        {verifyResult && "error" in verifyResult && (
          <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
            {verifyResult.error}
          </p>
        )}

        {verifyResult && "checks" in verifyResult && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-sol-muted">
              Verificeret for <strong className="font-bold text-sol-ink">{verifyResult.domain}</strong> kl.{" "}
              {verifyResult.verifiedAt.toLocaleTimeString("da-DK")}
            </p>
            <ul className="divide-y divide-sol-ink/5 rounded-lg border border-sol-ink/10">
              {verifyResult.checks.map((check) => (
                <li key={check.id} className="grid gap-1 px-3 py-2 md:grid-cols-[auto_1fr_auto]">
                  <span
                    className={`inline-flex h-fit shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${STATUS_CLASSES[check.status]}`}
                  >
                    {STATUS_LABEL[check.status]}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-sol-ink">{check.label}</div>
                    <div className="text-[11px] text-sol-muted">{check.expectedHint}</div>
                    {check.detail && (
                      <div className="mt-1 text-[11px] font-bold text-orange-900">
                        ⚠ {check.detail}
                      </div>
                    )}
                    {check.found && check.found.length > 0 && (
                      <details className="mt-1 text-[11px] text-sol-muted">
                        <summary className="cursor-pointer">Fundet i DNS</summary>
                        <ul className="mt-1 list-disc space-y-0.5 pl-4 font-mono">
                          {check.found.map((value, i) => (
                            <li key={i} className="break-all">{value}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function isInboxVendor(v: string | null | undefined): v is InboxVendor {
  return v === "cloudflare" || v === "improvmx" || v === "zoho" || v === "m365";
}
