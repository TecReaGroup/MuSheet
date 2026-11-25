import { FileUp } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { defineText, useText } from '@/shared/i18n/text';
import { cn } from '@/shared/lib/class-name';
import { isPdfFile } from './prepare-pdf';

const DROP_ZONE_TEXT = defineText({
  'zh-CN': { pdfOnly: '仅支持 PDF' },
  en: { pdfOnly: 'PDF only' },
});

interface PdfDropZoneProps {
  onFiles: (files: File[]) => void;
  multiple: boolean;
  hint: string;
  className?: string;
}

export function PdfDropZone({ onFiles, multiple, hint, className }: PdfDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  const text = useText(DROP_ZONE_TEXT);

  const accept = (files: FileList | null) => {
    const pdfs = Array.from(files ?? []).filter(isPdfFile);
    if (pdfs.length > 0) onFiles(multiple ? pdfs : pdfs.slice(0, 1));
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
      <span className="text-xs text-fg-subtle">{text.pdfOnly}</span>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple={multiple}
        className="hidden"
        onChange={event => {
          accept(event.target.files);
          event.target.value = '';
        }}
      />
    </button>
  );
}
