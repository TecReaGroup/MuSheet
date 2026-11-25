import { LoaderCircle } from 'lucide-react';
import { COMMON_TEXT } from '../i18n/common-text';
import { useText } from '../i18n/text';
import { cn } from '../lib/class-name';

export function Spinner({ className }: { className?: string }) {
  const text = useText(COMMON_TEXT);
  return <LoaderCircle className={cn('size-5 animate-spin text-fg-subtle', className)} aria-label={text.loading} />;
}

export function PageSpinner() {
  return (
    <div className="flex justify-center py-20">
      <Spinner className="size-6" />
    </div>
  );
}
