'use client';

import { Button } from '@/components/ui/button';
import { CheckIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';

type Tier = 'plus' | 'cloud';

type Props = {
  tier: Tier;
  ctaLabel: string;
  className?: string;
};

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function WaitlistForm({ tier, ctaLabel, className }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setStatus('submitting');
    setMessage(null);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), tier }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        setStatus('error');
        setMessage(data?.error ?? 'Something went wrong. Try again.');
        return;
      }

      setStatus('success');
      setMessage("You're on the list. Check your inbox for confirmation.");
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  }

  if (status === 'success') {
    return (
      <div
        className={className}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 rounded-md border border-cw-terracotta/40 bg-cw-terracotta/5 px-3 py-2 text-sm text-cw-stone-700 dark:text-cw-stone-200">
          <CheckIcon className="size-4 shrink-0 text-cw-terracotta" />
          <span>{message}</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@yourshop.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={status === 'submitting'}
          aria-label="Email for waitlist"
          className="h-12 flex-1 rounded-md border border-cw-stone-300 bg-white px-3 text-sm text-cw-stone-900 placeholder:text-cw-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cw-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-cw-paper dark:border-cw-stone-700 dark:bg-cw-stone-900 dark:text-cw-stone-50 dark:focus-visible:ring-offset-cw-ink"
        />
        <Button
          type="submit"
          variant="secondary"
          size="lg"
          disabled={status === 'submitting'}
          className="sm:w-auto"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Joining…
            </>
          ) : (
            ctaLabel
          )}
        </Button>
      </div>
      {status === 'error' && message && (
        <p
          className="mt-2 text-xs text-red-600 dark:text-red-400"
          role="alert"
        >
          {message}
        </p>
      )}
    </form>
  );
}
