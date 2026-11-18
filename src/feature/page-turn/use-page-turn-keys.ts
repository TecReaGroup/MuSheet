import { useEffect, useRef } from 'react';
import { usePreferenceStore } from '@/feature/preference/preference-store';

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

/** Keyboard and Bluetooth pedal page turning (pedals are HID keyboards). */
export function usePageTurnKeys(onNext: () => void, onPrevious: () => void) {
  const nextKeys = usePreferenceStore(state => state.nextPageKeys);
  const previousKeys = usePreferenceStore(state => state.previousPageKeys);
  const handlers = useRef({ onNext, onPrevious });
  handlers.current = { onNext, onPrevious };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      // Radix menus/dialogs own the arrow keys while open.
      if (document.querySelector('[role="menu"], [role="dialog"]')) return;
      if (nextKeys.includes(event.key)) {
        event.preventDefault();
        handlers.current.onNext();
      } else if (previousKeys.includes(event.key)) {
        event.preventDefault();
        handlers.current.onPrevious();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextKeys, previousKeys]);
}
