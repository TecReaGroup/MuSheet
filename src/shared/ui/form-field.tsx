import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/class-name';

const SELECT_CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

const CONTROL_STYLE = 'w-full rounded-card border border-border bg-surface px-3 text-body text-fg outline-none transition-[border-color,box-shadow] placeholder:text-fg-subtle focus:border-focus focus:ring-3 focus:ring-focus/25 disabled:opacity-50';

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-sm font-medium text-fg-title">{label}</span>
      {children}
    </label>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL_STYLE, 'h-11', className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL_STYLE, 'min-h-20 resize-none py-2.5', className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CONTROL_STYLE, 'h-11 appearance-none bg-size-[16px] bg-position-[right_0.75rem_center] bg-no-repeat pr-9', className)} style={{ backgroundImage: SELECT_CHEVRON }} {...props} />;
}
