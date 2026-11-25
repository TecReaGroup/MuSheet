import { ZoomIn, ZoomOut } from 'lucide-react';
import { useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import { Button } from '@/shared/ui/button';
import { Slider } from '@/shared/ui/slider';
import { ACCOUNT_TEXT } from './account-text';
import type { SquareCrop } from './crop-avatar-image';

// Matches the `size-64` viewport below; crop math works in these CSS pixels.
const VIEWPORT_PIXELS = 256;
const MAX_ZOOM = 4;
const WHEEL_ZOOM_SPEED = 0.002;

interface Point {
  x: number;
  y: number;
}

interface AvatarCropperProps {
  image: HTMLImageElement;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: (crop: SquareCrop) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Drag to pan, slider or wheel to zoom; the image always covers the circular viewport. */
export function AvatarCropper({ image, isSaving, onCancel, onConfirm }: AvatarCropperProps) {
  const text = useText(ACCOUNT_TEXT);
  const commonText = useText(COMMON_TEXT);
  const { naturalWidth: width, naturalHeight: height } = image;
  const coverScale = VIEWPORT_PIXELS / Math.min(width, height);
  const [zoom, setZoom] = useState(1);
  // Image top-left relative to the viewport; always <= 0 so no gap shows.
  const [offset, setOffset] = useState<Point>(() => ({
    x: (VIEWPORT_PIXELS - width * coverScale) / 2,
    y: (VIEWPORT_PIXELS - height * coverScale) / 2,
  }));
  const dragStart = useRef<Point | null>(null);
  const scale = coverScale * zoom;

  const clampOffset = (next: Point, nextScale: number): Point => ({
    x: clamp(next.x, VIEWPORT_PIXELS - width * nextScale, 0),
    y: clamp(next.y, VIEWPORT_PIXELS - height * nextScale, 0),
  });

  // Zooms around the viewport center so the subject stays put.
  const changeZoom = (requested: number) => {
    const nextZoom = clamp(requested, 1, MAX_ZOOM);
    const nextScale = coverScale * nextZoom;
    const half = VIEWPORT_PIXELS / 2;
    const ratio = nextScale / scale;
    setOffset(clampOffset({ x: half - (half - offset.x) * ratio, y: half - (half - offset.y) * ratio }, nextScale));
    setZoom(nextZoom);
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
  };

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    setOffset(clampOffset({ x: event.clientX - dragStart.current.x, y: event.clientY - dragStart.current.y }, scale));
  };

  const endDrag = () => {
    dragStart.current = null;
  };

  const confirm = () => onConfirm({ x: -offset.x / scale, y: -offset.y / scale, side: VIEWPORT_PIXELS / scale });

  return (
    <div className="pt-4 pb-6">
      <div
        className="relative mx-auto size-64 cursor-grab touch-none select-none overflow-hidden rounded-panel bg-muted active:cursor-grabbing"
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={(event: WheelEvent) => changeZoom(zoom * Math.exp(-event.deltaY * WHEEL_ZOOM_SPEED))}
      >
        <img
          src={image.src}
          alt=""
          draggable={false}
          className="absolute top-0 left-0 max-w-none"
          style={{ width: width * scale, height: height * scale, transform: `translate(${offset.x}px, ${offset.y}px)` }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgb(0_0_0/0.45)] ring-2 ring-white/80" />
      </div>

      <div className="mx-auto mt-6 flex max-w-64 items-center gap-3 text-fg-subtle">
        <ZoomOut className="size-4 shrink-0" />
        <Slider value={zoom} min={1} max={MAX_ZOOM} step={0.01} label={text.zoom} onChange={changeZoom} />
        <ZoomIn className="size-4 shrink-0" />
      </div>

      <div className="mt-8 flex justify-end gap-2">
        <Button variant="ghost" disabled={isSaving} onClick={onCancel}>{commonText.cancel}</Button>
        <Button variant="primary" disabled={isSaving} onClick={confirm}>{commonText.save}</Button>
      </div>
    </div>
  );
}
