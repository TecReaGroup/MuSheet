import { FileUp } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { defineText, useText } from '@/shared/i18n/text';
import { cn } from '@/shared/lib/class-name';
import { IMPORTABLE_FILE_ACCEPT, isImportableFile } from './prepare-pdf';

const DROP_ZONE_TEXT = defineText({
  'zh-CN': { supportedFormats: '支持 PDF 和图片，多张图片按文件名顺序合并为一个 PDF' },
  en: { supportedFormats: 'PDF or images; images merge into one PDF in file-name order' },
});

interface PdfDropZoneProps {
  onFiles: (files: File[]) => void;
  hint: string;
  className?: string;
}

export function PdfDropZone({ onFiles, hint, className }: PdfDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  const text = useText(DROP_ZONE_TEXT);

  const accept = (files: FileList | null) => {
    const importable = Array.from(files ?? []).filter(isImportableFile);
    if (importable.length > 0) onFiles(importable);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsOver(false);
    accept(event.dataTransfer.files);
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={event => { event.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-2 rounded-panel border-2 border-dashed px-4 py-6 text-center transition-colors',
        isOver ? 'border-score bg-score-soft' : 'border-border hover:border-score/50 hover:bg-muted/60',
        className,
      )}
    >
      <FileUp className="size-7 text-score" />
      <span className="text-sm font-medium text-fg">{hint}</span>
      <span className="text-xs text-fg-subtle">{text.supportedFormats}</span>
      <input
        ref={inputRef}
        type="file"
        accept={IMPORTABLE_FILE_ACCEPT}
        multiple
        className="hidden"
        onChange={event => {
          accept(event.target.files);
          event.target.value = '';
        }}
      />
    </button>
  );
}
