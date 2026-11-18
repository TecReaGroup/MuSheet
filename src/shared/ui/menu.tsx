import { Check, ChevronRight } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/class-name';

export const Menu = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;
export const MenuSub = DropdownMenu.Sub;

const PANEL_STYLE = 'z-50 min-w-48 overflow-hidden rounded-card border border-border bg-surface-raised p-1 shadow-float';

export function MenuContent({ className, align = 'end', sideOffset = 6, ...props }: ComponentProps<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content align={align} sideOffset={sideOffset} collisionPadding={12} className={cn(PANEL_STYLE, className)} {...props} />
    </DropdownMenu.Portal>
  );
}

const ITEM_STYLE = 'relative flex cursor-pointer select-none items-center gap-2.5 rounded-tag px-2.5 py-2.5 text-sm text-fg outline-none data-[highlighted]:bg-muted data-[disabled]:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-muted';

type MenuItemProps = ComponentProps<typeof DropdownMenu.Item> & { icon?: ReactNode; tone?: 'default' | 'danger' };

export function MenuItem({ icon, tone = 'default', className, children, ...props }: MenuItemProps) {
  return (
    <DropdownMenu.Item className={cn(ITEM_STYLE, tone === 'danger' && 'text-danger [&_svg]:text-danger', className)} {...props}>
      {icon}
      {children}
    </DropdownMenu.Item>
  );
}

type MenuCheckItemProps = Omit<ComponentProps<typeof DropdownMenu.CheckboxItem>, 'children'> & { children: ReactNode };

export function MenuCheckItem({ className, children, ...props }: MenuCheckItemProps) {
  return (
    <DropdownMenu.CheckboxItem className={cn(ITEM_STYLE, 'pr-8', className)} {...props}>
      <span className="flex-1">{children}</span>
      <DropdownMenu.ItemIndicator className="absolute right-2.5">
        <Check className="text-score!" />
      </DropdownMenu.ItemIndicator>
    </DropdownMenu.CheckboxItem>
  );
}

export function MenuSubTrigger({ icon, children, className }: { icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <DropdownMenu.SubTrigger className={cn(ITEM_STYLE, 'data-[state=open]:bg-muted', className)}>
      {icon}
      <span className="flex-1">{children}</span>
      <ChevronRight />
    </DropdownMenu.SubTrigger>
  );
}

export function MenuSubContent({ className, ...props }: ComponentProps<typeof DropdownMenu.SubContent>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.SubContent sideOffset={4} collisionPadding={12} className={cn(PANEL_STYLE, 'max-h-72 overflow-y-auto', className)} {...props} />
    </DropdownMenu.Portal>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <DropdownMenu.Label className="px-2.5 pb-1 pt-2 text-xs font-medium text-fg-subtle">{children}</DropdownMenu.Label>;
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="-mx-1 my-1 h-px bg-border" />;
}
