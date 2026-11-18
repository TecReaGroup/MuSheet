import { Slider as SliderPrimitive } from 'radix-ui';
import { cn } from '../lib/class-name';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  onChange: (value: number) => void;
  className?: string;
}

export function Slider({ value, min, max, step = 1, label, onChange, className }: SliderProps) {
  return (
    <SliderPrimitive.Root
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={([next]) => onChange(next!)}
      className={cn('relative flex h-6 w-full touch-none select-none items-center', className)}
    >
      <SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range className="absolute h-full bg-score" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb aria-label={label} className="block size-5 rounded-full border-2 border-score bg-surface shadow-sm" />
    </SliderPrimitive.Root>
  );
}
