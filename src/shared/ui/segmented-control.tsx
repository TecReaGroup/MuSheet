import type { ReactNode } from 'react';
import { cn } from '../lib/class-name';
import { SelectionThumb } from './selection-thumb';

interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** Equal-width options (sized by the widest) so the selection thumb can slide between them. */
export function SegmentedControl<T extends string>({ value, options, onChange, label, className }: SegmentedControlProps<T>) {
  const selectedIndex = options.findIndex(option => option.value === value);
  return (
    <div role="radiogroup" aria-label={label} className={cn('relative inline-grid auto-cols-fr grid-flow-col rounded-card bg-muted p-1', className)}>
      <SelectionThumb index={selectedIndex} count={options.length} />
      {options.map(option => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex items-center justify-center gap-1.5 whitespace-nowrap rounded-tag px-3 py-1.5 text-sm font-medium transition-colors [&_svg]:size-4',
              selected ? 'text-fg' : 'text-fg-muted hover:text-fg',
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
