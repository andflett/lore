"use client";

import { modelsByProvider } from "@/lib/models";
import { GameIcon } from "@/components/shared/GameIcon";
import { SelectField } from "@/components/shared/SelectField";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

export function ModelPicker({ value, onChange }: Props) {
  const groups = modelsByProvider();
  return (
    <div className="space-y-1.5">
      <span className="flex items-center gap-1.5">
        <GameIcon name="crystal-ball" size={12} className="text-gold-text" />
        <span
          className="font-ui text-[9px] uppercase text-gold-text"
          style={{ letterSpacing: "0.14em" }}
        >
          Model
        </span>
      </span>
      <SelectField value={value} onChange={onChange} ariaLabel="Model" size="sm">
        {Object.entries(groups).map(([provider, models]) => (
          <optgroup key={provider} label={provider}>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
                {m.notes ? ` — ${m.notes}` : ""}
              </option>
            ))}
          </optgroup>
        ))}
      </SelectField>
    </div>
  );
}
