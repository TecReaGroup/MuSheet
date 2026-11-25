import type { Space } from '@contract/api';
import { create } from 'zustand';

interface ImportDialogState {
  isOpen: boolean;
  /** Library the imported scores land in; fixed when the dialog opens. */
  space: Space;
  /** Files handed over by a page-level drop or picker, consumed once by the dialog. */
  incomingFiles: File[];
  open: (space: Space, files?: File[]) => void;
  close: () => void;
  takeIncomingFiles: () => File[];
}

export const useImportDialogStore = create<ImportDialogState>()((set, get) => ({
  isOpen: false,
  space: 'personal',
  incomingFiles: [],
  open: (space, files = []) => set(state => ({ isOpen: true, space, incomingFiles: [...state.incomingFiles, ...files] })),
  close: () => set({ isOpen: false }),
  takeIncomingFiles: () => {
    const files = get().incomingFiles;
    if (files.length > 0) set({ incomingFiles: [] });
    return files;
  },
}));
