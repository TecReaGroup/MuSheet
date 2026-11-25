import type { ScoreImportResponse, ScoreSummary } from '@contract/api';
import { CircleAlert, CircleCheck, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { importScore, useScoreList } from '@/entity/score/score-api';
import { describeError } from '@/shared/api/http-client';
import { invalidateLibrary } from '@/shared/api/query-client';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, readText, useText } from '@/shared/i18n/text';
import { log, serializeError } from '@/shared/lib/logger';
import { Button, IconButton } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Field, TextInput } from '@/shared/ui/form-field';
import { Spinner } from '@/shared/ui/spinner';
import { useImportDialogStore } from './import-dialog-store';
import {
  InstrumentPicker,
  isChoiceComplete,
  lastInstrumentChoice,
  rememberInstrumentChoice,
  toPartSelection,
  type InstrumentChoice,
} from './instrument-picker';
import { PdfDropZone } from './pdf-drop-zone';
import { PdfReadError, preparePdf, titleFromFileName, type PreparedPdf } from './prepare-pdf';

const IMPORT_TEXT = defineText({
  'zh-CN': {
    title: '导入乐谱',
    description: '同名同作曲者的乐谱会自动合并为同一首乐曲的不同声部。',
    submit: '导入',
    submitMany: (count: number) => `导入 ${count} 份`,
    addMore: '继续添加 PDF',
    willJoin: (scoreTitle: string) => `将作为新声部加入已有乐曲《${scoreTitle}》`,
    joined: (scoreTitle: string) => `已作为新声部加入《${scoreTitle}》`,
    imported: (scoreTitle: string) => `已导入《${scoreTitle}》`,
    importedMany: (count: number) => `已导入 ${count} 份乐谱`,
  },
  en: {
    title: 'Import scores',
    description: 'Scores with the same title and composer are merged as parts of one score.',
    submit: 'Import',
    submitMany: (count: number) => `Import ${count}`,
    addMore: 'Add more PDFs',
    willJoin: (scoreTitle: string) => `Will be added as a new part of "${scoreTitle}"`,
    joined: (scoreTitle: string) => `Added as a new part of "${scoreTitle}"`,
    imported: (scoreTitle: string) => `Imported "${scoreTitle}"`,
    importedMany: (count: number) => `Imported ${count} scores`,
  },
});

type ImportStatus = 'uploading' | 'ready' | 'importing' | 'failed';

interface ImportItem {
  key: string;
  fileName: string;
  title: string;
  composer: string;
  choice: InstrumentChoice;
  status: ImportStatus;
  prepared?: PreparedPdf;
  error?: string;
}

function normalized(text: string) {
  return text.trim().toLowerCase();
}

function findMatchingScore(scores: ScoreSummary[], item: ImportItem) {
  return scores.find(score => normalized(score.title) === normalized(item.title) && normalized(score.composer) === normalized(item.composer));
}

