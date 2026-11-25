import type { ReactNode } from 'react';

export function SettingGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      {title && <h2 className="mb-2.5 px-1 text-[13px] font-semibold text-fg-quiet">{title}</h2>}
      <div className="divide-y divide-border overflow-hidden rounded-panel border border-border bg-surface">{children}</div>
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
    <div className="flex items-center justify-between gap-6 px-4 py-3.5">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-card bg-muted text-fg-muted [&_svg]:size-[18px]">{icon}</span>
        <div className="min-w-0">
          <div className="text-[15px] font-medium text-fg">{title}</div>
          {description && <div className="mt-0.5 text-[13px] leading-relaxed text-fg-quiet">{description}</div>}
        </div>
      </div>
      <div className="flex max-w-[55%] shrink-0 justify-end">{control}</div>
    </div>
  );
}
