"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  rows?: number;
  ariaLabel?: string;
}

// Themed multi-line textarea. Companion to TextField.
export function TextAreaField({
  value,
  onChange,
  onBlur,
  placeholder,
  autoFocus,
  rows = 3,
  ariaLabel,
}: Props) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      autoFocus={autoFocus}
      rows={rows}
      aria-label={ariaLabel}
      className="w-full resize-none border-2 border-gold-b2 bg-stone-s0 px-3 py-2 text-[16px] text-text-t2 outline-none placeholder:text-text-dim focus:border-gold"
    />
  );
}
