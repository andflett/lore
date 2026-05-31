"use client";

// Heights mirror Btn's size scale exactly so a field and an adjacent button
// (e.g. a domain input + Add) line up flush in a flex row.
const HEIGHTS: Record<"sm" | "md" | "lg", number> = { sm: 30, md: 36, lg: 44 };

interface Props {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
  type?: "text" | "search";
  // Matches Btn sizes so paired field+button rows share a height. Defaults to
  // `lg` (44px) — the field's original natural height — so existing callers
  // are unchanged.
  size?: "sm" | "md" | "lg";
  // When true, renders a non-interactive, dimmed read-only field. Useful for
  // displaying immutable values (e.g. the game name in Settings).
  readOnly?: boolean;
}

// Themed single-line text input. Matches the stone-and-gold aesthetic used
// across onboarding and settings. Always use this — never an unstyled <input>.
// Font is locked at 16px regardless of size: smaller and iOS Safari zooms in
// on focus.
export function TextField({
  value,
  onChange,
  onBlur,
  placeholder,
  autoFocus,
  ariaLabel,
  type = "text",
  size = "lg",
  readOnly,
}: Props) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      readOnly={readOnly}
      style={{ height: HEIGHTS[size] }}
      className={`w-full border-2 px-3 text-[16px] outline-none placeholder:text-text-dim ${
        readOnly
          ? "cursor-not-allowed border-gold-b1 bg-stone-s0 text-text-t0"
          : "border-gold-b2 bg-stone-s0 text-text-t2 focus:border-gold"
      }`}
    />
  );
}
