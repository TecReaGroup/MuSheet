import type { ReactNode } from 'react';
import { cn } from '../lib/class-name';

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

export function SegmentedControl<T extends string>({ value, options, onChange, label, className }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-card bg-muted p-1', className)}>
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
              'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-tag px-3 py-1.5 text-sm font-medium transition-all [&_svg]:size-4',
              selected ? 'bg-surface text-fg shadow-sm dark:bg-surface-raised' : 'text-fg-muted hover:text-fg',
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
