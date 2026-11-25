import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import { COMMON_TEXT } from '../i18n/common-text';
import { useText } from '../i18n/text';
import { cn } from '../lib/class-name';

interface SortableListProps<T> {
  items: T[];
  getId: (item: T) => string;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, dragHandle: ReactNode) => ReactNode;
}

/** Vertical list reordered by a drag handle, so tapping the row itself still opens it. */
export function SortableList<T>({ items, getId, onReorder, renderItem }: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(getId);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onReorder(arrayMove(items, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <SortableRow key={ids[index]} id={ids[index]!}>
              {handle => renderItem(item, index, handle)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

/** Card frame for a `SortableList` row: drag handle first, then the row's own content. */
export function SortableRowCard({ dragHandle, children }: { dragHandle: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-panel border border-border bg-surface py-2.5 pl-1 pr-1.5 transition-colors hover:border-score/30">
      {dragHandle}
      {children}
    </div>
  );
}

function SortableRow({ id, children }: { id: string; children: (dragHandle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const text = useText(COMMON_TEXT);
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={text.dragToReorder}
      className="relative flex h-10 w-7 touch-none cursor-grab items-center justify-center rounded-tag text-fg-subtle hover:bg-muted active:cursor-grabbing"
    >
      <GripVertical className="size-4" />
    </button>
  );
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10 opacity-90 [&>*]:shadow-float')}
    >
      {children(handle)}
    </li>
  );
}
