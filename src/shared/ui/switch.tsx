import { Switch as SwitchPrimitive } from 'radix-ui';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={label}
      className="relative h-7 w-12 shrink-0 rounded-full bg-muted transition-colors data-[state=checked]:bg-score"
    >
      <SwitchPrimitive.Thumb className="block size-6 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[22px]" />
    </SwitchPrimitive.Root>
  );
}
