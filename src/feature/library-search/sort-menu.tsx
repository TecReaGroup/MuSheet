import type { SortKey } from '@contract/api';
import { ArrowDown, ArrowDownUp, ArrowUp } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/shared/ui/menu';
import type { SortState } from './sort-store';

const SORT_LABELS: Record<SortKey, string> = {
  created: '最近添加',
  title: '名称',
  opened: '最近打开',
};

interface SortMenuProps {
  state: SortState;
  onSelect: (sort: SortKey) => void;
}

export function SortMenu({ state, onSelect }: SortMenuProps) {
  const DirectionIcon = state.order === 'asc' ? ArrowUp : ArrowDown;
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="secondary" className="h-11 px-3" aria-label="排序">
          <ArrowDownUp />
          <span className="hidden sm:inline">{SORT_LABELS[state.sort]}</span>
        </Button>
      </MenuTrigger>
      <MenuContent>
        {(Object.keys(SORT_LABELS) as SortKey[]).map(key => (
          <MenuItem
            key={key}
            onSelect={() => onSelect(key)}
            icon={key === state.sort ? <DirectionIcon className="text-score!" /> : <span className="size-4" />}
            className={key === state.sort ? 'font-medium' : undefined}
          >
            {SORT_LABELS[key]}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
