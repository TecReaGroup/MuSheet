import type { SVGProps } from 'react';

/** Lucide has no metronome glyph; drawn on the same 24px grid with 2px round strokes to match. */
export function MetronomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
      <path d="M9.5 3h5l4.5 18H5L9.5 3Z" />
      <path d="M12 16 17 6" />
      <path d="M7.5 16h9" />
    </svg>
  );
}
