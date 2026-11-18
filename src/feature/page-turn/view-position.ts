import type { PageTurnMode } from '@/feature/preference/preference-store';

/**
 * `split` is the half-turn state: the top half already shows `page + 1`
 * while the bottom half still shows the end of `page`.
 */
export interface ViewPosition {
  page: number;
  split: boolean;
}

export type ViewLayout = 'single' | 'split' | 'spread';

export type TurnResult = ViewPosition | 'past-end' | 'before-start';

interface Size {
  width: number;
  height: number;
}

export function fitInto(page: Size, box: Size): Size {
  const scale = Math.min(box.width / page.width, box.height / page.height);
  return { width: page.width * scale, height: page.height * scale };
}

/** Two pages side by side only when the container is landscape and both fit at full height. */
export function canShowSpread(page: Size, box: Size) {
  if (box.width <= box.height) return false;
  const singleHeightWidth = page.width * (box.height / page.height);
  return singleHeightWidth * 2 <= box.width;
}

export function nextPosition(position: ViewPosition, layout: ViewLayout, mode: PageTurnMode, pageCount: number): TurnResult {
  if (layout === 'spread') {
    return position.page + 2 <= pageCount ? { page: position.page + 2, split: false } : 'past-end';
  }
  if (mode === 'half') {
    if (position.split) return { page: position.page + 1, split: false };
    return position.page < pageCount ? { page: position.page, split: true } : 'past-end';
  }
  return position.page < pageCount ? { page: position.page + 1, split: false } : 'past-end';
}

export function previousPosition(position: ViewPosition, layout: ViewLayout, mode: PageTurnMode): TurnResult {
  if (layout === 'spread') {
    return position.page > 1 ? { page: Math.max(1, position.page - 2), split: false } : 'before-start';
  }
  if (mode === 'half') {
    if (position.split) return { page: position.page, split: false };
    return position.page > 1 ? { page: position.page - 1, split: true } : 'before-start';
  }
  return position.page > 1 ? { page: position.page - 1, split: false } : 'before-start';
}

export function clampPage(page: number, pageCount: number) {
  return Math.min(Math.max(1, Math.round(page)), pageCount);
}
