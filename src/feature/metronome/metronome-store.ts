import { BPM_MAX, BPM_MIN } from '@contract/api';
import { create } from 'zustand';
import { MetronomeEngine } from './metronome-engine';

interface MetronomeState {
  bpm: number;
  isPlaying: boolean;
  setBpm: (bpm: number) => void;
  toggle: () => void;
  stop: () => void;
}

export function clampBpm(bpm: number) {
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(bpm)));
}

export const useMetronomeStore = create<MetronomeState>()((set, get) => {
  const engine = new MetronomeEngine(() => get().bpm);

  return {
    bpm: 120,
    isPlaying: false,
    setBpm: bpm => set({ bpm: clampBpm(bpm) }),
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
