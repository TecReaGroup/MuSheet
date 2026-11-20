import type { ReactNode } from 'react';
import { cn } from '../lib/class-name';
import { IconButton } from './button';

// A touch lighter than the solid button fills, so the floating square doesn't read as heavy.
const TONE_STYLE = {
  score: { variant: 'primary', fill: 'bg-score-icon' },
  setlist: { variant: 'setlist', fill: 'bg-setlist-icon' },
} as const;

interface FloatingActionButtonProps {
  label: string;
  tone: keyof typeof TONE_STYLE;
  onClick: () => void;
  children: ReactNode;
}

/** Page-level primary action pinned bottom-right as a rounded square; on mobile it clears the bottom nav. */
export function FloatingActionButton({ label, tone, onClick, children }: FloatingActionButtonProps) {
  const { variant, fill } = TONE_STYLE[tone];
  return (
    <IconButton
      label={label}
      variant={variant}
      onClick={onClick}
      className={cn(
        'fixed right-6 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-20 size-14 rounded-[18px] text-[26px] shadow-fab md:right-12 md:bottom-12',
        fill,
      )}
    >
      {children}
    </IconButton>
  );
}
