import { Check, Eraser, Highlighter, PenLine, Redo2, Trash2, Undo2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/class-name';
import { Button, IconButton } from '@/shared/ui/button';
import { HIGHLIGHTER_COLORS, PEN_COLORS, PEN_WIDTHS, useAnnotationToolStore, type DrawingTool, type WidthLevel } from './annotation-tool-store';
import type { AnnotationBookHandle } from './use-annotation-book';

interface AnnotationToolbarProps {
  book: AnnotationBookHandle;
  page: number;
  onDone: () => void;
}

function ToolToggle({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <IconButton label={label} onClick={onClick} aria-pressed={active} className={cn(active && 'bg-score-soft text-score hover:bg-score-soft hover:text-score')}>
      {children}
    </IconButton>
  );
}

export function AnnotationToolbar({ book, page, onDone }: AnnotationToolbarProps) {
  const { tool, penColor, highlighterColor, widthLevel, update } = useAnnotationToolStore();
  const colors = tool === 'highlighter' ? HIGHLIGHTER_COLORS : PEN_COLORS;
  const activeColor = tool === 'highlighter' ? highlighterColor : penColor;
  const selectTool = (next: DrawingTool) => update({ tool: next });

  return (
    <div className="w-full max-w-xl rounded-panel border border-border bg-surface/95 p-2 shadow-float backdrop-blur" onPointerDown={event => event.stopPropagation()}>
      <div className="flex items-center gap-0.5">
        <ToolToggle label="钢笔" active={tool === 'pen'} onClick={() => selectTool('pen')}><PenLine /></ToolToggle>
        <ToolToggle label="荧光笔" active={tool === 'highlighter'} onClick={() => selectTool('highlighter')}><Highlighter /></ToolToggle>
        <ToolToggle label="橡皮擦" active={tool === 'eraser'} onClick={() => selectTool('eraser')}><Eraser /></ToolToggle>
        <div className="mx-1 h-6 w-px bg-border" />
        <IconButton label="撤销" disabled={!book.canUndo(page)} onClick={() => book.undo(page)}><Undo2 /></IconButton>
        <IconButton label="重做" disabled={!book.canRedo(page)} onClick={() => book.redo(page)}><Redo2 /></IconButton>
        <IconButton label="清空本页" disabled={book.strokesOf(page).length === 0} onClick={() => book.clearPage(page)}><Trash2 /></IconButton>
        <Button variant="primary" size="sm" className="ml-auto rounded-full" onClick={onDone}>
          <Check />
          完成
        </Button>
      </div>
      {tool !== 'eraser' && (
        <div className="mt-1.5 flex items-center gap-2 border-t border-border px-1.5 pt-2">
          <div className="flex flex-1 items-center gap-1.5">
            {colors.map(color => (
              <button
                key={color}
                type="button"
                aria-label={`颜色 ${color}`}
                aria-pressed={color === activeColor}
                onClick={() => update(tool === 'highlighter' ? { highlighterColor: color } : { penColor: color })}
                className={cn('size-7 rounded-full border-2 transition-transform', color === activeColor ? 'scale-110 border-fg' : 'border-transparent')}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            {PEN_WIDTHS.map((_, level) => (
              <button
                key={level}
                type="button"
                aria-label={`粗细 ${level + 1}`}
                aria-pressed={level === widthLevel}
                onClick={() => update({ widthLevel: level as WidthLevel })}
                className={cn('flex size-8 items-center justify-center rounded-full', level === widthLevel ? 'bg-muted' : 'hover:bg-muted/60')}
              >
                <span className="rounded-full bg-fg" style={{ width: 4 + level * 4, height: 4 + level * 4 }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
