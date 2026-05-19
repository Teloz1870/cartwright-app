export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-baseline font-sans font-semibold tracking-tight text-[1.05rem] text-cw-stone-900 dark:text-cw-stone-50 ${className}`}
    >
      cartwr
      <span className="relative inline-block">
        <span aria-hidden className="invisible">i</span>
        <span
          aria-hidden
          className="absolute inset-x-0 top-[0.1em] mx-auto h-[0.18em] w-[0.18em] rounded-full bg-cw-terracotta"
        />
        <span className="absolute inset-x-0 top-[0.35em] mx-auto h-[0.5em] w-[0.06em] bg-current" />
        <span className="sr-only">i</span>
      </span>
      ght
    </span>
  );
}
