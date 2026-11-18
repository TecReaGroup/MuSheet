import { useEffect, useRef, type PointerEvent } from 'react';

const HOLD_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 70;

/** Pointer handlers that fire once on press, then repeat while held (BPM ± buttons). */
export function useHoldRepeat(action: () => void) {
  const actionRef = useRef(action);
  const timers = useRef<{ delay?: number; repeat?: number }>({});
  actionRef.current = action;

  const stop = () => {
    window.clearTimeout(timers.current.delay);
    window.clearInterval(timers.current.repeat);
    timers.current = {};
  };

  useEffect(() => stop, []);

  return {
    onPointerDown: (event: PointerEvent) => {
      if (event.button !== 0) return;
      stop();
      actionRef.current();
      timers.current.delay = window.setTimeout(() => {
        timers.current.repeat = window.setInterval(() => actionRef.current(), REPEAT_INTERVAL_MS);
      }, HOLD_DELAY_MS);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
  };
}
