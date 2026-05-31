"use client";

import type { ReactNode } from "react";

interface Props<T extends string> {
  value: T;
  onChange: (value: T) => void;
  children: ReactNode;
  ariaLabel?: string;
  // Compact form for inline usage (e.g. add-memory dropdown).
  size?: "sm" | "md";
}

// Themed native <select>. Children are <option> / <optgroup> elements
// supplied by the caller — we own the chrome, callers own the options.
// Font is locked at 16px (text-base) regardless of size — smaller and iOS
// Safari zooms in on focus. Size only tunes padding.
export function SelectField<T extends string>({
  value,
  onChange,
  children,
  ariaLabel,
  size = "md",
}: Props<T>) {
  const sizing =
    size === "sm"
      ? "px-2 py-1 text-[16px]"
      : "px-3 py-2 text-[16px]";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      aria-label={ariaLabel}
      className={`w-full appearance-none border-2 border-gold-b2 bg-stone-s0 text-text-t2 outline-none focus:border-gold ${sizing}`}
      style={{
        backgroundImage:
          "linear-gradient(45deg, transparent 50%, var(--color-gold-b3) 50%), linear-gradient(135deg, var(--color-gold-b3) 50%, transparent 50%)",
        backgroundPosition: "calc(100% - 14px) center, calc(100% - 9px) center",
        backgroundSize: "5px 5px, 5px 5px",
        backgroundRepeat: "no-repeat",
        paddingRight: "26px",
      }}
    >
      {children}
    </select>
  );
}
