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
    <section className="mt-8">
      <SectionHeader icon={icon} title={title} moreTo={moreTo} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}
