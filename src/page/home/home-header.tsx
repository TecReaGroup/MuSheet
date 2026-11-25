import { useEffect, useRef } from 'react';
import { useText } from '@/shared/i18n/text';
import { PageHeader } from '@/shared/ui/page-header';
import { SearchField } from '@/shared/ui/search-field';
import { HOME_TEXT } from './home-text';

const SEARCH_SHORTCUT_KEY = '/';

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

/** Focuses the input on "/" unless the user is already typing somewhere. */
function useSearchShortcut() {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const focusOnShortcut = (event: KeyboardEvent) => {
      if (event.key !== SEARCH_SHORTCUT_KEY || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', focusOnShortcut);
    return () => window.removeEventListener('keydown', focusOnShortcut);
  }, []);
  return inputRef;
}

interface HomeHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function HomeHeader({ query, onQueryChange }: HomeHeaderProps) {
  const text = useText(HOME_TEXT);
  const inputRef = useSearchShortcut();

  return (
    <PageHeader title={text.title}>
      <SearchField
        ref={inputRef}
        className="h-12"
        value={query}
        onChange={onQueryChange}
        placeholder={text.searchPlaceholder}
        hint={<kbd className="hidden h-6 min-w-6 items-center justify-center rounded-tag border border-border bg-muted px-1.5 font-sans text-xs text-fg-subtle md:inline-flex">{SEARCH_SHORTCUT_KEY}</kbd>}
      />
    </PageHeader>
  );
}
