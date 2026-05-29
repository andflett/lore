"use client";

import { TextAreaField } from "@/components/shared/TextAreaField";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export function LocationField({ value, onChange, onBlur, autoFocus }: Props) {
  return (
    <TextAreaField
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      autoFocus={autoFocus}
      rows={2}
      placeholder="e.g. Just started — or — Act 2, just reached the Avalon coast"
      ariaLabel="Current location in the game"
    />
  );
}
