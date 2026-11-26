/** Dropdown surface shared by `SuggestionInput` and `OptionSelect`, so free-text and fixed choices expand alike. */
export const OPTION_PANEL_STYLE = 'thin-scroll z-50 overflow-y-auto overscroll-contain rounded-card border border-border bg-surface-raised p-1 shadow-float data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in';

export const OPTION_ROW_STYLE = 'flex cursor-pointer select-none items-center gap-3 rounded-tag px-2.5 py-2 text-sm text-fg outline-none transition-colors duration-100 data-[highlighted]:bg-muted';
