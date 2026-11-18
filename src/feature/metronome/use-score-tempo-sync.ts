import type { ScoreSummary, ScoreUpdateRequest } from '@contract/api';
import { useEffect, useRef } from 'react';
import { useMetronomeStore } from './metronome-store';

const SAVE_DELAY_MS = 1000;

/** Loads the score's tempo into the metronome and writes later BPM / time-signature changes back to it. */
export function useScoreTempoSync(score: Pick<ScoreSummary, 'id' | 'bpm' | 'timeSignature'>, save: (patch: ScoreUpdateRequest) => void) {
  const saveRef = useRef(save);
  saveRef.current = save;
  const initial = useRef(score);
  initial.current = score;

  useEffect(() => {
    const { bpm, timeSignature } = initial.current;
    useMetronomeStore.getState().loadTempo(bpm, timeSignature);
    let saved = { bpm, timeSignature };
    let timer = 0;

    const flush = () => {
      window.clearTimeout(timer);
      timer = 0;
      const { bpm: currentBpm, timeSignature: currentSignature } = useMetronomeStore.getState();
      if (currentBpm === saved.bpm && currentSignature === saved.timeSignature) return;
      saved = { bpm: currentBpm, timeSignature: currentSignature };
      saveRef.current(saved);
    };

    const unsubscribe = useMetronomeStore.subscribe(state => {
      if (state.bpm === saved.bpm && state.timeSignature === saved.timeSignature) return;
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
