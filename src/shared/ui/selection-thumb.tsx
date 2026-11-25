/**
 * Sliding highlight behind the selected option of an equal-width, `p-1` padded track.
 * Equal widths let it move by whole multiples of its own width without measuring the DOM.
 */
export function SelectionThumb({ index, count }: { index: number; count: number }) {
  return (
    <span
      aria-hidden
      className="absolute inset-y-1 left-1 rounded-tag bg-surface transition-transform duration-300 ease-out-quart dark:bg-surface-raised"
      style={{ width: `calc((100% - 0.5rem) / ${count})`, transform: `translateX(${index * 100}%)` }}
    />
  );
}
