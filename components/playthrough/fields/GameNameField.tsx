"use client";

import type { Game } from "@/lib/types";
import { TextField } from "@/components/shared/TextField";
import { Btn } from "@/components/shared/Btn";

interface Props {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  games: Game[];
  autoFocus?: boolean;
  // Hide the typeahead suggestions when editing (game is already chosen).
  hideSuggestions?: boolean;
  readOnly?: boolean;
}

export function GameNameField({
  value,
  onChange,
  onBlur,
  games,
  autoFocus,
  hideSuggestions,
  readOnly,
}: Props) {
  const suggestions = hideSuggestions
    ? []
    : games
        .filter(
          (g) =>
            value.trim() &&
            g.name.toLowerCase().includes(value.trim().toLowerCase()) &&
            g.name.toLowerCase() !== value.trim().toLowerCase(),
        )
        .slice(0, 4);

  return (
    <div className="space-y-2">
      <TextField
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder="e.g. Tainted Grail: Fall of Avalon"
        autoFocus={autoFocus}
        ariaLabel="Game name"
        readOnly={readOnly}
      />
      {suggestions.length > 0 && onChange && (
        <ul className="flex flex-wrap gap-2">
          {suggestions.map((g) => (
            <li key={g.id}>
              <Btn variant="dim" size="sm" onClick={() => onChange(g.name)}>
                {g.name}
              </Btn>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
