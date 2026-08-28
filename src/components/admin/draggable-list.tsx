"use client";

import { ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (newOrder: T[]) => void;
  renderItem: (item: T, dragHandleProps: React.HTMLAttributes<HTMLButtonElement>) => ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Sortable list with drag handle. Items get a "GripVertical" handle on the left.
 * Used for lessons, videos, questions, coupons, etc.
 */
export function DraggableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
  disabled = false,
}: DraggableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((it) => it.id === active.id);
    const newIndex = items.findIndex((it) => it.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
        <div className={cn("space-y-2", className)}>
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id} disabled={disabled}>
              {(dragHandleProps) => renderItem(item, dragHandleProps)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: (handleProps: React.HTMLAttributes<HTMLButtonElement>) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children({
        ...listeners,
        "aria-label": "اسحب لإعادة الترتيب",
        className: cn(
          "cursor-grab active:cursor-grabbing touch-none p-1 rounded-md text-muted hover:bg-surface2 hover:text-ink transition-colors",
          isDragging && "cursor-grabbing"
        ),
      } as React.HTMLAttributes<HTMLButtonElement>)}
    </div>
  );
}

export function DragHandle(props: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={cn("cursor-grab active:cursor-grabbing touch-none p-1 rounded-md text-muted hover:bg-surface2 hover:text-ink transition-colors", props.className)}>
      <GripVertical size={14} />
    </button>
  );
}