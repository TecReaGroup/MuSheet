import type { SortKey } from '@contract/api';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/class-name';
import { Button } from '@/shared/ui/button';
import { ListSortAscendingIcon, ListSortDescendingIcon } from '@/shared/ui/list-sort-icon';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/shared/ui/menu';
import type { SortState } from './sort-store';

const SORT_LABELS: Record<SortKey, string> = {
  created: '最近添加',
  opened: '最近打开',
  title: '名称',
};

interface SortMenuProps {
  state: SortState;
  onSelect: (sort: SortKey) => void;
}

/** Fixed-width so the toolbar doesn't jump when the label changes; re-picking the active key flips direction. */
export function SortMenu({ state, onSelect }: SortMenuProps) {
  const DirectionIcon = state.order === 'asc' ? ListSortAscendingIcon : ListSortDescendingIcon;
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button
          variant="secondary"
          aria-label={`排序：${SORT_LABELS[state.sort]}`}
          className="group h-11 w-11 px-0 text-[15px] font-medium text-fg-muted hover:text-fg data-[state=open]:bg-muted data-[state=open]:text-fg sm:w-36 sm:justify-start sm:px-3.5 [&_svg]:size-[18px] [&_svg]:text-fg-subtle"
        >
          <DirectionIcon />
          <span className="hidden flex-1 text-center sm:inline">{SORT_LABELS[state.sort]}</span>
          <ChevronDown className="hidden transition-transform group-data-[state=open]:rotate-180 sm:block" />
        </Button>
      </MenuTrigger>
      <MenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-36">
        {(Object.keys(SORT_LABELS) as SortKey[]).map(key => {
          const isActive = key === state.sort;
          return (
            <MenuItem
              key={key}
              onSelect={() => onSelect(key)}
              className={cn('justify-center px-3 py-2 text-[15px]', isActive ? 'font-medium text-score' : 'text-fg-muted data-[highlighted]:text-fg')}
            >
              {SORT_LABELS[key]}
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
}
