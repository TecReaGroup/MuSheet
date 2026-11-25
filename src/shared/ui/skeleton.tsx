import type { ReactNode } from 'react';
import { COMMON_TEXT } from '../i18n/common-text';
import { useText } from '../i18n/text';
import { cn } from '../lib/class-name';

/** Pulsing placeholder; size and radius come from `className`. A span, so it fits inside inline parents too. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn('block animate-pulse rounded-tag bg-muted', className)} />;
}

/** Wraps a loading layout: announces it once to screen readers and fades in late so quick loads never flash. */
export function SkeletonRegion({ children, className }: { children: ReactNode; className?: string }) {
  const text = useText(COMMON_TEXT);
  return (
    <div role="status" aria-label={text.loading} className={cn('animate-skeleton-in', className)}>
      {children}
    </div>
  );
}

/** Stable keys for `count` identical skeleton rows. */
export function skeletonKeys(count: number) {
  return Array.from({ length: count }, (_, index) => index);
}
