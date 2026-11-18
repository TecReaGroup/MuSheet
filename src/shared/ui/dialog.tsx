import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '../lib/class-name';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Bottom sheet on phones, centered card from `sm` up — one component, layout decided by CSS. */
export function Dialog({ open, onOpenChange, title, description, children, footer, className }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay" />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-panel bg-surface shadow-float outline-none',
            'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-modal',
            className,
          )}
        >
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-border sm:hidden" />
          <div className="flex items-start gap-3 px-6 pb-2 pt-4 sm:px-8 sm:pt-7">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-xl font-semibold text-fg">{title}</DialogPrimitive.Title>
              {description
                ? <DialogPrimitive.Description className="mt-1 text-sm text-fg-muted">{description}</DialogPrimitive.Description>
                : <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close className="-mr-2 rounded-full p-2 text-fg-subtle hover:bg-muted hover:text-fg" aria-label="关闭">
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-2 sm:px-8">{children}</div>
          {footer && <div className="flex justify-end gap-2 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-8 sm:pb-7">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
