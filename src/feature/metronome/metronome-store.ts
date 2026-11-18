import { BPM_MAX, BPM_MIN, type TimeSignature } from '@contract/api';
import { create } from 'zustand';
import { MetronomeEngine } from './metronome-engine';

export type Subdivision = 1 | 2 | 3 | 4;

interface MetronomeState {
  bpm: number;
  timeSignature: TimeSignature;
  subdivision: Subdivision;
  isPlaying: boolean;
  /** Beat index within the bar that is sounding now, -1 when stopped. */
  currentBeat: number;
  setBpm: (bpm: number) => void;
  setTimeSignature: (timeSignature: TimeSignature) => void;
  setSubdivision: (subdivision: Subdivision) => void;
  loadTempo: (bpm: number, timeSignature: TimeSignature) => void;
  toggle: () => void;
  stop: () => void;
}

export function beatsPerBar(timeSignature: TimeSignature) {
  return Number(timeSignature.split('/')[0]);
}

export function clampBpm(bpm: number) {
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(bpm)));
}

export const useMetronomeStore = create<MetronomeState>()((set, get) => {
  const engine = new MetronomeEngine(
    () => {
      const state = get();
      return { bpm: state.bpm, beatsPerBar: beatsPerBar(state.timeSignature), subdivision: state.subdivision };
    },
    beat => set({ currentBeat: beat }),
  );

  return {
    bpm: 120,
    timeSignature: '4/4',
    subdivision: 1,
    isPlaying: false,
    currentBeat: -1,
    setBpm: bpm => set({ bpm: clampBpm(bpm) }),
    setTimeSignature: timeSignature => set({ timeSignature }),
    setSubdivision: subdivision => set({ subdivision }),
    loadTempo: (bpm, timeSignature) => set({ bpm: clampBpm(bpm), timeSignature }),
    toggle: () => {
      if (get().isPlaying) {
        get().stop();
        return;
      }
      engine.start();
      set({ isPlaying: true });
    },
    stop: () => {
      if (!get().isPlaying) return;
      engine.stop();
      set({ isPlaying: false });
    },
  };
});
