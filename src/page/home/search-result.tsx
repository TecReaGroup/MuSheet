import { ListMusic, Music, SearchX } from 'lucide-react';
import { ScoreListItem } from '@/feature/library-item/score-list-item';
import { SetlistListItem } from '@/feature/library-item/setlist-list-item';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import { CardGrid, CardGridSkeleton } from '@/shared/ui/card-grid';
import { EmptyState } from '@/shared/ui/empty-state';
import { SectionHeader } from '@/shared/ui/section-header';
import { HOME_TEXT } from './home-text';
import { useScoresFromBothSpaces, useSetlistsFromBothSpaces } from './use-both-spaces';

const RESULT_LIMIT = 30;
const RESULT_SKELETON_COUNT = 6;

function ResultCount({ count }: { count: number }) {
  return <span className="ml-1 text-base font-normal text-fg-subtle tabular-nums">{count}</span>;
}

export function SearchResult({ query }: { query: string }) {
  const text = useText(HOME_TEXT);
  const commonText = useText(COMMON_TEXT);
  const scores = useScoresFromBothSpaces({ query, sort: 'title', order: 'asc', limit: RESULT_LIMIT }, (left, right) => left.title.localeCompare(right.title));
  const setlists = useSetlistsFromBothSpaces({ query, sort: 'title', order: 'asc', limit: RESULT_LIMIT }, (left, right) => left.name.localeCompare(right.name));

  if (scores.isPending || setlists.isPending) return <CardGridSkeleton count={RESULT_SKELETON_COUNT} />;
  const scoreItems = scores.items;
  const setlistItems = setlists.items;
  if (scoreItems.length === 0 && setlistItems.length === 0) {
    return <EmptyState icon={<SearchX />} title={text.noMatchTitle} description={text.noMatchDescription} />;
  }

  return (
    <div className="space-y-8">
      {setlistItems.length > 0 && (
        <section>
          <SectionHeader icon={<ListMusic />} title={<>{commonText.setlist}<ResultCount count={setlistItems.length} /></>} />
          <CardGrid>
            {setlistItems.map(setlist => <SetlistListItem key={setlist.id} setlist={setlist} />)}
          </CardGrid>
        </section>
      )}
      {scoreItems.length > 0 && (
        <section>
          <SectionHeader icon={<Music />} title={<>{commonText.score}<ResultCount count={scoreItems.length} /></>} />
          <CardGrid>
            {scoreItems.map(score => <ScoreListItem key={score.id} score={score} />)}
          </CardGrid>
        </section>
      )}
    </div>
  );
}
