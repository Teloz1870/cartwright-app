import { Fragment } from 'react';
import { INSTALL_COMMAND_SITE } from '@/lib/home-copy';

/**
 * The plain-website command as inline, wrapping code — never a CopyCommand
 * (that clamps to one line and cut `--profile site` off at 390 px) and never
 * `break-all` (which broke the flag into `--p / rofile`). Each token is
 * unbreakable; the line breaks only between tokens, so a phone shows
 * `npx create-cartwright@latest my-site` / `--profile site`. The rendered
 * text is exactly INSTALL_COMMAND_SITE, which keeps the FAQ's JSON-LD twin in
 * parity with what the visitor reads.
 */
export function SiteCommand({ className = '' }: { className?: string }) {
  const tokens = INSTALL_COMMAND_SITE.split(' ');
  return (
    <code className={`font-mono break-words ${className}`.trim()}>
      {tokens.map((token, i) => (
        <Fragment key={token}>
          {i > 0 ? ' ' : null}
          <span className="whitespace-nowrap">{token}</span>
        </Fragment>
      ))}
    </code>
  );
}
