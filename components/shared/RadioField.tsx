"use client";

import type { ReactNode } from "react";

interface Props<T extends string> {
  name: string;
  value: T;
  selected: T;
  onChange: (value: T) => void;
  children: ReactNode;
  disabled?: boolean;
}

// Themed radio: hard-edged outer square with a smaller inner square that
// fills with gold when selected. Native <input> stays focusable and grouped
// by `name` so keyboard arrows work.
export function RadioField<T extends string>({
  name,
  value,
  selected,
  onChange,
  children,
  disabled,
}: Props<T>) {
  const isSelected = selected === value;
  return (
    <label
      className={`group flex cursor-pointer select-none items-center gap-2 text-[14px] text-text-t1 ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={isSelected}
        onChange={() => onChange(value)}
        disabled={disabled}
        className="sr-only peer"
      />
      <span
        aria-hidden
        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center border-2 bg-stone-s0 peer-focus-visible:border-gold-bright group-hover:border-gold ${
          isSelected ? "border-gold" : "border-gold-b3"
        }`}
        style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" }}
      >
        {isSelected && <span className="block h-2 w-2 bg-gold" />}
      </span>
      <span>{children}</span>
    </label>
  );
}
