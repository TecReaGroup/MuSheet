export type ViewLayout = 'single' | 'spread';

export type TurnResult = number | 'past-end' | 'before-start';

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

function pageStep(layout: ViewLayout) {
  return layout === 'spread' ? 2 : 1;
}

export function nextPage(page: number, layout: ViewLayout, pageCount: number): TurnResult {
  const target = page + pageStep(layout);
  return target <= pageCount ? target : 'past-end';
}

export function previousPage(page: number, layout: ViewLayout): TurnResult {
  return page > 1 ? Math.max(1, page - pageStep(layout)) : 'before-start';
}

export function clampPage(page: number, pageCount: number) {
  return Math.min(Math.max(1, Math.round(page)), pageCount);
}
