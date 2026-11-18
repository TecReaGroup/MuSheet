import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface RecentShelfProps {
  title: string;
  moreTo: string;
  children: ReactNode;
}

export function RecentShelf({ title, moreTo, children }: RecentShelfProps) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[17px] font-semibold">{title}</h2>
        <Link to={moreTo} className="text-sm font-medium text-score hover:underline">全部</Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}
