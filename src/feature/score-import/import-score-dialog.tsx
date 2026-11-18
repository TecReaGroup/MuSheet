import type { ScoreImportResponse, ScoreSummary } from '@contract/api';
import { CircleAlert, CircleCheck, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { importScore, useScoreList } from '@/entity/score/score-api';
import { describeError } from '@/shared/api/http-client';
import { invalidateLibrary } from '@/shared/api/query-client';
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
  const { isOpen, close, takeIncomingFiles, incomingFiles } = useImportDialogStore();
  const [items, setItems] = useState<ImportItem[]>([]);
  const navigate = useNavigate();
  const { data: scores = [] } = useScoreList({ sort: 'title', order: 'asc' });
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
          patchItem(key, { status: 'failed', error: error instanceof PdfReadError ? '无法读取该 PDF' : describeError(error) });
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
      toast.success(only.joinedExistingScore ? `已作为新声部加入《${only.score.title}》` : `已导入《${only.score.title}》`, {
        action: { label: '打开', onClick: () => navigate(`/view/${only.partId}`) },
      });
    } else {
      toast.success(`已导入 ${imported.length} 份乐谱`);
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
      title="导入乐谱"
      description="同名同作曲者的乐谱会自动合并为同一首乐曲的不同声部。"
      className="sm:max-w-lg"
      footer={(
        <>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>取消</Button>
          <Button variant="primary" disabled={readyItems.length === 0 || isBusy} onClick={importReadyItems}>
            {readyItems.length > 1 ? `导入 ${readyItems.length} 份` : '导入'}
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
                {item.prepared && <span className="text-xs text-fg-subtle tabular-nums">{item.prepared.pageCount} 页</span>}
                <IconButton label="移除" className="-mr-2 size-8" onClick={() => setItems(current => current.filter(entry => entry.key !== item.key))}>
                  <Trash2 />
                </IconButton>
              </div>
              {item.status === 'failed'
                ? <p className="text-sm text-danger">{item.error}</p>
                : (
                  <>
                    <Field label="标题">
                      <TextInput value={item.title} maxLength={120} onChange={event => patchItem(item.key, { title: event.target.value })} />
                    </Field>
                    <Field label="作曲 / 艺人">
                      <TextInput value={item.composer} maxLength={120} list="musheet-composers" placeholder="可选" onChange={event => patchItem(item.key, { composer: event.target.value })} />
                    </Field>
                    <InstrumentPicker value={item.choice} onChange={choice => patchItem(item.key, { choice })} />
                    {match && <p className="text-[13px] text-setlist">将作为新声部加入已有乐曲《{match.title}》</p>}
                    {item.error && <p className="text-[13px] text-danger">{item.error}</p>}
                  </>
                )}
            </section>
          );
        })}
        <PdfDropZone multiple onFiles={addFiles} hint={items.length > 0 ? '继续添加 PDF' : '拖入 PDF，或点击选择文件'} />
      </div>
    </Dialog>
  );
}

function ImportStatusIcon({ status }: { status: ImportStatus }) {
  if (status === 'uploading' || status === 'importing') return <Spinner className="size-4 text-score" />;
  if (status === 'failed') return <CircleAlert className="size-4 text-danger" />;
  return <CircleCheck className="size-4 text-setlist" />;
}
