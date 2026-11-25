import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { readActiveSpace } from '@/entity/space/active-space';
import { useImportDialogStore } from '@/feature/score-import/import-dialog-store';
import { ImportScoreDialog } from '@/feature/score-import/import-score-dialog';
import { isPdfFile } from '@/feature/score-import/prepare-pdf';
import { CreateSetlistDialog } from '@/feature/setlist-edit/create-setlist-dialog';

/** Dropping PDFs anywhere in the app opens the import dialog, targeting the library of the content on screen. */
function useGlobalPdfDrop() {
  const openImport = useImportDialogStore(state => state.open);

  useEffect(() => {
    const carriesFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false;
    const handleDragOver = (event: DragEvent) => {
      if (carriesFiles(event)) event.preventDefault();
    };
    const handleDrop = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      const pdfs = Array.from(event.dataTransfer?.files ?? []).filter(isPdfFile);
      if (pdfs.length > 0) openImport(readActiveSpace(), pdfs);
    };
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [openImport]);
}

export function RootLayout() {
  useGlobalPdfDrop();
  return (
    <>
      <Outlet />
      <ImportScoreDialog />
      <CreateSetlistDialog />
    </>
  );
}
