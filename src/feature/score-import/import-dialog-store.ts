import { create } from 'zustand';

interface ImportDialogState {
  isOpen: boolean;
  /** Files handed over by a page-level drop or picker, consumed once by the dialog. */
  incomingFiles: File[];
  open: (files?: File[]) => void;
  close: () => void;
  takeIncomingFiles: () => File[];
}

export const useImportDialogStore = create<ImportDialogState>()((set, get) => ({
  isOpen: false,
  incomingFiles: [],
  open: (files = []) => set(state => ({ isOpen: true, incomingFiles: [...state.incomingFiles, ...files] })),
  close: () => set({ isOpen: false }),
  takeIncomingFiles: () => {
    const files = get().incomingFiles;
    if (files.length > 0) set({ incomingFiles: [] });
    return files;
  },
}));
