import type { ReactNode } from 'react';

export function SettingGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2.5 px-1 text-[13px] font-semibold text-fg-quiet">{title}</h2>
      <div className="divide-y divide-border overflow-hidden rounded-panel border border-border bg-surface shadow-card">{children}</div>
    </section>
  );
}

interface SettingRowProps {
  icon: ReactNode;
  title: string;
  description?: string;
  control: ReactNode;
}

export function SettingRow({ icon, title, description, control }: SettingRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 px-4 py-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center self-start rounded-card bg-muted text-fg-muted [&_svg]:size-[18px]">{icon}</span>
      <div className="min-w-0 flex-1 self-center">
        <div className="text-[15px] font-medium text-fg">{title}</div>
        {description && <div className="mt-0.5 text-[13px] leading-relaxed text-fg-quiet">{description}</div>}
      </div>
      {control}
    </div>
  );
}
