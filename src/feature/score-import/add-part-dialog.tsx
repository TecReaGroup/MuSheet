import type { ScoreSummary } from '@contract/api';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { partLabel } from '@/entity/part/instrument';
import { useAddPart } from '@/entity/part/part-api';
import { describeError } from '@/shared/api/http-client';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, readText, useText } from '@/shared/i18n/text';
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
import { UnreadableFileError, groupImportSources, importSourceName, preparePdf, type PreparedPdf } from './prepare-pdf';

const ADD_PART_TEXT = defineText({
  'zh-CN': {
    title: '添加声部',
    description: (scoreTitle: string) => `为《${scoreTitle}》添加另一份分谱`,
    added: (part: string) => `已添加${part}声部`,
  },
  en: {
    title: 'Add part',
    description: (scoreTitle: string) => `Add another part to "${scoreTitle}"`,
    added: (part: string) => `Added the ${part} part`,
  },
});

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
  const text = useText(ADD_PART_TEXT);
  const commonText = useText(COMMON_TEXT);
  const takenInstruments = score.parts.filter(part => part.instrument !== 'custom').map(part => part.instrument);

  const selectFiles = (files: File[]) => {
    // A part holds one PDF: the first PDF wins, otherwise all images merge into it.
    const [source] = groupImportSources(files);
    if (!source) return;
    const fileName = importSourceName(source);
    setUpload({ state: 'uploading', fileName });
    preparePdf(source)
      .then(prepared => setUpload({ state: 'ready', fileName, prepared }))
      .catch(error => {
        log('warn', 'Import', 'Preparing part PDF failed', serializeError(error));
        setUpload({ state: 'failed', message: error instanceof UnreadableFileError ? readText(COMMON_TEXT).unreadableFile : describeError(error) });
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
        toast.success(readText(ADD_PART_TEXT).added(partLabel(toPartSelection(choice))));
        close();
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => (next ? onOpenChange(true) : close())}
      title={text.title}
      description={text.description(score.title)}
      footer={(
        <>
          <Button variant="ghost" onClick={close}>{commonText.cancel}</Button>
          <Button variant="primary" disabled={upload.state !== 'ready' || !isChoiceComplete(choice) || addPart.isPending} onClick={submit}>
            {commonText.add}
          </Button>
        </>
      )}
    >
      <div className="space-y-4 pb-2">
        {upload.state === 'idle' || upload.state === 'failed'
          ? <PdfDropZone onFiles={selectFiles} hint={commonText.dropFileHint} />
          : (
            <div className="flex items-center gap-3 rounded-panel border border-border p-4">
              <FileText className="size-5 text-score" />
              <span className="min-w-0 flex-1 truncate text-sm">{upload.fileName}</span>
              {upload.state === 'uploading' ? <Spinner className="size-4" /> : <span className="text-xs text-fg-subtle tabular-nums">{commonText.pageCount(upload.prepared.pageCount)}</span>}
            </div>
          )}
        {upload.state === 'failed' && <p className="text-sm text-danger">{upload.message}</p>}
        <InstrumentPicker value={choice} onChange={setChoice} takenInstruments={takenInstruments} />
      </div>
    </Dialog>
  );
}
