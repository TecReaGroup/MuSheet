import type { ReactNode } from 'react';

export function SettingGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 px-4 text-xs font-medium tracking-wide text-fg-quiet">{title}</h2>
      <div className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">{children}</div>
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-4">
      <span className="flex shrink-0 self-start pt-0.5 text-fg-muted [&_svg]:size-5">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium text-fg">{title}</div>
        {description && <div className="mt-0.5 text-[13px] leading-relaxed text-fg-quiet">{description}</div>}
      </div>
      {control}
    </div>
  );
}
