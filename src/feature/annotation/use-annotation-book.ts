import type { AnnotationBook, Stroke } from '@contract/api';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { toast } from 'sonner';
import { requestJson, sendJsonOnUnload } from '@/shared/api/http-client';
import { log, serializeError } from '@/shared/lib/logger';

const SAVE_DELAY_MS = 800;
const NO_STROKES: Stroke[] = [];

interface PageHistory {
  past: Stroke[][];
  future: Stroke[][];
}

interface BookState {
  loaded: boolean;
  pages: Record<number, Stroke[]>;
  history: Record<number, PageHistory>;
}

type PageEdit =
  | { type: 'append'; page: number; stroke: Stroke }
  | { type: 'remove'; page: number; index: number }
  | { type: 'clear'; page: number }
  | { type: 'undo'; page: number }
  | { type: 'redo'; page: number };

type BookAction = { type: 'load'; book: AnnotationBook } | PageEdit;

const EMPTY_HISTORY: PageHistory = { past: [], future: [] };

function withPageStrokes(state: BookState, page: number, strokes: Stroke[], history: PageHistory): BookState {
  return { ...state, pages: { ...state.pages, [page]: strokes }, history: { ...state.history, [page]: history } };
}

function reduceBook(state: BookState, action: BookAction): BookState {
  if (action.type === 'load') {
    const pages = Object.fromEntries(Object.entries(action.book.pages).map(([page, strokes]) => [Number(page), strokes]));
    return { loaded: true, pages, history: {} };
  }
  const current = state.pages[action.page] ?? NO_STROKES;
  const history = state.history[action.page] ?? EMPTY_HISTORY;
  const recorded = (next: Stroke[]) => withPageStrokes(state, action.page, next, { past: [...history.past, current], future: [] });

  switch (action.type) {
    case 'append':
      return recorded([...current, action.stroke]);
    case 'remove':
      return recorded(current.filter((_, index) => index !== action.index));
    case 'clear':
      return current.length === 0 ? state : recorded([]);
    case 'undo': {
      const previous = history.past.at(-1);
      if (!previous) return state;
      return withPageStrokes(state, action.page, previous, { past: history.past.slice(0, -1), future: [current, ...history.future] });
    }
    case 'redo': {
      const [next, ...future] = history.future;
      if (!next) return state;
      return withPageStrokes(state, action.page, next, { past: [...history.past, current], future });
    }
  }
}

function pagePath(partId: string, page: number) {
  return `/api/part/${partId}/annotation/${page}`;
}

/**
 * Per-part annotation state with page-scoped undo/redo. Edits are saved per page after a short
 * idle delay; pending saves are flushed with keepalive when the viewer unmounts.
 * Mount one instance per part (key the owner by part id).
 */
export function useAnnotationBook(partId: string) {
  const [state, dispatch] = useReducer(reduceBook, { loaded: false, pages: {}, history: {} });
  const stateRef = useRef(state);
  stateRef.current = state;
  const pendingSaves = useRef(new Map<number, number>());

  const { data } = useQuery({
    queryKey: ['part', 'annotation', partId],
    queryFn: () => requestJson<AnnotationBook>('GET', `/api/part/${partId}/annotation`),
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (data && !stateRef.current.loaded) dispatch({ type: 'load', book: data });
  }, [data]);

  const scheduleSave = useCallback((page: number) => {
    window.clearTimeout(pendingSaves.current.get(page));
    pendingSaves.current.set(page, window.setTimeout(() => {
      pendingSaves.current.delete(page);
      const strokes = stateRef.current.pages[page] ?? NO_STROKES;
      requestJson<void>('PUT', pagePath(partId, page), { strokes }).catch(error => {
        log('error', 'Annotation', 'Saving page failed', { page, ...serializeError(error) });
        toast.error('标注保存失败，请检查网络');
      });
    }, SAVE_DELAY_MS));
  }, [partId]);

  useEffect(() => () => {
    for (const [page, timer] of pendingSaves.current) {
      window.clearTimeout(timer);
      sendJsonOnUnload('PUT', pagePath(partId, page), { strokes: stateRef.current.pages[page] ?? NO_STROKES });
    }
    pendingSaves.current.clear();
  }, [partId]);

  const edit = useCallback((action: PageEdit) => {
    dispatch(action);
    scheduleSave(action.page);
  }, [scheduleSave]);

  return {
    isLoaded: state.loaded,
    strokesOf: (page: number) => state.pages[page] ?? NO_STROKES,
    canUndo: (page: number) => (state.history[page]?.past.length ?? 0) > 0,
    canRedo: (page: number) => (state.history[page]?.future.length ?? 0) > 0,
    addStroke: (page: number, stroke: Stroke) => edit({ type: 'append', page, stroke }),
    removeStroke: (page: number, index: number) => edit({ type: 'remove', page, index }),
    clearPage: (page: number) => edit({ type: 'clear', page }),
    undo: (page: number) => edit({ type: 'undo', page }),
    redo: (page: number) => edit({ type: 'redo', page }),
  };
}

export type AnnotationBookHandle = ReturnType<typeof useAnnotationBook>;
