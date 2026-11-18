import { MAX_POINTS_PER_STROKE, type Stroke } from '@contract/api';
import { useEffect, useRef, type PointerEvent } from 'react';
import { cn } from '@/shared/lib/class-name';
import { strokeStyleFor, useAnnotationToolStore } from './annotation-tool-store';
import { findStrokeAt, paintStrokes } from './stroke-render';

type Point = Stroke['points'][number];

export interface DrawingHandlers {
  onStroke: (stroke: Stroke) => void;
  onErase: (strokeIndex: number) => void;
}

interface AnnotationLayerProps {
  strokes: Stroke[];
  width: number;
  height: number;
  /** Present only while editing; without it the layer is display-only and lets gestures through. */
  drawing?: DrawingHandlers;
}

interface ActiveGesture {
  pointerId: number;
  points: Point[];
}

// Palm rejection: once a stylus has been seen, fingers stop drawing and go back to turning pages.
let stylusDetected = false;

const NO_PRESSURE = 0.5;

export function AnnotationLayer({ strokes, width, height, drawing }: AnnotationLayerProps) {
  const baseCanvas = useRef<HTMLCanvasElement>(null);
  const liveCanvas = useRef<HTMLCanvasElement>(null);
  const active = useRef<ActiveGesture | null>(null);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  useEffect(() => {
    if (baseCanvas.current) paintStrokes(baseCanvas.current, strokes, width, height);
  }, [strokes, width, height]);

  const shouldDraw = (event: PointerEvent) => {
    if (!drawing) return false;
    if (event.pointerType === 'pen') {
      stylusDetected = true;
      return true;
    }
    if (event.pointerType === 'touch') return !stylusDetected;
    return event.button === 0;
  };

  const toPoint = (event: PointerEvent<HTMLCanvasElement> | globalThis.PointerEvent, element: HTMLElement): Point => {
    // The bounding rect already includes any zoom transform on ancestors.
    const rect = element.getBoundingClientRect();
    const pressure = event.pointerType === 'pen' ? event.pressure : NO_PRESSURE;
    return [(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height, pressure];
  };

  const eraseAt = ([x, y]: Point) => {
    const index = findStrokeAt(strokesRef.current, x * width, y * height, width, height);
    if (index >= 0) drawing?.onErase(index);
  };

  const paintLive = (points: Point[]) => {
    const { tool, ...style } = useAnnotationToolStore.getState();
    if (!liveCanvas.current || tool === 'eraser') return;
    paintStrokes(liveCanvas.current, [{ tool, points, ...strokeStyleFor(tool, style) }], width, height);
  };

  const finishStroke = () => {
    const gesture = active.current;
    active.current = null;
    if (liveCanvas.current) paintStrokes(liveCanvas.current, [], width, height);
    const { tool, ...style } = useAnnotationToolStore.getState();
    if (!gesture || tool === 'eraser' || gesture.points.length === 0) return;
    drawing?.onStroke({ tool, points: gesture.points, ...strokeStyleFor(tool, style) });
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!shouldDraw(event)) return;
    event.stopPropagation();
    if (active.current) {
      // A second finger means a pinch, not a stroke.
      active.current = null;
      if (liveCanvas.current) paintStrokes(liveCanvas.current, [], width, height);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = toPoint(event, event.currentTarget);
    active.current = { pointerId: event.pointerId, points: [point] };
    if (useAnnotationToolStore.getState().tool === 'eraser') eraseAt(point);
    else paintLive(active.current.points);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const gesture = active.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    event.stopPropagation();
    // Coalesced events recover the full stylus sample rate (often 240Hz) lost to frame batching.
    const samples = event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent];
    const isErasing = useAnnotationToolStore.getState().tool === 'eraser';
    for (const sample of samples) {
      const point = toPoint(sample, event.currentTarget);
      if (isErasing) eraseAt(point);
      else if (gesture.points.length < MAX_POINTS_PER_STROKE) gesture.points.push(point);
    }
    if (!isErasing) paintLive(gesture.points);
  };

  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (active.current?.pointerId !== event.pointerId) return;
    event.stopPropagation();
    finishStroke();
  };

  return (
    <div className="pointer-events-none absolute inset-0">
      <canvas ref={baseCanvas} style={{ width, height }} className="absolute inset-0 mix-blend-multiply dark:mix-blend-normal" />
      <canvas
        ref={liveCanvas}
        style={{ width, height }}
        className={cn('absolute inset-0 touch-none', drawing && 'pointer-events-auto cursor-crosshair')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}
