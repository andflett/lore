"use client";

import { TextField } from "@/components/shared/TextField";

interface Props {
  name: string;
  className: string;
  onNameChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export function CharacterFields({
  name,
  className,
  onNameChange,
  onClassChange,
  onBlur,
  autoFocus,
}: Props) {
  return (
    <div className="space-y-2">
      <TextField
        value={name}
        onChange={onNameChange}
        onBlur={onBlur}
        autoFocus={autoFocus}
        placeholder="Character name"
        ariaLabel="Character name"
      />
      <TextField
        value={className}
        onChange={onClassChange}
        onBlur={onBlur}
        placeholder="Class or build"
        ariaLabel="Character class or build"
      />
    </div>
  );
}
