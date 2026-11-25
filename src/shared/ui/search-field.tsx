import { Search, X } from 'lucide-react';
import { COMMON_TEXT } from '../i18n/common-text';
import { useText } from '../i18n/text';
import { cn } from '../lib/class-name';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export function SearchField({ value, onChange, placeholder, className }: SearchFieldProps) {
  const text = useText(COMMON_TEXT);
  return (
    <label className={cn('relative flex h-11 items-center rounded-card border border-border bg-surface transition-[border-color,box-shadow] focus-within:border-focus focus-within:ring-3 focus-within:ring-focus/25', className)}>
      <Search className="ml-4 size-5 shrink-0 text-fg-subtle" />
      <input
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-fg outline-none placeholder:text-fg-subtle [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label={text.clearSearch} className="mr-2 rounded-full p-1 text-fg-subtle hover:bg-muted hover:text-fg">
          <X className="size-4" />
        </button>
      )}
    </label>
  );
}
