import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { COMMON_TEXT } from '../i18n/common-text';
import { useText } from '../i18n/text';
import { useGoBack } from '../lib/use-go-back';
import { Button } from './button';
import { IconTile } from './icon-tile';

interface EntityHeaderProps {
  kind: 'score' | 'setlist';
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  /** Where the back button goes when the page was opened directly rather than navigated to. */
  backTo: string;
  actions?: ReactNode;
}

/** Detail-page header for one score or setlist: back link, solid icon tile, title block. */
export function EntityHeader({ kind, title, subtitle, meta, backTo, actions }: EntityHeaderProps) {
  const goBack = useGoBack(backTo);
  const text = useText(COMMON_TEXT);
  return (
    <header className="mb-6 pt-[calc(0.75rem+env(safe-area-inset-top))] md:pt-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={goBack} className="-ml-2 gap-1 pl-1.5 text-fg-quiet">
          <ChevronLeft className="size-5!" />
          {text.back}
        </Button>
        {actions && <div className="-mr-2 flex shrink-0 items-center [&_button]:text-fg-quiet [&_button:hover]:text-fg">{actions}</div>}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <IconTile kind={kind} variant="solid" className="size-14 md:size-16" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold leading-snug tracking-tight text-fg-title md:text-[26px]">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-sm text-fg-muted">{subtitle}</p>}
          {meta && <p className="mt-1 truncate text-xs text-fg-quiet tabular-nums">{meta}</p>}
        </div>
      </div>
    </header>
  );
}
