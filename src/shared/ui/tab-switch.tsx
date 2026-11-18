import type { ReactNode } from 'react';
import { cn } from '../lib/class-name';

const ACTIVE_STYLE = {
  score: 'bg-score text-white dark:text-zinc-950',
  setlist: 'bg-setlist text-white dark:text-zinc-950',
};

interface TabOption<T extends string> {
  value: T;
  label: ReactNode;
  icon: ReactNode;
  /** Colour of the tab while selected, following the score/setlist semantic colours. */
  tone: keyof typeof ACTIVE_STYLE;
}

interface TabSwitchProps<T extends string> {
  value: T;
  options: TabOption<T>[];
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** Equal-width coloured tabs for switching the top-level collection (library scores / setlists). */
export function TabSwitch<T extends string>({ value, options, onChange, label, className }: TabSwitchProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn('flex gap-2', className)}>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex h-10 flex-1 items-center justify-center gap-2 rounded-tag text-[15px] font-medium transition-colors [&_svg]:size-[18px]',
              selected ? ACTIVE_STYLE[option.tone] : 'bg-muted text-fg-muted hover:text-fg',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
