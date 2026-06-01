"use client";

import { useRef, type DragEvent, type ReactNode } from "react";
import { ChevronUpIcon, ChevronDownIcon, Cross2Icon } from "@radix-ui/react-icons";
import { GameIcon } from "./GameIcon";

interface Props {
  children: ReactNode;
  // Optional content on the right side of the row, before the controls.
  // Use for badges like "Top priority" or "(default)" pills.
  meta?: ReactNode;
  index: number;
  total: number;
  // Reorder. fromIndex → toIndex.
  onMove: (from: number, to: number) => void;
  onRemove?: () => void;
  removeLabel?: string;
  // Visual dimming only (e.g. for read-only rows). Does NOT hide the remove
  // button — that's controlled by whether onRemove is supplied.
  muted?: boolean;
}

// A row that participates in a reorderable list. Provides a drag handle
// (HTML5 drag-and-drop) AND up/down arrow buttons as a touch-friendly
// fallback. Used for ordered lists like the per-game source priority list.
//
// The parent is responsible for the actual reorder logic — this row just
// calls `onMove(fromIndex, toIndex)`. It marks rows with `data-list-index`
// for the drag handlers to read.
export function SortableListRow({
  children,
  meta,
  index,
  total,
  onMove,
  onRemove,
  removeLabel,
  muted,
}: Props) {
  const ref = useRef<HTMLLIElement>(null);

  const onDragStart = (e: DragEvent<HTMLLIElement>) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (e: DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (Number.isFinite(from) && from !== index) onMove(from, index);
  };

  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <li
      ref={ref}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex items-center gap-2 border px-2 py-1.5 ${
        muted
          ? "border-gold-b1 bg-stone-s0 text-text-t0"
          : "border-gold-b2 bg-stone-s0 text-text-t1"
      }`}
    >
      <span
        aria-hidden
        title="Drag to reorder"
        className="cursor-grab text-gold-b3 active:cursor-grabbing"
      >
        <GameIcon name="halberd" size={12} />
      </span>

      <span className="min-w-0 flex-1 truncate text-[14px]">{children}</span>

      {meta && <span className="shrink-0">{meta}</span>}

      <span className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => !isFirst && onMove(index, index - 1)}
          disabled={isFirst}
          aria-label="Move up"
          className="flex h-5 w-5 cursor-pointer items-center justify-center text-gold-b3 hover:text-gold disabled:cursor-default disabled:opacity-30"
        >
          <ChevronUpIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => !isLast && onMove(index, index + 1)}
          disabled={isLast}
          aria-label="Move down"
          className="flex h-5 w-5 cursor-pointer items-center justify-center text-gold-b3 hover:text-gold disabled:cursor-default disabled:opacity-30"
        >
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel ?? "Remove"}
            className="ml-1 flex h-5 w-5 cursor-pointer items-center justify-center text-gold-b3 hover:text-blood"
          >
            <Cross2Icon className="h-3 w-3" />
          </button>
        )}
      </span>
    </li>
  );
}
