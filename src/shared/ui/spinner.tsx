import { LoaderCircle } from 'lucide-react';
import { cn } from '../lib/class-name';

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn('size-5 animate-spin text-fg-subtle', className)} aria-label="加载中" />;
}

export function PageSpinner() {
  return (
    <div className="flex justify-center py-20">
      <Spinner className="size-6" />
    </div>
  );
}
