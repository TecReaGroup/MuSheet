import { Check, ChevronDown } from 'lucide-react';
import { Popover } from 'radix-ui';
import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type KeyboardEvent } from 'react';
import { COMMON_TEXT } from '../i18n/common-text';
import { useText } from '../i18n/text';
import { cn } from '../lib/class-name';
import { TextInput } from './form-field';
import { OPTION_PANEL_STYLE, OPTION_ROW_STYLE } from './option-panel-style';

export interface Suggestion {
  value: string;
  meta?: string;
}

type SuggestionInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  suggestions: Suggestion[];
  /** Called after `onChange` when a suggestion is picked from the list, not when it is typed. */
  onPick?: (suggestion: Suggestion) => void;
  /** The suggestion currently in effect, for when that depends on more than this input's text. */
  selectedValue?: string;
};

/**
 * Free-text input that offers existing values: opening lists them all, typing narrows them,
 * and a value matching none of them is flagged as new.
 * NOTE: The panel is not portalled. Inside a modal Dialog, a portalled panel sits outside the
 * dialog's scroll lock and could not be wheel-scrolled.
 */
export function SuggestionInput({ value, onChange, suggestions, onPick, selectedValue = value, className, ...inputProps }: SuggestionInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState('');
  const [highlight, setHighlight] = useState(0);
  const anchorRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const text = useText(COMMON_TEXT);

  const needle = filter.trim().toLowerCase();
  const options = needle ? suggestions.filter(suggestion => suggestion.value.toLowerCase().includes(needle)) : suggestions;
  const isOpen = isExpanded && options.length > 0;
  const typed = value.trim().toLowerCase();
  const selected = selectedValue.trim().toLowerCase();
  const isNewValue = typed !== '' && !suggestions.some(suggestion => suggestion.value.toLowerCase() === typed);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${highlight}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [highlight, isOpen]);

  const expand = () => {
    setFilter('');
    setHighlight(0);
    setIsExpanded(true);
  };

  const choose = (suggestion: Suggestion) => {
    onChange(suggestion.value);
    onPick?.(suggestion);
    setIsExpanded(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (isOpen) setHighlight(index => Math.min(options.length - 1, index + 1));
      else expand();
    } else if (event.key === 'ArrowUp' && isOpen) {
      event.preventDefault();
      setHighlight(index => Math.max(0, index - 1));
    } else if (event.key === 'Enter' && isOpen && options[highlight]) {
      event.preventDefault();
      choose(options[highlight]);
    }
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={open => !open && setIsExpanded(false)}>
      <Popover.Anchor asChild>
        <div ref={anchorRef} className="relative">
          <TextInput
            {...inputProps}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            value={value}
            onClick={() => !isOpen && expand()}
            onChange={event => {
              onChange(event.target.value);
              setFilter(event.target.value);
              setHighlight(0);
              setIsExpanded(true);
            }}
            onKeyDown={handleKeyDown}
            className={cn(isNewValue ? 'pr-24' : 'pr-11', className)}
          />
          {isNewValue && (
            <span className={cn('pointer-events-none absolute inset-y-0 my-auto h-fit rounded-tag bg-notice-soft px-1.5 py-0.5 text-[11px] font-semibold text-notice', suggestions.length > 0 ? 'right-11' : 'right-3')}>
              {text.newValue}
            </span>
          )}
          {suggestions.length > 0 && (
            <button
              type="button"
              tabIndex={-1}
              aria-label={isOpen ? text.collapse : text.expand}
              // Keeps focus in the input, so the panel never sees a focus-outside and closes itself.
              onMouseDown={event => event.preventDefault()}
              onClick={() => (isOpen ? setIsExpanded(false) : expand())}
              className="absolute inset-y-0 right-1.5 my-auto flex size-8 items-center justify-center rounded-tag text-fg-subtle transition-colors hover:bg-muted hover:text-fg"
            >
              <ChevronDown className={cn('size-4 transition-transform duration-200', isOpen && 'rotate-180')} />
            </button>
          )}
        </div>
      </Popover.Anchor>
      <Popover.Content
        ref={listRef}
        id={listId}
        role="listbox"
        side="bottom"
        align="start"
        sideOffset={6}
        collisionPadding={12}
        onOpenAutoFocus={event => event.preventDefault()}
        onCloseAutoFocus={event => event.preventDefault()}
        onInteractOutside={event => {
          if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
        }}
        className={cn(OPTION_PANEL_STYLE, 'max-h-[min(18rem,var(--radix-popover-content-available-height))] w-(--radix-popover-trigger-width) origin-(--radix-popover-content-transform-origin)')}
      >
        {options.map((option, index) => {
          const isSelected = option.value.toLowerCase() === selected;
          return (
            <div
              key={option.value}
              role="option"
              aria-selected={isSelected}
              data-index={index}
              data-highlighted={index === highlight ? '' : undefined}
              onMouseEnter={() => setHighlight(index)}
              onMouseDown={event => event.preventDefault()}
              onClick={event => {
                // Rendered inside a Field <label>: without this the click re-activates the input and reopens the list.
                event.preventDefault();
                choose(option);
              }}
              className={OPTION_ROW_STYLE}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate">{option.value}</span>
                {option.meta && <span className="block truncate text-xs text-fg-subtle">{option.meta}</span>}
              </span>
              {isSelected && <Check className="size-4 shrink-0 text-score" />}
            </div>
          );
        })}
      </Popover.Content>
    </Popover.Root>
  );
}
