"use client";

import { useState } from "react";
import {
  SwipeableListItem,
  TrailingActions,
  SwipeAction,
} from "react-swipeable-list";
import { TrashIcon } from "@radix-ui/react-icons";
import type { MemoryBlock } from "@/lib/types";
import { GameIcon } from "@/components/shared/GameIcon";
import { TextAreaField } from "@/components/shared/TextAreaField";
import type { IconName } from "@/lib/icon-paths";

const CATEGORY_ICON: Record<MemoryBlock["category"], IconName> = {
  quest: "treasure-map",
  choice: "crossroads",
  character: "cowled",
  location: "castle",
  note: "quill-ink",
};

interface Props {
  block: MemoryBlock;
  onEdit: (content: string) => void;
  onRemove: () => void;
}

// One memory entry. On desktop, hover reveals an inline remove button and the
// text is click-to-edit. On touch, swipe left to reveal Edit / Delete (mouse
// swipe is opted out at the list level so it doesn't fight the hover affordance).
export function MemoryBlockRow({ block, onEdit, onRemove }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(block.content);

  const startEdit = () => {
    setDraft(block.content);
    setEditing(true);
  };

  const save = () => {
    const next = draft.trim();
    if (next && next !== block.content) onEdit(next);
    setEditing(false);
  };

  // Each action takes a firm fixed width (overriding the library's flex:1 on
  // its content) so the revealed tray has a stable intrinsic size. The IOS
  // type latches the tray open only when you drag past that measured width and
  // animates back to it on release — without a stable width the threshold is
  // erratic (the tray "never stays open") and the icons squish to nothing on a
  // partial swipe.
  const actionStyle = { flex: "0 0 72px", letterSpacing: "0.12em" };
  const trailingActions = (
    <TrailingActions>
      <SwipeAction onClick={startEdit}>
        <span
          className="flex h-full items-center justify-center gap-1.5 bg-stone-s2 font-ui text-[9px] uppercase text-gold-text"
          style={actionStyle}
        >
          <GameIcon name="quill-ink" size={14} /> Edit
        </span>
      </SwipeAction>
      <SwipeAction destructive onClick={onRemove}>
        <span
          className="flex h-full items-center justify-center gap-1.5 bg-blood-0 font-ui text-[9px] uppercase text-blood-text"
          style={actionStyle}
        >
          <TrashIcon className="h-3.5 w-3.5" /> Delete
        </span>
      </SwipeAction>
    </TrailingActions>
  );

  return (
    <SwipeableListItem
      trailingActions={editing ? undefined : trailingActions}
      blockSwipe={editing}
      className="mb-1.5"
    >
      <div className="group flex w-full items-start gap-2 border border-gold-b1 bg-stone-s0 px-2 py-1.5">
        <GameIcon
          name={CATEGORY_ICON[block.category]}
          size={14}
          className="mt-0.5 shrink-0 text-gold-b3"
        />
        {editing ? (
          <div className="flex-1">
            <TextAreaField
              autoFocus
              value={draft}
              onChange={setDraft}
              onBlur={save}
              rows={2}
              ariaLabel="Edit memory"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="flex-1 cursor-pointer text-left text-[14px] leading-snug text-text-t1 hover:text-text-t3"
          >
            {block.content}
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove memory"
          className="mt-0.5 hidden shrink-0 cursor-pointer text-gold-b2 opacity-0 transition-opacity hover:text-blood group-hover:opacity-100 md:block"
        >
          <TrashIcon className="h-3 w-3" />
        </button>
      </div>
    </SwipeableListItem>
  );
}
