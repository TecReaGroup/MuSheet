import type { AnnotationTool } from '@contract/api';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const PEN_COLORS = ['#111827', '#dc2626', '#2563eb', '#059669', '#ea580c', '#7c3aed'] as const;
export const HIGHLIGHTER_COLORS = ['#facc15', '#4ade80', '#60a5fa', '#f472b6'] as const;

// Widths are fractions of page width so a mark keeps its size at any zoom or screen.
export const PEN_WIDTHS = [0.0018, 0.003, 0.005] as const;
const HIGHLIGHTER_WIDTH_FACTOR = 5;

export type WidthLevel = 0 | 1 | 2;
export type DrawingTool = AnnotationTool | 'eraser';

interface AnnotationToolState {
  tool: DrawingTool;
  penColor: string;
  highlighterColor: string;
  widthLevel: WidthLevel;
  update: (patch: Partial<Omit<AnnotationToolState, 'update'>>) => void;
}

export const useAnnotationToolStore = create<AnnotationToolState>()(persist(
  set => ({
    tool: 'pen',
    penColor: PEN_COLORS[1],
    highlighterColor: HIGHLIGHTER_COLORS[0],
    widthLevel: 1,
    update: patch => set(patch),
  }),
  { name: 'musheet.annotation-tool', version: 1 },
));

export function strokeStyleFor(tool: AnnotationTool, state: Pick<AnnotationToolState, 'penColor' | 'highlighterColor' | 'widthLevel'>) {
  const baseWidth = PEN_WIDTHS[state.widthLevel];
  return tool === 'pen'
    ? { color: state.penColor, width: baseWidth }
    : { color: state.highlighterColor, width: baseWidth * HIGHLIGHTER_WIDTH_FACTOR };
}
