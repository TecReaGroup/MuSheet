import { BPM_MAX, BPM_MIN, TIME_SIGNATURES, type TimeSignature } from '@contract/api';
import { Minus, Pause, Play, Plus, X } from 'lucide-react';
import { cn } from '@/shared/lib/class-name';
import { useHoldRepeat } from '@/shared/lib/use-hold-repeat';
import { Button, IconButton } from '@/shared/ui/button';
import { Select } from '@/shared/ui/form-field';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { Slider } from '@/shared/ui/slider';
import { beatsPerBar, useMetronomeStore, type Subdivision } from './metronome-store';
import { useTapTempo } from './use-tap-tempo';

const SUBDIVISION_OPTIONS: { value: `${Subdivision}`; label: string }[] = [
  { value: '1', label: '♩' },
  { value: '2', label: '♫' },
  { value: '3', label: '3' },
  { value: '4', label: '♬' },
];

const TEMPO_MARKINGS: [maxBpm: number, name: string][] = [
  [40, 'Grave'], [60, 'Largo'], [66, 'Larghetto'], [76, 'Adagio'], [108, 'Andante'],
  [120, 'Moderato'], [156, 'Allegro'], [176, 'Vivace'], [200, 'Presto'], [Infinity, 'Prestissimo'],
];

function tempoMarking(bpm: number) {
  return TEMPO_MARKINGS.find(([maxBpm]) => bpm <= maxBpm)![1];
}

export function MetronomePanel({ onClose }: { onClose: () => void }) {
  const { bpm, timeSignature, subdivision, isPlaying, currentBeat, setBpm, setTimeSignature, setSubdivision, toggle } = useMetronomeStore();
  const decrease = useHoldRepeat(() => setBpm(useMetronomeStore.getState().bpm - 1));
  const increase = useHoldRepeat(() => setBpm(useMetronomeStore.getState().bpm + 1));
  const tap = useTapTempo(setBpm);

  return (
    <section aria-label="节拍器" className="w-full rounded-panel border border-border bg-surface/95 p-4 shadow-float backdrop-blur sm:w-80">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: beatsPerBar(timeSignature) }, (_, beat) => (
            <span
              key={beat}
              className={cn(
                'size-2.5 rounded-full transition-colors duration-75',
                beat === currentBeat ? (beat === 0 ? 'bg-setlist' : 'bg-score') : 'bg-muted',
              )}
            />
          ))}
        </div>
        <IconButton label="收起节拍器（继续播放）" className="-mr-2 -mt-2 size-8" onClick={onClose}>
          <X />
        </IconButton>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <IconButton label="减慢" variant="secondary" className="size-11 touch-none" {...decrease}><Minus /></IconButton>
        <div className="text-center">
          <div className="text-[56px] font-semibold leading-none tracking-tight tabular-nums">{bpm}</div>
          <div className="mt-1 text-xs text-fg-subtle">BPM · {tempoMarking(bpm)}</div>
        </div>
        <IconButton label="加快" variant="secondary" className="size-11 touch-none" {...increase}><Plus /></IconButton>
      </div>

      <Slider className="mt-4" label="速度" value={bpm} min={BPM_MIN} max={BPM_MAX} onChange={setBpm} />

      <div className="mt-4 flex gap-2">
        <Select aria-label="拍号" className="h-10 w-24" value={timeSignature} onChange={event => setTimeSignature(event.target.value as TimeSignature)}>
          {TIME_SIGNATURES.map(signature => <option key={signature} value={signature}>{signature}</option>)}
        </Select>
        <SegmentedControl
          label="细分"
          className="flex-1"
          value={String(subdivision) as `${Subdivision}`}
          options={SUBDIVISION_OPTIONS}
          onChange={value => setSubdivision(Number(value) as Subdivision)}
        />
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={tap}>Tap</Button>
        <Button variant={isPlaying ? 'danger' : 'primary'} className="flex-[2]" onClick={toggle}>
          {isPlaying ? <Pause /> : <Play />}
          {isPlaying ? '停止' : '开始'}
        </Button>
      </div>
    </section>
  );
}
