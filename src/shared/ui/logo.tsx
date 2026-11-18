import appIconUrl from '../asset/brand/app-icon.png';
import { cn } from '../lib/class-name';

/** "MuSheet" in the brand face with the blue → teal → emerald sweep used on splash and home. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-block bg-linear-to-r from-brand-from via-brand-via to-brand-to bg-clip-text pb-0.5 font-brand text-[36px] leading-none text-transparent', className)}>
      MuSheet
    </span>
  );
}

/** App icon tile; the artwork has its own white field, so it reads as an icon in both themes. */
export function AppIcon({ className }: { className?: string }) {
  return (
    <img
      src={appIconUrl}
      alt=""
      className={cn('size-10 shrink-0 rounded-[22%] bg-white shadow-[0_4px_20px_rgb(0_0_0/0.10)] ring-1 ring-black/5', className)}
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <AppIcon className="size-9" />
      <Wordmark className="text-[28px]" />
    </span>
  );
}
