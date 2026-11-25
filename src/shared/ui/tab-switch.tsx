import type { ReactNode } from 'react';
import { cn } from '../lib/class-name';
import { SelectionThumb } from './selection-thumb';

const ACTIVE_ICON_STYLE = {
  score: '[&_svg]:text-score',
  setlist: '[&_svg]:text-setlist',
};

interface TabOption<T extends string> {
  value: T;
  label: ReactNode;
  icon: ReactNode;
  /** Icon colour while selected, following the score/setlist semantic colours. */
  tone: keyof typeof ACTIVE_ICON_STYLE;
}

interface TabSwitchProps<T extends string> {
  value: T;
  options: TabOption<T>[];
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** Equal-width tabs on a sunken track for switching the top-level collection (library scores / setlists). */
export function TabSwitch<T extends string>({ value, options, onChange, label, className }: TabSwitchProps<T>) {
  const selectedIndex = options.findIndex(option => option.value === value);
  return (
    <div role="tablist" aria-label={label} className={cn('relative flex rounded-card bg-muted p-1', className)}>
      <SelectionThumb index={selectedIndex} count={options.length} />
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
              'relative flex h-9 flex-1 items-center justify-center gap-2 rounded-tag text-body font-medium transition-colors [&_svg]:size-[18px] [&_svg]:transition-colors',
              selected ? cn('text-fg', ACTIVE_ICON_STYLE[option.tone]) : 'text-fg-muted hover:text-fg',
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
