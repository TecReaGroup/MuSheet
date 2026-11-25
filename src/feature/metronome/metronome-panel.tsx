import { BPM_MAX, BPM_MIN } from '@contract/api';
import { Minus, Pause, Play, Plus } from 'lucide-react';
import { defineText, useText } from '@/shared/i18n/text';
import { useHoldRepeat } from '@/shared/lib/use-hold-repeat';
import { Button, IconButton } from '@/shared/ui/button';
import { Slider } from '@/shared/ui/slider';
import { useMetronomeStore } from './metronome-store';
import { useTapTempo } from './use-tap-tempo';

const METRONOME_TEXT = defineText({
  'zh-CN': {
    metronome: '节拍器',
    slower: '减慢',
    faster: '加快',
    tempo: '速度',
    start: '开始',
    stop: '停止',
  },
  en: {
    metronome: 'Metronome',
    slower: 'Slower',
    faster: 'Faster',
    tempo: 'Tempo',
    start: 'Start',
    stop: 'Stop',
  },
});

const TEMPO_MARKINGS: [maxBpm: number, name: string][] = [
  [40, 'Grave'], [60, 'Largo'], [66, 'Larghetto'], [76, 'Adagio'], [108, 'Andante'],
  [120, 'Moderato'], [156, 'Allegro'], [176, 'Vivace'], [200, 'Presto'], [Infinity, 'Prestissimo'],
];

function tempoMarking(bpm: number) {
  return TEMPO_MARKINGS.find(([maxBpm]) => bpm <= maxBpm)![1];
}

export function MetronomePanel() {
  const { bpm, isPlaying, setBpm, toggle } = useMetronomeStore();
  const decrease = useHoldRepeat(() => setBpm(useMetronomeStore.getState().bpm - 1));
  const increase = useHoldRepeat(() => setBpm(useMetronomeStore.getState().bpm + 1));
  const tap = useTapTempo(setBpm);
  const text = useText(METRONOME_TEXT);

  return (
    <section aria-label={text.metronome} className="w-full animate-rise-in rounded-panel border border-border bg-surface/95 p-4 shadow-float backdrop-blur sm:w-80">
      <div className="flex items-center justify-between">
        <IconButton label={text.slower} variant="secondary" className="size-11 touch-none" {...decrease}><Minus /></IconButton>
        <div className="text-center">
          <div className="text-[56px] font-semibold leading-none tracking-tight tabular-nums">{bpm}</div>
          <div className="mt-1 text-xs text-fg-subtle">BPM · {tempoMarking(bpm)}</div>
        </div>
        <IconButton label={text.faster} variant="secondary" className="size-11 touch-none" {...increase}><Plus /></IconButton>
      </div>

      <Slider className="mt-4" label={text.tempo} value={bpm} min={BPM_MIN} max={BPM_MAX} onChange={setBpm} />

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={tap}>Tap</Button>
        <Button variant={isPlaying ? 'danger' : 'primary'} className="flex-[2]" onClick={toggle}>
          {isPlaying ? <Pause /> : <Play />}
          {isPlaying ? text.stop : text.start}
        </Button>
      </div>
    </section>
  );
}
