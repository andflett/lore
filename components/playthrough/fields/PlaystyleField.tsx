"use client";

import { TextAreaField } from "@/components/shared/TextAreaField";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export function PlaystyleField({ value, onChange, onBlur, autoFocus }: Props) {
  return (
    <TextAreaField
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      autoFocus={autoFocus}
      rows={3}
      placeholder="e.g. playing blind, prefer stealth, don't spoil main story"
      ariaLabel="Playstyle and preferences"
    />
  );
}
