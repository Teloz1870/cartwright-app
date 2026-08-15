/**
 * The Cartwright mark — a ratchet wheel.
 *
 * A ratchet, not a gear, and the distinction is the product: asymmetric teeth
 * advance one way only. An operation moves forward through a gate and is
 * recorded; it never quietly rewinds. The same geometry drives the Interlock
 * chapter on the homepage, where a pawl blocks the wheel until a human releases it.
 *
 * Generated geometry (8 teeth, open centre), not drawn by hand, so the path
 * stays clean enough for `ExtrudeGeometry` to take it into three dimensions
 * without a retopology step.
 *
 * Two decisions came from rasterising it at favicon size rather than trusting
 * the vector: the centre is open (a filled hub plus spokes turned the mark into
 * an unreadable blob at 16px), and there is no state lamp inside the wheel (any
 * centre dot closes the hole again at small sizes). Status is carried by the
 * stamps and the Interlock scene instead — the mark stays one path, one colour.
 */
const WHEEL_PATH =
  'M16 4.2L17.65 1.09L24.34 7.66L27.71 6.62L27.8 16L30.91 17.65L24.34 24.34L25.38 27.71L16 27.8L14.35 30.91L7.66 24.34L4.29 25.38L4.2 16L1.09 14.35L7.66 7.66L6.62 4.29L16 4.2ZM25.4 16A9.4 9.4 0 1 0 6.6 16A9.4 9.4 0 1 0 25.4 16Z';

export function Wheel({
  className,
  title,
}: {
  className?: string;
  /** Supply only when the mark is the sole carrier of meaning; otherwise it stays decorative. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d={WHEEL_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/** The raw path, for the favicon route and the Three.js extrusion. */
export { WHEEL_PATH };
