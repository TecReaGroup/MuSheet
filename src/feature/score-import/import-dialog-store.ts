import type { Space } from '@contract/api';
import { create } from 'zustand';

interface ImportDialogState {
  isOpen: boolean;
  /** Library the imported score lands in; fixed when the dialog opens. */
  space: Space;
  /** Files handed over by a page-level drop, consumed once by the dialog; a newer drop replaces them. */
  incomingFiles: File[];
  open: (space: Space, files?: File[]) => void;
  close: () => void;
  takeIncomingFiles: () => File[];
}

export const useImportDialogStore = create<ImportDialogState>()((set, get) => ({
  isOpen: false,
  space: 'personal',
  incomingFiles: [],
  open: (space, files = []) => set({ isOpen: true, space, incomingFiles: files }),
  close: () => set({ isOpen: false }),
  takeIncomingFiles: () => {
    const files = get().incomingFiles;
    if (files.length > 0) set({ incomingFiles: [] });
    return files;
  },
}));
