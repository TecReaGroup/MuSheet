import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/class-name';

const buttonStyle = cva(
  'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-card font-medium transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-[1.15em] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-score text-white hover:bg-score-strong dark:text-zinc-950',
        setlist: 'bg-setlist text-white hover:bg-setlist-strong dark:text-zinc-950',
        secondary: 'border border-border bg-surface text-fg hover:bg-muted',
        ghost: 'text-fg-muted hover:bg-muted hover:text-fg',
        danger: 'bg-danger-soft text-danger hover:brightness-95',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-[15px]',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10 text-[18px]',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyle>;

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonStyle({ variant, size }), className)} {...props} />;
}

type IconButtonProps = Omit<ButtonProps, 'size' | 'children' | 'aria-label'> & {
  label: string;
  children: ReactNode;
};

/** Icon-only button; `label` is required so every icon has an accessible name and tooltip. */
export function IconButton({ label, variant = 'ghost', className, ...props }: IconButtonProps) {
  return <Button size="icon" variant={variant} aria-label={label} title={label} className={cn('rounded-full', className)} {...props} />;
}
