import { useRef } from 'react';

const TAP_RESET_MS = 2000;
const TAPS_AVERAGED = 4;

/** Returns a tap handler that reports the BPM of the last few taps (needs at least two). */
export function useTapTempo(onTempo: (bpm: number) => void) {
  const taps = useRef<number[]>([]);

  return () => {
    const now = performance.now();
    const previous = taps.current.at(-1);
    if (previous !== undefined && now - previous > TAP_RESET_MS) taps.current = [];
    taps.current = [...taps.current, now].slice(-(TAPS_AVERAGED + 1));
    if (taps.current.length < 2) return;
    const span = taps.current.at(-1)! - taps.current[0]!;
    onTempo(60_000 / (span / (taps.current.length - 1)));
  };
}
