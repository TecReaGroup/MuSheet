import type { ScoreSummary } from '@contract/api';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { importScore, useScoreList } from '@/entity/score/score-api';
import { describeError } from '@/shared/api/http-client';
import { invalidateLibrary } from '@/shared/api/query-client';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, readText, useText } from '@/shared/i18n/text';
import { log, serializeError } from '@/shared/lib/logger';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Field } from '@/shared/ui/form-field';
import { SuggestionInput, type Suggestion } from '@/shared/ui/suggestion-input';
import { useImportDialogStore } from './import-dialog-store';
import { lastPartName, PartNamePicker, rememberPartName } from './part-name-picker';
import { PdfUploadField } from './pdf-upload-field';
import { titleFromImportSource } from './prepare-pdf';
import { usePdfUpload } from './use-pdf-upload';

const IMPORT_TOAST_DURATION_MS = 1000;
const IMPORT_FORM_ID = 'musheet-import-score';

const IMPORT_TEXT = defineText({
  'zh-CN': {
    title: '导入乐谱',
    submit: '导入',
    willJoin: (scoreTitle: string) => `已有同名乐谱，将作为新声部加入《${scoreTitle}》`,
    joined: (scoreTitle: string) => `已作为新声部加入《${scoreTitle}》`,
    imported: (scoreTitle: string) => `已导入《${scoreTitle}》`,
  },
  en: {
    title: 'Import score',
    submit: 'Import',
    willJoin: (scoreTitle: string) => `A score with this name exists; this will be added as a new part of "${scoreTitle}"`,
    joined: (scoreTitle: string) => `Added as a new part of "${scoreTitle}"`,
    imported: (scoreTitle: string) => `Imported "${scoreTitle}"`,
  },
});

function normalized(text: string) {
  return text.trim().toLowerCase();
}

/** The server merges an import into an existing score with the same title and composer. */
function findMatchingScore(scores: ScoreSummary[], title: string, composer: string) {
  return scores.find(score => normalized(score.title) === normalized(title) && normalized(score.composer) === normalized(composer));
}

// Titles repeat across composers; the first composer wins so the list keeps one row per title.
function useTitleSuggestions(scores: ScoreSummary[]): Suggestion[] {
  const commonText = useText(COMMON_TEXT);
  return useMemo(() => {
    const scoreByTitle = new Map<string, ScoreSummary>();
    for (const score of scores) {
      if (!scoreByTitle.has(normalized(score.title))) scoreByTitle.set(normalized(score.title), score);
    }
    return [...scoreByTitle.values()].map(score => ({
      value: score.title,
      meta: [score.composer, commonText.partCount(score.parts.length)].filter(Boolean).join(' · '),
    }));
  }, [scores, commonText]);
}

function useComposerSuggestions(scores: ScoreSummary[]): Suggestion[] {
  const commonText = useText(COMMON_TEXT);
  return useMemo(() => {
    const countByComposer = new Map<string, number>();
    for (const { composer } of scores) {
      if (composer) countByComposer.set(composer, (countByComposer.get(composer) ?? 0) + 1);
    }
    return [...countByComposer].map(([composer, count]) => ({ value: composer, meta: commonText.scoreCount(count) }));
  }, [scores, commonText]);
}

export function ImportScoreDialog() {
  const { isOpen, space, close, takeIncomingFiles, incomingFiles } = useImportDialogStore();
  const { upload, selectFiles, reset: resetUpload } = usePdfUpload();
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [partName, setPartName] = useState(lastPartName);
  const [isImporting, setIsImporting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const navigate = useNavigate();
  const { data: scores = [] } = useScoreList({ space, sort: 'title', order: 'asc' });
  const titleSuggestions = useTitleSuggestions(scores);
  const composerSuggestions = useComposerSuggestions(scores);
  const text = useText(IMPORT_TEXT);
  const commonText = useText(COMMON_TEXT);

  const pickFiles = (files: File[]) => {
    const source = selectFiles(files);
    if (source) setTitle(titleFromImportSource(source));
    setSubmitError(undefined);
  };

  useEffect(() => {
    // pickFiles only closes over stable setters, so it is deliberately not a dependency.
    if (isOpen && incomingFiles.length > 0) pickFiles(takeIncomingFiles());
  }, [isOpen, incomingFiles, takeIncomingFiles]);

  const closeAndReset = () => {
    close();
    resetUpload();
    setTitle('');
    setComposer('');
    setSubmitError(undefined);
  };

  // Picking an existing title also brings its composer, so the import joins that score instead of creating a twin.
  const pickTitle = ({ value }: Suggestion) => {
    const picked = scores.find(score => normalized(score.title) === normalized(value));
    if (picked) setComposer(picked.composer);
  };

  const hasFile = upload.state === 'preparing' || upload.state === 'ready';
  const canSubmit = upload.state === 'ready' && title.trim() !== '' && partName !== '' && !isImporting;
  const match = hasFile ? findMatchingScore(scores, title, composer) : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (upload.state !== 'ready' || !canSubmit) return;
    setIsImporting(true);
    setSubmitError(undefined);
    try {
      const imported = await importScore({ space, title: title.trim(), composer: composer.trim(), pdfSha256: upload.pdf.sha256, partName });
      rememberPartName(partName);
      await invalidateLibrary();
      const importText = readText(IMPORT_TEXT);
      toast.success(imported.joinedExistingScore ? importText.joined(imported.score.title) : importText.imported(imported.score.title), {
        duration: IMPORT_TOAST_DURATION_MS,
        action: { label: readText(COMMON_TEXT).open, onClick: () => navigate(`/view/${imported.partId}`) },
      });
      closeAndReset();
    } catch (error) {
      log('warn', 'Import', 'Import failed', serializeError(error));
      setSubmitError(describeError(error));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => !open && closeAndReset()}
      title={text.title}
      footer={(
        <>
          <Button variant="ghost" onClick={closeAndReset}>{commonText.cancel}</Button>
          <Button variant="primary" type="submit" form={IMPORT_FORM_ID} disabled={!canSubmit}>{text.submit}</Button>
        </>
      )}
    >
      <form id={IMPORT_FORM_ID} onSubmit={submit} className="space-y-4 pb-2">
        <PdfUploadField upload={upload} onFiles={pickFiles} onReplace={resetUpload} />
        {hasFile && (
          <div className="animate-rise-in space-y-4">
            <Field label={commonText.title} required>
              <SuggestionInput value={title} maxLength={120} suggestions={titleSuggestions} selectedValue={match?.title ?? ''} onChange={setTitle} onPick={pickTitle} />
            </Field>
            <Field label={commonText.composer}>
              <SuggestionInput value={composer} maxLength={120} placeholder={commonText.optional} suggestions={composerSuggestions} onChange={setComposer} />
            </Field>
            <PartNamePicker value={partName} onChange={setPartName} />
            {match && <p className="text-caption text-setlist">{text.willJoin(match.title)}</p>}
            {submitError && <p className="text-caption text-danger">{submitError}</p>}
          </div>
        )}
      </form>
    </Dialog>
  );
}
