'use client';

import { Button } from '@/components/ui/button';
import { CheckIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';

const SUBJECT_OPTIONS = [
  { value: 'setup-help', label: 'Setup help' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'press', label: 'Press' },
  { value: 'security', label: 'Security disclosure' },
  { value: 'other', label: 'Other' },
] as const;

type Subject = (typeof SUBJECT_OPTIONS)[number]['value'];

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function ContactForm({ className }: { className?: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<Subject>('setup-help');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || message.trim().length < 10) return;

    setStatus('submitting');
    setErrorText(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject,
          message: message.trim(),
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        setStatus('error');
        setErrorText(data?.error ?? 'Something went wrong. Try again.');
        return;
      }

      setStatus('success');
    } catch {
      setStatus('error');
      setErrorText('Network error. Try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className={className} role="status" aria-live="polite">
        <div className="flex items-start gap-3 rounded-md border border-cw-terracotta/40 bg-cw-terracotta/5 px-4 py-3 text-sm text-cw-stone-700 dark:text-cw-stone-200">
          <CheckIcon className="size-5 shrink-0 text-cw-terracotta" />
          <div>
            <p className="font-medium">Message sent — thanks {name}.</p>
            <p className="mt-1 text-cw-stone-500 dark:text-cw-stone-400">
              We&apos;ll get back within 48 hours, usually faster. Check your inbox
              for the confirmation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const baseInputClass =
    'rounded-md border border-cw-stone-300 bg-white px-3 text-sm text-cw-stone-900 placeholder:text-cw-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cw-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-cw-paper dark:border-cw-stone-700 dark:bg-cw-stone-900 dark:text-cw-stone-50 dark:focus-visible:ring-offset-cw-ink';

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      <div className="grid gap-4">
        <div>
          <label
            htmlFor="contact-name"
            className="block text-xs font-medium text-cw-stone-700 dark:text-cw-stone-300 mb-1.5"
          >
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={status === 'submitting'}
            className={`${baseInputClass} h-12 w-full`}
          />
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="block text-xs font-medium text-cw-stone-700 dark:text-cw-stone-300 mb-1.5"
          >
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@yourshop.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'submitting'}
            className={`${baseInputClass} h-12 w-full`}
          />
        </div>

        <div>
          <label
            htmlFor="contact-subject"
            className="block text-xs font-medium text-cw-stone-700 dark:text-cw-stone-300 mb-1.5"
          >
            What&apos;s this about?
          </label>
          <select
            id="contact-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value as Subject)}
            disabled={status === 'submitting'}
            className={`${baseInputClass} h-12 w-full`}
          >
            {SUBJECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="contact-message"
            className="block text-xs font-medium text-cw-stone-700 dark:text-cw-stone-300 mb-1.5"
          >
            Message
          </label>
          <textarea
            id="contact-message"
            required
            minLength={10}
            maxLength={4000}
            placeholder="Tell us what's on your mind. The more context, the faster we can help."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={status === 'submitting'}
            rows={6}
            className={`${baseInputClass} w-full py-3 resize-y`}
          />
          <p className="mt-1 text-xs text-cw-stone-500 dark:text-cw-stone-400">
            {message.length} / 4000
          </p>
        </div>

        <Button
          type="submit"
          variant="secondary"
          size="lg"
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending…
            </>
          ) : (
            'Send message'
          )}
        </Button>

        <p className="text-xs text-cw-stone-500 dark:text-cw-stone-400">
          By submitting you agree to our{' '}
          <a href="/legal/privacy" className="text-cw-terracotta hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>

      {status === 'error' && errorText && (
        <p
          className="mt-3 text-xs text-red-600 dark:text-red-400"
          role="alert"
        >
          {errorText}
        </p>
      )}
    </form>
  );
}
