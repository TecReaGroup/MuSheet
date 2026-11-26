import { useEffect, type RefObject } from 'react';

const SCROLL_IDLE_MS = 700;

/**
 * Sets `data-scrolling` on the element while it scrolls, for the `thin-scroll` highlight.
 * Writes the attribute directly: React state here would re-render the whole subtree on every gesture.
 */
export function useScrollActivity(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    const handleScroll = () => {
      element.dataset.scrolling = '';
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => delete element.dataset.scrolling, SCROLL_IDLE_MS);
    };
    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(idleTimer);
      element.removeEventListener('scroll', handleScroll);
    };
  }, [ref]);
}
