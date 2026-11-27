import type { ScoreSummary } from '@contract/api';
import { useEffect, useState } from 'react';
import { useComposerSuggestions } from '@/entity/score/composer-suggestion';
import { useScoreList, useUpdateScore } from '@/entity/score/score-api';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, useText } from '@/shared/i18n/text';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Field, TextInput } from '@/shared/ui/form-field';
import { SuggestionInput } from '@/shared/ui/suggestion-input';

const EDIT_SCORE_TEXT = defineText({
  'zh-CN': {
    title: '编辑乐谱',
  },
  en: {
    title: 'Edit score',
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
  const updateScore = useUpdateScore(score.id);
  const { data: scores = [] } = useScoreList({ space: score.space, sort: 'title', order: 'asc' });
  const composerSuggestions = useComposerSuggestions(scores);
  const text = useText(EDIT_SCORE_TEXT);
  const commonText = useText(COMMON_TEXT);

  useEffect(() => {
    if (!open) return;
    setTitle(score.title);
    setComposer(score.composer);
  }, [open, score]);

  const canSave = title.trim().length > 0 && !updateScore.isPending;

  const save = () => updateScore.mutate(
    { title: title.trim(), composer: composer.trim() },
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
        <Field label={commonText.title} required>
          <TextInput value={title} maxLength={120} onChange={event => setTitle(event.target.value)} />
        </Field>
        <Field label={commonText.composer}>
          <SuggestionInput value={composer} maxLength={120} placeholder={commonText.optional} suggestions={composerSuggestions} onChange={setComposer} />
        </Field>
      </form>
    </Dialog>
  );
}
