import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Mirrors the custom --radius-* / --shadow-* / --text-* tokens in styles.css. Unregistered names are
// not recognised as conflicting, so `rounded-card` would silently survive a `rounded-full` override,
// and `text-body` would be mistaken for a colour and wipe out `text-fg`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['tag', 'card', 'panel', 'sheet', 'modal'],
      shadow: ['float', 'fab'],
      text: ['body', 'caption'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
