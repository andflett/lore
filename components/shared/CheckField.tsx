"use client";

import type { ReactNode } from "react";
import { GameIcon } from "./GameIcon";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}

// Themed checkbox: a hard-edged stone-s0 square that fills with a gold
// check-mark icon when on. The actual <input> is visually hidden but stays
// focusable / accessible. Click target wraps the full label.
export function CheckField({ checked, onChange, children, disabled }: Props) {
  return (
    <label
      className={`group flex cursor-pointer select-none items-center gap-2 text-[14px] text-text-t1 ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <span
        aria-hidden
        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center border-2 bg-stone-s0 peer-focus-visible:border-gold-bright group-hover:border-gold ${
          checked ? "border-gold" : "border-gold-b3"
        }`}
        style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" }}
      >
        {checked && <GameIcon name="check-mark" size={10} className="text-gold" />}
      </span>
      <span>{children}</span>
    </label>
  );
}
