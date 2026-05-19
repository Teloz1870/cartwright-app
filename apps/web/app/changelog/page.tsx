import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { gitConfig } from '@/lib/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog',
  description:
    'Release history of the Cartwright template, fetched from cartwright/CHANGELOG.md.',
};

const RAW_URL = `https://raw.githubusercontent.com/${gitConfig.user}/cartwright-template/main/CHANGELOG.md`;

async function fetchChangelog(): Promise<{ md: string; status: 'ok' | 'missing' | 'error'; error?: string }> {
  try {
    const res = await fetch(RAW_URL, {
      next: { revalidate: 600 },
    });
    if (res.status === 404) {
      return { md: '', status: 'missing' };
    }
    if (!res.ok) {
      return {
        md: '',
        status: 'error',
        error: `HTTP ${res.status}`,
      };
    }
    const md = await res.text();
    return { md, status: 'ok' };
  } catch (err) {
    return {
      md: '',
      status: 'error',
      error: (err as Error).message,
    };
  }
}

export default async function ChangelogPage() {
  const { md, status, error } = await fetchChangelog();

  return (
    <HomeLayout {...baseOptions()}>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <header className="border-b border-cw-stone-200 dark:border-cw-stone-800 pb-8 mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
            Releases
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
            Changelog
          </h1>
          <p className="mt-4 text-cw-stone-500 dark:text-cw-stone-400">
            Mirrored from the cartwright template's <code>CHANGELOG.md</code>. Rebuilds every 10 minutes.
          </p>
        </header>

        {status === 'ok' && (
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-cw-stone-700 dark:text-cw-stone-300">
            {md}
          </pre>
        )}

        {status === 'missing' && (
          <div className="rounded-lg border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50 dark:bg-cw-stone-900/40 p-6">
            <p className="text-cw-stone-700 dark:text-cw-stone-300">
              No <code>CHANGELOG.md</code> yet on the public mirror. The first
              tagged release of the cartwright template will populate this page.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-6">
            <p className="text-red-800 dark:text-red-200">
              Could not fetch the changelog right now ({error}). Try refreshing
              shortly.
            </p>
          </div>
        )}
      </main>
    </HomeLayout>
  );
}
