"use client";

import { TextField } from "@/components/shared/TextField";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export function PlaythroughNameField({ value, onChange, onBlur, autoFocus }: Props) {
  return (
    <TextField
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      autoFocus={autoFocus}
      placeholder="Run 1"
      ariaLabel="Playthrough name"
    />
  );
}
