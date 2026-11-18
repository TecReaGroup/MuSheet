import { cn } from '../lib/class-name';

/** Gradient wordmark rendered with the UI font, so no extra display font is downloaded. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('bg-gradient-to-r from-score to-setlist bg-clip-text text-[28px] font-extrabold tracking-[-0.03em] text-transparent', className)}>
      MuSheet
    </span>
  );
}
