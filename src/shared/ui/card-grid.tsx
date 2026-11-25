import type { ReactNode } from 'react';
import { cn } from '../lib/class-name';
import { ListCardSkeleton } from './list-card';
import { SkeletonRegion, skeletonKeys } from './skeleton';

const GRID_STYLE = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3';

/** Responsive grid of `ListCard`s; rises in on mount so it eases in over its skeleton. */
export function CardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(GRID_STYLE, 'animate-rise-in', className)}>{children}</div>;
}

export function CardGridSkeleton({ count }: { count: number }) {
  return (
    <SkeletonRegion className={GRID_STYLE}>
      {skeletonKeys(count).map(key => <ListCardSkeleton key={key} />)}
    </SkeletonRegion>
  );
}
