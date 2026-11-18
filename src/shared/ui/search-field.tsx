import { Search, X } from 'lucide-react';
import { cn } from '../lib/class-name';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export function SearchField({ value, onChange, placeholder, className }: SearchFieldProps) {
  return (
    <label className={cn('relative flex h-11 items-center rounded-card border border-border bg-surface focus-within:border-score/60 focus-within:ring-2 focus-within:ring-score/15', className)}>
      <Search className="ml-3.5 size-[18px] shrink-0 text-fg-subtle" />
      <input
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[15px] text-fg outline-none placeholder:text-fg-subtle [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="清除搜索" className="mr-2 rounded-full p-1 text-fg-subtle hover:bg-muted hover:text-fg">
          <X className="size-4" />
        </button>
      )}
    </label>
  );
}
