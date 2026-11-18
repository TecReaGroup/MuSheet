import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';

const TAP_MAX_MOVE_PX = 10;
const TAP_MAX_DURATION_MS = 300;
const SWIPE_MIN_DISTANCE_PX = 60;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
// Pinching back to within this of 1× snaps to "not zoomed" so swipe-to-turn comes back.
const ZOOM_SNAP = 1.05;
const WHEEL_ZOOM_SPEED = 0.01;

export interface ZoomTransform {
  scale: number;
  x: number;
  y: number;
}

const IDENTITY: ZoomTransform = { scale: 1, x: 0, y: 0 };

interface GestureCallbacks {
  /** `xRatio` is the tap position across the viewport, 0 (left) to 1 (right). */
  onTap: (xRatio: number) => void;
  onSwipe: (direction: 'next' | 'previous') => void;
}

interface TrackedPointer {
  x: number;
  y: number;
  startX: number;
  startY: number;
  startTime: number;
}

interface PinchStart {
  distance: number;
  transform: ZoomTransform;
  /** Content point under the fingers' midpoint when the pinch began. */
  anchorX: number;
  anchorY: number;
}

function clampTransform(transform: ZoomTransform, width: number, height: number): ZoomTransform {
  const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, transform.scale));
  return {
    scale,
    x: Math.min(0, Math.max(width - width * scale, transform.x)),
    y: Math.min(0, Math.max(height - height * scale, transform.y)),
  };
}

/**
 * Tap / swipe / pinch / pan recogniser for the score stage. Hand-rolled on Pointer Events
 * because page turning and zoom must share one pointer model with the annotation layer,
 * which stops propagation for strokes it draws.
 */
export function useViewerGesture(stageRef: RefObject<HTMLElement | null>, callbacks: GestureCallbacks) {
  const [transform, setTransform] = useState<ZoomTransform>(IDENTITY);
  const pointers = useRef(new Map<number, TrackedPointer>());
  const pinch = useRef<PinchStart | null>(null);
  const hadMultiTouch = useRef(false);
  const transformRef = useRef(transform);
  transformRef.current = transform;
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const applyTransform = useCallback((next: ZoomTransform, element: HTMLElement) => {
    const clamped = clampTransform(next, element.clientWidth, element.clientHeight);
    setTransform(clamped.scale < ZOOM_SNAP && !pinch.current ? IDENTITY : clamped);
  }, []);

  const resetZoom = useCallback(() => setTransform(IDENTITY), []);

  const localPoint = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startPinch = () => {
    const [a, b] = [...pointers.current.values()];
    if (!a || !b) return;
    const current = transformRef.current;
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    pinch.current = {
      distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      transform: current,
      anchorX: (midX - current.x) / current.scale,
      anchorY: (midY - current.y) / current.scale,
    };
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    const { x, y } = localPoint(event);
    pointers.current.set(event.pointerId, { x, y, startX: x, startY: y, startTime: performance.now() });
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.current.size === 2) {
      hadMultiTouch.current = true;
      startPinch();
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const tracked = pointers.current.get(event.pointerId);
    if (!tracked) return;
    const { x, y } = localPoint(event);
    const deltaX = x - tracked.x;
    const deltaY = y - tracked.y;
    tracked.x = x;
    tracked.y = y;

    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const start = pinch.current;
      const scale = start.transform.scale * (Math.hypot(a!.x - b!.x, a!.y - b!.y) / start.distance);
      const midX = (a!.x + b!.x) / 2;
      const midY = (a!.y + b!.y) / 2;
      applyTransform({ scale, x: midX - start.anchorX * scale, y: midY - start.anchorY * scale }, event.currentTarget);
      return;
    }
    const current = transformRef.current;
    if (pointers.current.size === 1 && current.scale > 1) {
      applyTransform({ ...current, x: current.x + deltaX, y: current.y + deltaY }, event.currentTarget);
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const tracked = pointers.current.get(event.pointerId);
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2 && pinch.current) {
      pinch.current = null;
      applyTransform(transformRef.current, event.currentTarget);
    }
    if (!tracked || event.type === 'pointercancel') return;
    if (pointers.current.size > 0) return;
    const wasMultiTouch = hadMultiTouch.current;
    hadMultiTouch.current = false;
    if (wasMultiTouch) return;

    const moveX = tracked.x - tracked.startX;
    const moveY = tracked.y - tracked.startY;
    const duration = performance.now() - tracked.startTime;
    if (Math.hypot(moveX, moveY) < TAP_MAX_MOVE_PX && duration < TAP_MAX_DURATION_MS) {
      callbacksRef.current.onTap(tracked.x / event.currentTarget.clientWidth);
    } else if (transformRef.current.scale === 1 && Math.abs(moveX) > SWIPE_MIN_DISTANCE_PX && Math.abs(moveX) > Math.abs(moveY)) {
      callbacksRef.current.onSwipe(moveX < 0 ? 'next' : 'previous');
    }
  };

  // Trackpad pinch arrives as ctrl+wheel. Attached natively because React wheel listeners are
  // passive and could not stop the browser's own page zoom.
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const handleWheel = (event: globalThis.WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const current = transformRef.current;
      const scale = current.scale * Math.exp(-event.deltaY * WHEEL_ZOOM_SPEED);
      const anchorX = (x - current.x) / current.scale;
      const anchorY = (y - current.y) / current.scale;
      applyTransform({ scale, x: x - anchorX * scale, y: y - anchorY * scale }, element);
    };
    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [stageRef, applyTransform]);

  return {
    transform,
    resetZoom,
    bind: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
