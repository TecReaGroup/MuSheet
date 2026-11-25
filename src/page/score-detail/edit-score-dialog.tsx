import { BPM_MAX, BPM_MIN, TIME_SIGNATURES, type ScoreSummary, type TimeSignature } from '@contract/api';
import { useEffect, useState } from 'react';
import { useUpdateScore } from '@/entity/score/score-api';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, useText } from '@/shared/i18n/text';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Field, Select, TextInput } from '@/shared/ui/form-field';

const EDIT_SCORE_TEXT = defineText({
  'zh-CN': {
    title: '编辑乐曲',
    tempo: (min: number, max: number) => `速度 (${min}–${max} BPM)`,
  },
  en: {
    title: 'Edit score',
    tempo: (min: number, max: number) => `Tempo (${min}–${max} BPM)`,
  },
});

interface EditScoreDialogProps {
  score: ScoreSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditScoreDialog({ score, open, onOpenChange }: EditScoreDialogProps) {
  const [title, setTitle] = useState(score.title);
  const [composer, setComposer] = useState(score.composer);
  const [bpm, setBpm] = useState(String(score.bpm));
  const [timeSignature, setTimeSignature] = useState<TimeSignature>(score.timeSignature);
  const updateScore = useUpdateScore(score.id);
  const text = useText(EDIT_SCORE_TEXT);
  const commonText = useText(COMMON_TEXT);

  useEffect(() => {
    if (!open) return;
    setTitle(score.title);
    setComposer(score.composer);
    setBpm(String(score.bpm));
    setTimeSignature(score.timeSignature);
  }, [open, score]);

  const bpmValue = Number(bpm);
  const isBpmValid = Number.isInteger(bpmValue) && bpmValue >= BPM_MIN && bpmValue <= BPM_MAX;
  const canSave = title.trim().length > 0 && isBpmValid && !updateScore.isPending;

  const save = () => updateScore.mutate(
    { title: title.trim(), composer: composer.trim(), bpm: bpmValue, timeSignature },
    { onSuccess: () => onOpenChange(false) },
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={text.title}
      footer={(
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{commonText.cancel}</Button>
          <Button variant="primary" disabled={!canSave} onClick={save}>{commonText.save}</Button>
        </>
      )}
    >
      <form className="space-y-4 pb-2" onSubmit={event => { event.preventDefault(); if (canSave) save(); }}>
        <Field label={commonText.title}>
          <TextInput value={title} maxLength={120} onChange={event => setTitle(event.target.value)} />
        </Field>
        <Field label={commonText.composer}>
          <TextInput value={composer} maxLength={120} onChange={event => setComposer(event.target.value)} />
        </Field>
        <div className="flex gap-3">
          <Field label={text.tempo(BPM_MIN, BPM_MAX)} className="flex-1">
            <TextInput inputMode="numeric" value={bpm} aria-invalid={!isBpmValid} className="tabular-nums aria-invalid:border-danger" onChange={event => setBpm(event.target.value.replace(/\D/g, ''))} />
          </Field>
          <Field label={commonText.timeSignature} className="w-28">
            <Select value={timeSignature} onChange={event => setTimeSignature(event.target.value as TimeSignature)}>
              {TIME_SIGNATURES.map(signature => <option key={signature} value={signature}>{signature}</option>)}
            </Select>
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
