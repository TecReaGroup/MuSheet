import type { ScoreSummary, ScoreUpdateRequest } from '@contract/api';
import { useEffect, useRef } from 'react';
import { clampBpm, useMetronomeStore } from './metronome-store';

const SAVE_DELAY_MS = 1000;

/** Loads the score's BPM into the metronome and writes later BPM changes back to it. */
export function useScoreTempoSync(score: Pick<ScoreSummary, 'id' | 'bpm'>, save: (patch: ScoreUpdateRequest) => void) {
  const saveRef = useRef(save);
  saveRef.current = save;
  const initialBpm = useRef(score.bpm);
  initialBpm.current = score.bpm;

  useEffect(() => {
    let savedBpm = clampBpm(initialBpm.current);
    useMetronomeStore.getState().setBpm(savedBpm);
    let timer = 0;

    const flush = () => {
      window.clearTimeout(timer);
      timer = 0;
      const { bpm } = useMetronomeStore.getState();
      if (bpm === savedBpm) return;
      savedBpm = bpm;
      saveRef.current({ bpm });
    };

    const unsubscribe = useMetronomeStore.subscribe(state => {
      if (state.bpm === savedBpm) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(flush, SAVE_DELAY_MS);
    });
    return () => {
      unsubscribe();
      // Leaving the score (e.g. next song in a setlist) must not drop a tempo change still waiting to save.
      if (timer) flush();
    };
  }, [score.id]);
}
