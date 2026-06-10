import type { SVGProps } from 'react';

/**
 * The X (formerly Twitter) wordmark glyph as an inline SVG — the plain
 * geometric letterform, drawn in `currentColor` so it inherits the
 * surrounding link/icon color in both light and dark mode.
 *
 * Size it with a className (e.g. `size-4`) like the lucide icons used
 * elsewhere in the nav and footer.
 */
export function XLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}
