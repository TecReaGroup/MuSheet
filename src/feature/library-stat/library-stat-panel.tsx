import type { LibraryStatView } from '@contract/api';
import { HardDrive, Layers, ListMusic, Music, PenLine, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import { Skeleton, skeletonKeys } from '@/shared/ui/skeleton';
import { useLibraryStat } from './library-stat-api';
import { LIBRARY_STAT_TEXT } from './library-stat-text';

const STAT_TILE_COUNT = 6;
const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

function formatByteSize(byteSize: number) {
  const exponent = byteSize === 0 ? 0 : Math.min(Math.floor(Math.log(byteSize) / Math.log(1024)), BYTE_UNITS.length - 1);
  const value = byteSize / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(1)} ${BYTE_UNITS[exponent]}`;
}

interface StatTileProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  detail?: string;
}

function StatTile({ icon, label, value, detail }: StatTileProps) {
  return (
    <div className="rounded-card bg-muted/50 p-3.5">
      <span className="flex items-center gap-2 text-caption font-medium text-fg-muted [&_svg]:size-4">{icon}{label}</span>
      <span className="mt-2 block animate-fade-in text-xl font-semibold leading-none text-fg tabular-nums">{value}</span>
      {detail && <span className="mt-1.5 block truncate text-xs text-fg-subtle tabular-nums">{detail}</span>}
    </div>
  );
}

function StatTileSkeleton() {
  return (
    <div className="rounded-card bg-muted/50 p-3.5">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="mt-2 h-5 w-10" />
      <Skeleton className="mt-1.5 h-3 w-24" />
    </div>
  );
}

function StatTiles({ stat }: { stat: LibraryStatView }) {
  const text = useText(LIBRARY_STAT_TEXT);
  const commonText = useText(COMMON_TEXT);
  return (
    <>
      <StatTile icon={<UsersRound />} label={text.user} value={stat.userCount} />
      <StatTile icon={<Music />} label={commonText.score} value={stat.score.personal + stat.score.team} detail={text.spaceSplit(stat.score.personal, stat.score.team)} />
      <StatTile icon={<ListMusic />} label={commonText.setlist} value={stat.setlist.personal + stat.setlist.team} detail={text.spaceSplit(stat.setlist.personal, stat.setlist.team)} />
      <StatTile icon={<Layers />} label={text.part} value={stat.partCount} />
      <StatTile icon={<PenLine />} label={text.annotatedPage} value={stat.annotatedPageCount} />
      <StatTile icon={<HardDrive />} label={text.storage} value={formatByteSize(stat.pdfByteSize)} detail={text.pdfFileCount(stat.pdfFileCount)} />
    </>
  );
}

/** Root-only server totals; the endpoint answers 403 for everyone else. */
export function LibraryStatPanel() {
  const { data: stat } = useLibraryStat();
  const text = useText(LIBRARY_STAT_TEXT);
  return (
    <section className="mb-8 rounded-panel border border-border bg-surface p-4">
      <p className="mb-3.5 text-caption leading-relaxed text-fg-quiet">{text.description}</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {stat ? <StatTiles stat={stat} /> : skeletonKeys(STAT_TILE_COUNT).map(key => <StatTileSkeleton key={key} />)}
      </div>
    </section>
  );
}