export function ImportScoreDialog() {
  const { isOpen, space, close, takeIncomingFiles, incomingFiles } = useImportDialogStore();
  const [items, setItems] = useState<ImportItem[]>([]);
  const navigate = useNavigate();
  const { data: scores = [] } = useScoreList({ space, sort: 'title', order: 'asc' });
  const text = useText(IMPORT_TEXT);
  const commonText = useText(COMMON_TEXT);
  const composers = useMemo(() => [...new Set(scores.map(score => score.composer).filter(Boolean))], [scores]);

  const patchItem = (key: string, patch: Partial<ImportItem>) =>
    setItems(current => current.map(item => (item.key === key ? { ...item, ...patch } : item)));

  const addFiles = (files: File[]) => {
    const choice = lastInstrumentChoice();
    // crypto.randomUUID is missing outside secure contexts (tablet on http://<LAN IP>).
    const keyed = files.map(file => ({ key: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, file }));
    setItems(current => [
      ...current,
      ...keyed.map(({ key, file }): ImportItem => ({
        key,
        fileName: file.name,
        title: titleFromFileName(file.name),
        composer: '',
        choice,
        status: 'uploading',
      })),
    ]);
    for (const { key, file } of keyed) {
      preparePdf(file)
        .then(prepared => patchItem(key, { prepared, status: 'ready' }))
        .catch(error => {
          log('warn', 'Import', 'Preparing PDF failed', serializeError(error));
          patchItem(key, { status: 'failed', error: error instanceof PdfReadError ? readText(COMMON_TEXT).unreadablePdf : describeError(error) });
        });
    }
  };

  useEffect(() => {
    // addFiles only closes over stable setters, so it is deliberately not a dependency.
    if (isOpen && incomingFiles.length > 0) addFiles(takeIncomingFiles());
  }, [isOpen, incomingFiles, takeIncomingFiles]);

  const readyItems = items.filter(item => item.status === 'ready' && item.title.trim() && isChoiceComplete(item.choice));
  const isBusy = items.some(item => item.status === 'uploading' || item.status === 'importing');

  const importReadyItems = async () => {
    const imported: ScoreImportResponse[] = [];
    for (const item of readyItems) {
      patchItem(item.key, { status: 'importing', error: undefined });
      try {
        imported.push(await importScore({
          space,
          title: item.title.trim(),
          composer: item.composer.trim(),
          pdfSha256: item.prepared!.sha256,
          ...toPartSelection(item.choice),
        }));
        rememberInstrumentChoice(item.choice);
        setItems(current => current.filter(entry => entry.key !== item.key));
      } catch (error) {
        log('warn', 'Import', 'Import failed', serializeError(error));
        patchItem(item.key, { status: 'ready', error: describeError(error) });
      }
    }
    if (imported.length === 0) return;
    await invalidateLibrary();
    const [only] = imported;
    if (imported.length === 1 && only) {
      const importText = readText(IMPORT_TEXT);
      toast.success(only.joinedExistingScore ? importText.joined(only.score.title) : importText.imported(only.score.title), {
        action: { label: readText(COMMON_TEXT).open, onClick: () => navigate(`/view/${only.partId}`) },
      });
    } else {
      toast.success(readText(IMPORT_TEXT).importedMany(imported.length));
    }
    if (imported.length === readyItems.length && items.length === readyItems.length) close();
  };

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    close();
    if (!isBusy) setItems(current => current.filter(item => item.status !== 'failed'));
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={text.title}
      description={text.description}
      className="sm:max-w-lg"
      footer={(
        <>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>{commonText.cancel}</Button>
          <Button variant="primary" disabled={readyItems.length === 0 || isBusy} onClick={importReadyItems}>
            {readyItems.length > 1 ? text.submitMany(readyItems.length) : text.submit}
          </Button>
        </>
      )}
    >
      <datalist id="musheet-composers">
        {composers.map(composer => <option key={composer} value={composer} />)}
      </datalist>
      <div className="space-y-3 pb-2">
        {items.map(item => {
          const match = findMatchingScore(scores, item);
          return (
            <section key={item.key} className="space-y-3 rounded-panel border border-border p-4">
              <div className="flex items-center gap-2">
                <ImportStatusIcon status={item.status} />
                <span className="min-w-0 flex-1 truncate text-sm text-fg-muted">{item.fileName}</span>
                {item.prepared && <span className="text-xs text-fg-subtle tabular-nums">{commonText.pageCount(item.prepared.pageCount)}</span>}
                <IconButton label={commonText.remove} className="-mr-2 size-8" onClick={() => setItems(current => current.filter(entry => entry.key !== item.key))}>
                  <Trash2 />
                </IconButton>
              </div>
              {item.status === 'failed'
                ? <p className="text-sm text-danger">{item.error}</p>
                : (
                  <>
                    <Field label={commonText.title}>
                      <TextInput value={item.title} maxLength={120} onChange={event => patchItem(item.key, { title: event.target.value })} />
                    </Field>
                    <Field label={commonText.composer}>
                      <TextInput value={item.composer} maxLength={120} list="musheet-composers" placeholder={commonText.optional} onChange={event => patchItem(item.key, { composer: event.target.value })} />
                    </Field>
                    <InstrumentPicker value={item.choice} onChange={choice => patchItem(item.key, { choice })} />
                    {match && <p className="text-[13px] text-setlist">{text.willJoin(match.title)}</p>}
                    {item.error && <p className="text-[13px] text-danger">{item.error}</p>}
                  </>
                )}
            </section>
          );
        })}
        <PdfDropZone multiple onFiles={addFiles} hint={items.length > 0 ? text.addMore : commonText.dropPdfHint} />
      </div>
    </Dialog>
  );
}

function ImportStatusIcon({ status }: { status: ImportStatus }) {
  if (status === 'uploading' || status === 'importing') return <Spinner className="size-4 text-score" />;
  if (status === 'failed') return <CircleAlert className="size-4 text-danger" />;
  return <CircleCheck className="size-4 text-setlist" />;
}
