import type { ReactNode } from 'react';
import { SectionHeader } from '@/shared/ui/section-header';

interface RecentShelfProps {
  title: string;
  moreTo: string;
  children: ReactNode;
}

export function RecentShelf({ title, moreTo, children }: RecentShelfProps) {
  return (
    <section className="mt-8">
      <SectionHeader title={title} moreTo={moreTo} />
      {children}
    </section>
  );
}
