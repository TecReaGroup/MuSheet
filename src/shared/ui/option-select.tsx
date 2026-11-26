import { Check, ChevronDown } from 'lucide-react';
import { Select } from 'radix-ui';
import { cn } from '../lib/class-name';
import { CONTROL_STYLE } from './form-field';
import { OPTION_PANEL_STYLE, OPTION_ROW_STYLE } from './option-panel-style';

interface OptionSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
}

/** Pick exactly one of a fixed list; the panel matches the trigger width and drops below it. */
export function OptionSelect({ value, onChange, options, className }: OptionSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className={cn(CONTROL_STYLE, 'group flex h-11 items-center justify-between gap-2 text-left data-[state=open]:border-focus data-[state=open]:ring-3 data-[state=open]:ring-focus/25', className)}>
        <span className="min-w-0 truncate"><Select.Value /></span>
        <Select.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-fg-subtle transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          collisionPadding={12}
          className={cn(OPTION_PANEL_STYLE, 'max-h-[min(18rem,var(--radix-select-content-available-height))] w-(--radix-select-trigger-width) origin-(--radix-select-content-transform-origin)')}
        >
          <Select.Viewport>
            {options.map(option => (
              <Select.Item key={option} value={option} className={OPTION_ROW_STYLE}>
                <Select.ItemText>{option}</Select.ItemText>
                <Select.ItemIndicator className="ml-auto">
                  <Check className="size-4 text-score" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
