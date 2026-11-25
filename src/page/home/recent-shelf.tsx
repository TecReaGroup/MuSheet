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
      {children}
    </section>
  );
}
