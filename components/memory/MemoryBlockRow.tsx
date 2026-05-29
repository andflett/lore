"use client";

import { useState } from "react";
import type { MemoryBlock } from "@/lib/types";
import { GameIcon } from "@/components/shared/GameIcon";

const CATEGORY_ICON: Record<MemoryBlock["category"], string> = {
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

export function MemoryBlockRow({ block, onEdit, onRemove }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(block.content);

  const save = () => {
    const next = draft.trim();
    if (next && next !== block.content) onEdit(next);
    setEditing(false);
  };

  return (
    <li className="group flex items-start gap-2 border border-gold-b1 bg-stone-s0 px-2 py-1.5">
      <GameIcon
        name={CATEGORY_ICON[block.category]}
        size={14}
        className="mt-0.5 shrink-0 text-gold-b3"
      />
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          rows={2}
          className="flex-1 resize-none border border-gold-b2 bg-stone-s1 px-1.5 py-1 text-[14px] text-text-t2 outline-none focus:border-gold"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(block.content);
            setEditing(true);
          }}
          className="flex-1 text-left text-[14px] leading-snug text-text-t1 hover:text-text-t3"
        >
          {block.content}
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove memory"
        className="mt-0.5 shrink-0 text-gold-b2 opacity-0 transition-opacity hover:text-blood group-hover:opacity-100"
      >
        <GameIcon name="cancel" size={12} />
      </button>
    </li>
  );
}
