import type { ScoreSummary } from '@contract/api';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { partLabel } from '@/entity/part/instrument';
import { useAddPart } from '@/entity/part/part-api';
import { describeError } from '@/shared/api/http-client';
import { log, serializeError } from '@/shared/lib/logger';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Spinner } from '@/shared/ui/spinner';
import {
  InstrumentPicker,
  isChoiceComplete,
  lastInstrumentChoice,
  rememberInstrumentChoice,
  toPartSelection,
  type InstrumentChoice,
} from './instrument-picker';
import { PdfDropZone } from './pdf-drop-zone';
import { PdfReadError, preparePdf, type PreparedPdf } from './prepare-pdf';

interface AddPartDialogProps {
  score: ScoreSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Upload =
  | { state: 'idle' }
  | { state: 'uploading'; fileName: string }
  | { state: 'ready'; fileName: string; prepared: PreparedPdf }
  | { state: 'failed'; message: string };

export function AddPartDialog({ score, open, onOpenChange }: AddPartDialogProps) {
  const [upload, setUpload] = useState<Upload>({ state: 'idle' });
  const [choice, setChoice] = useState<InstrumentChoice>(lastInstrumentChoice);
  const addPart = useAddPart(score.id);
  const takenInstruments = score.parts.filter(part => part.instrument !== 'custom').map(part => part.instrument);

  const selectFile = ([file]: File[]) => {
    if (!file) return;
    setUpload({ state: 'uploading', fileName: file.name });
    preparePdf(file)
      .then(prepared => setUpload({ state: 'ready', fileName: file.name, prepared }))
      .catch(error => {
        log('warn', 'Import', 'Preparing part PDF failed', serializeError(error));
        setUpload({ state: 'failed', message: error instanceof PdfReadError ? '无法读取该 PDF' : describeError(error) });
      });
  };

  const close = () => {
    onOpenChange(false);
    setUpload({ state: 'idle' });
  };

  const submit = () => {
    if (upload.state !== 'ready') return;
    addPart.mutate({ pdfSha256: upload.prepared.sha256, ...toPartSelection(choice) }, {
      onSuccess: () => {
        rememberInstrumentChoice(choice);
        toast.success(`已添加${partLabel(toPartSelection(choice))}声部`);
        close();
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => (next ? onOpenChange(true) : close())}
      title="添加声部"
      description={`为《${score.title}》添加另一份分谱`}
      footer={(
        <>
          <Button variant="ghost" onClick={close}>取消</Button>
          <Button variant="primary" disabled={upload.state !== 'ready' || !isChoiceComplete(choice) || addPart.isPending} onClick={submit}>
            添加
          </Button>
        </>
      )}
    >
      <div className="space-y-4 pb-2">
        {upload.state === 'idle' || upload.state === 'failed'
          ? <PdfDropZone multiple={false} onFiles={selectFile} hint="拖入 PDF，或点击选择文件" />
          : (
            <div className="flex items-center gap-3 rounded-panel border border-border p-4">
              <FileText className="size-5 text-score" />
              <span className="min-w-0 flex-1 truncate text-sm">{upload.fileName}</span>
              {upload.state === 'uploading' ? <Spinner className="size-4" /> : <span className="text-xs text-fg-subtle tabular-nums">{upload.prepared.pageCount} 页</span>}
            </div>
          )}
        {upload.state === 'failed' && <p className="text-sm text-danger">{upload.message}</p>}
        <InstrumentPicker value={choice} onChange={setChoice} takenInstruments={takenInstruments} />
      </div>
    </Dialog>
  );
}
