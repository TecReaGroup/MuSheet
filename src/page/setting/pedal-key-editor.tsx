import { Keyboard, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { describeKey } from '@/feature/preference/preference-store';
import { cn } from '@/shared/lib/class-name';
import { Button } from '@/shared/ui/button';

interface PedalKeyEditorProps {
  keys: string[];
  onChange: (keys: string[]) => void;
}

/** Shows the keys bound to one direction and records a new one from the next key press (pedal tap). */
export function PedalKeyEditor({ keys, onChange }: PedalKeyEditorProps) {
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (!isRecording) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsRecording(false);
      if (event.key !== 'Escape' && !keys.includes(event.key)) onChange([...keys, event.key]);
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isRecording, keys, onChange]);

  return (
    <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:justify-end">
      {keys.map(key => (
        <span key={key} className="inline-flex items-center gap-1 rounded-tag bg-muted py-1 pl-2.5 pr-1 text-[13px] font-medium">
          {describeKey(key)}
          <button type="button" aria-label={`移除 ${describeKey(key)}`} disabled={keys.length === 1} onClick={() => onChange(keys.filter(item => item !== key))} className="rounded p-0.5 text-fg-subtle hover:text-fg disabled:invisible">
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <Button size="sm" variant="ghost" onClick={() => setIsRecording(true)} className={cn(isRecording && 'animate-pulse bg-score-soft text-score')}>
        <Keyboard />
        {isRecording ? '请按下按键…' : '添加'}
      </Button>
    </div>
  );
}
