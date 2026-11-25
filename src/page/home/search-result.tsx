import { ListMusic, Music, SearchX } from 'lucide-react';
import { useNavigate } from 'react-router';
import { scoreOpenPath } from '@/entity/score/open-score';
import { ScoreCard } from '@/entity/score/score-card';
import { SetlistCard } from '@/entity/setlist/setlist-card';
import { SpaceLabel } from '@/entity/space/space-label';
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
  const navigate = useNavigate();
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
            {setlistItems.map(setlist => <SetlistCard key={setlist.id} setlist={setlist} badge={<SpaceLabel space={setlist.space} />} onOpen={() => navigate(`/setlist/${setlist.id}`)} />)}
          </CardGrid>
        </section>
      )}
      {scoreItems.length > 0 && (
        <section>
          <SectionHeader icon={<Music />} title={<>{commonText.score}<ResultCount count={scoreItems.length} /></>} />
          <CardGrid>
            {scoreItems.map(score => <ScoreCard key={score.id} score={score} badge={<SpaceLabel space={score.space} />} onOpen={() => navigate(scoreOpenPath(score))} />)}
          </CardGrid>
        </section>
      )}
    </div>
  );
}
