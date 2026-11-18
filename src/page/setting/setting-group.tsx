import type { ReactNode } from 'react';

export function SettingGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="mb-2 px-1 text-[13px] font-medium text-fg-subtle">{title}</h2>
      <div className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">{children}</div>
    </section>
  );
}

export function SettingRow({ title, description, control }: { title: string; description?: string; control: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium">{title}</div>
        {description && <div className="mt-0.5 text-[13px] text-fg-muted">{description}</div>}
      </div>
      {control}
    </div>
  );
}
