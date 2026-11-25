import { LibraryBig, ListPlus, Plus, Upload } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { LibraryCollection } from '@/feature/library-search/sort-store';
import { useImportDialogStore } from '@/feature/score-import/import-dialog-store';
import { useCreateSetlistDialogStore } from '@/feature/setlist-edit/create-setlist-dialog';
import { TeamScoreCopyDialog, TeamSetlistCopyDialog } from '@/feature/team-share/team-copy-dialog';
import { useText } from '@/shared/i18n/text';
import { cn } from '@/shared/lib/class-name';
import { Dialog } from '@/shared/ui/dialog';
import { FloatingActionButton } from '@/shared/ui/floating-action-button';
import { LIBRARY_TEXT } from './library-text';

const TONE_STYLE = {
  score: 'bg-score-soft text-score-icon',
  setlist: 'bg-setlist-soft text-setlist-icon',
};

interface SourceOptionProps {
  icon: ReactNode;
  title: string;
  description: string;
  tone: LibraryCollection;
  onSelect: () => void;
}

function SourceOption({ icon, title, description, tone, onSelect }: SourceOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-4 rounded-card border border-border p-4 text-left transition-colors hover:bg-muted"
    >
      <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-card [&_svg]:size-6', TONE_STYLE[tone])}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-body font-semibold text-fg">{title}</span>
        <span className="mt-0.5 block text-caption text-fg-quiet">{description}</span>
      </span>
    </button>
  );
}

/** Team "+": a centered choice between copying from the personal library and adding something new. */
export function TeamAddButton({ collection }: { collection: LibraryCollection }) {
  const text = useText(LIBRARY_TEXT);
  const openImport = useImportDialogStore(state => state.open);
  const openCreateSetlist = useCreateSetlistDialogStore(state => state.open);
  const [isChoosing, setIsChoosing] = useState(false);
  const [isCopyingFromLibrary, setIsCopyingFromLibrary] = useState(false);
  const copy = text.teamAdd[collection];

  const choose = (next: () => void) => {
    setIsChoosing(false);
    next();
  };

  return (
    <>
      <FloatingActionButton label={copy.title} tone={collection} onClick={() => setIsChoosing(true)}><Plus /></FloatingActionButton>
      <Dialog open={isChoosing} onOpenChange={setIsChoosing} title={copy.title} className="pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-7">
        <div className="space-y-3">
          <SourceOption
            icon={<LibraryBig />}
            title={text.copyFromLibrary}
            description={copy.fromLibrary}
            tone={collection}
            onSelect={() => choose(() => setIsCopyingFromLibrary(true))}
          />
          {collection === 'score'
            ? <SourceOption icon={<Upload />} title={text.importFromDevice} description={copy.fresh} tone={collection} onSelect={() => choose(() => openImport('team'))} />
            : <SourceOption icon={<ListPlus />} title={text.newSetlist} description={copy.fresh} tone={collection} onSelect={() => choose(() => openCreateSetlist('team'))} />}
        </div>
      </Dialog>
      <TeamScoreCopyDialog open={isCopyingFromLibrary && collection === 'score'} onOpenChange={setIsCopyingFromLibrary} />
      <TeamSetlistCopyDialog open={isCopyingFromLibrary && collection === 'setlist'} onOpenChange={setIsCopyingFromLibrary} />
    </>
  );
}
