'use client';

import { useMemo, useState } from 'react';

const REPO = 'Teloz1870/cartwright-template';

/** Lightweight client-side sanity check (the real validation is the maintainer
 *  review / CI parseDesignMd). */
function inspect(md: string): { ok: boolean; slug?: string; issues: string[] } {
  const issues: string[] = [];
  if (!md.trim()) return { ok: false, issues: ['Paste your design.md above.'] };
  if (!/cartwright-design-v1/.test(md)) issues.push('Missing `schema: cartwright-design-v1`');
  const slugM = md.match(/slug:\s*["']?([a-z0-9][a-z0-9-]*)["']?/);
  if (!slugM) issues.push('Missing a kebab-case `slug:`');
  if (!/tokens:/.test(md)) issues.push('Missing `tokens:` (palette)');
  if (!/sections:/.test(md)) issues.push('Missing `sections:`');
  return { ok: issues.length === 0, slug: slugM?.[1], issues };
}

export function SubmitForm() {
  const [md, setMd] = useState('');
  const [owns, setOwns] = useState(false);

  const result = useMemo(() => inspect(md), [md]);
  const ready = result.ok && owns;

  function submit() {
    if (!ready) return;
    const title = `[Design] ${result.slug ?? 'community submission'}`;
    const body = [
      '<!-- Community design submission for the Cartwright marketplace -->',
      '',
      '### design.md',
      '',
      '```md',
      md.trim(),
      '```',
      '',
      '### Affirmation',
      '- [x] I own this design, or it is MIT-licensed and I have the right to contribute it.',
      '',
      '_Submitted via cartwright.app/designs/submit_',
    ].join('\n');
    const url = `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=${encodeURIComponent('design-submission')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor="designmd" className="mb-2 block text-sm font-medium text-cw-stone-700 dark:text-cw-stone-300">
          Your <code className="font-mono">design.md</code>
        </label>
        <textarea
          id="designmd"
          value={md}
          onChange={(e) => setMd(e.target.value)}
          rows={12}
          placeholder={'---\nschema: cartwright-design-v1\nslug: my-design\nname: My Design\nmode: website\ntokens:\n  prefix: myd\n  palette: { accent: "#…", … }\nsections:\n  - type: hero\n    …\n---'}
          className="w-full rounded-xl border border-cw-stone-200 bg-white px-4 py-3 font-mono text-[13px] leading-relaxed text-cw-stone-900 outline-none focus-visible:border-cw-terracotta dark:border-cw-stone-700 dark:bg-cw-stone-900 dark:text-cw-stone-50"
        />
      </div>

      {/* live validation */}
      {md.trim() && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            result.ok
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'
          }`}
        >
          {result.ok ? (
            <>✓ Looks like a valid cartwright-design-v1 design{result.slug ? <> — <code className="font-mono">{result.slug}</code></> : null}.</>
          ) : (
            <ul className="list-inside list-disc space-y-0.5">
              {result.issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <label className="flex items-start gap-3 text-sm text-cw-stone-600 dark:text-cw-stone-300">
        <input
          type="checkbox"
          checked={owns}
          onChange={(e) => setOwns(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-cw-terracotta"
        />
        <span>
          I own this design, or it is MIT-licensed and I have the right to contribute it.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={!ready}
          className="rounded-full bg-cw-terracotta px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Submit on GitHub →
        </button>
        <span className="text-sm text-cw-stone-400">
          Opens a pre-filled issue — review &amp; submit from your GitHub account. No account needed here.
        </span>
      </div>

      <p className="text-xs text-cw-stone-400">
        Tip: if your design.md is very long it may be trimmed in the URL — just paste the rest into the GitHub issue after it opens.
      </p>
    </div>
  );
}
