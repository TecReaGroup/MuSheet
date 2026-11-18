import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/class-name';
import { useGoBack } from '../lib/use-go-back';
import { IconButton } from './button';
import { IconTile } from './icon-tile';

const BAND_STYLE = { score: 'band-score', setlist: 'band-setlist' };

interface EntityHeaderProps {
  kind: keyof typeof BAND_STYLE;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  /** Where the back button goes when the page was opened directly rather than navigated to. */
  backTo: string;
  actions?: ReactNode;
}

/** Detail-page header for one score or setlist: tinted band, solid icon tile, title block. */
export function EntityHeader({ kind, title, subtitle, meta, backTo, actions }: EntityHeaderProps) {
  const goBack = useGoBack(backTo);
  return (
    <header className={cn('band mb-6 flex items-center gap-3 py-4 md:py-6', BAND_STYLE[kind])}>
      <IconButton label="返回" onClick={goBack} className="-ml-2.5">
        <ChevronLeft className="size-6!" />
      </IconButton>
      <IconTile kind={kind} variant="solid" className="md:size-14" />
      <div className="min-w-0 flex-1 pl-0.5">
        <h1 className="truncate text-lg font-semibold leading-snug text-fg md:text-xl">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-[13px] text-fg-quiet">{subtitle}</p>}
        {meta && <p className="mt-0.5 truncate text-xs text-fg-subtle tabular-nums">{meta}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center [&_button]:text-fg-subtle [&_button:hover]:text-fg">{actions}</div>}
    </header>
  );
}
