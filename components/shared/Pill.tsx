"use client";

import { GameIcon } from "./GameIcon";

interface Props {
  children: React.ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
  muted?: boolean; // dimmed style for locked/default items
}

// Compact, hard-edged tag. Optionally removable. Use for short labels like
// domains, categories, suggestion chips.
export function Pill({ children, onRemove, removeLabel, muted }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[13px] ${
        muted
          ? "border-gold-b1 bg-stone-s0 text-text-t0"
          : "border-gold-b2 bg-stone-s0 text-text-t1"
      }`}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? "Remove"}
          className="text-gold-b2 hover:text-blood"
        >
          <GameIcon name="cancel" size={10} />
        </button>
      )}
    </span>
  );
}
