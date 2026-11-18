import type { ReactNode } from 'react';
import { SectionHeader } from '@/shared/ui/section-header';

interface RecentShelfProps {
  icon: ReactNode;
  title: string;
  moreTo: string;
  children: ReactNode;
}

export function RecentShelf({ icon, title, moreTo, children }: RecentShelfProps) {
  return (
    <section className="mt-6">
      <SectionHeader icon={icon} title={title} moreTo={moreTo} />
      <div className="grid gap-3 lg:grid-cols-2">{children}</div>
    </section>
  );
}
