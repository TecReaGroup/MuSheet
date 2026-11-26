import type { ScoreSummary } from '@contract/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAddPart } from '@/entity/part/part-api';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, readText, useText } from '@/shared/i18n/text';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { lastPartName, PartNamePicker, rememberPartName } from './part-name-picker';
import { PdfUploadField } from './pdf-upload-field';
import { usePdfUpload } from './use-pdf-upload';

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

export function AddPartDialog({ score, open, onOpenChange }: AddPartDialogProps) {
  const { upload, selectFiles, reset } = usePdfUpload();
  const [partName, setPartName] = useState(lastPartName);
  const addPart = useAddPart(score.id);
  const text = useText(ADD_PART_TEXT);
  const commonText = useText(COMMON_TEXT);

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const submit = () => {
    if (upload.state !== 'ready') return;
    addPart.mutate({ pdfSha256: upload.pdf.sha256, partName }, {
      onSuccess: () => {
        rememberPartName(partName);
        toast.success(readText(ADD_PART_TEXT).added(partName));
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
          <Button variant="primary" disabled={upload.state !== 'ready' || !partName || addPart.isPending} onClick={submit}>
            {commonText.add}
          </Button>
        </>
      )}
    >
      <div className="space-y-4 pb-2">
        <PdfUploadField upload={upload} onFiles={files => selectFiles(files)} onReplace={reset} />
        <PartNamePicker value={partName} onChange={setPartName} />
      </div>
    </Dialog>
  );
}
