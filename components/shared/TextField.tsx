"use client";

interface Props {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
  type?: "text" | "search";
  // When true, renders a non-interactive, dimmed read-only field. Useful for
  // displaying immutable values (e.g. the game name in Settings).
  readOnly?: boolean;
}

// Themed single-line text input. Matches the stone-and-gold aesthetic used
// across onboarding and settings. Always use this — never an unstyled <input>.
export function TextField({
  value,
  onChange,
  onBlur,
  placeholder,
  autoFocus,
  ariaLabel,
  type = "text",
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
      className={`w-full border-2 px-3 py-2 text-[16px] outline-none placeholder:text-text-dim ${
        readOnly
          ? "cursor-not-allowed border-gold-b1 bg-stone-s0 text-text-t0"
          : "border-gold-b2 bg-stone-s0 text-text-t2 focus:border-gold"
      }`}
    />
  );
}
