"use client";

import { useState } from "react";
import { TextField } from "@/components/shared/TextField";
import { TextAreaField } from "@/components/shared/TextAreaField";
import { SelectField } from "@/components/shared/SelectField";
import { CheckField } from "@/components/shared/CheckField";
import { RadioField } from "@/components/shared/RadioField";
import { Pill } from "@/components/shared/Pill";
import { SortableListRow } from "@/components/shared/SortableListRow";

// Interactive preview of form primitives. Lives in /design so each piece is
// visible and editable in isolation.
export function DesignFormPreview() {
  const [text, setText] = useState("");
  const [area, setArea] = useState("");
  const [select, setSelect] = useState("quest");
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState("priority");
  const [items, setItems] = useState([
    "taintedgrail.wiki.gg",
    "wiki.gg",
    "fextralife.com",
    "reddit.com",
  ]);

  const move = (from: number, to: number) => {
    setItems((arr) => {
      const next = arr.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const remove = (i: number) =>
    setItems((arr) => arr.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <TextField
          value={text}
          onChange={setText}
          placeholder="A short label, like a domain"
          ariaLabel="Demo text field"
        />
        <TextAreaField
          value={area}
          onChange={setArea}
          rows={2}
          placeholder="A longer note, like playstyle preferences"
          ariaLabel="Demo textarea field"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SelectField value={select} onChange={setSelect} ariaLabel="Demo select" size="sm">
          <option value="quest">Quest</option>
          <option value="build">Build</option>
          <option value="boss">Boss</option>
          <option value="lore">Lore</option>
        </SelectField>
        <SelectField value={select} onChange={setSelect} ariaLabel="Demo select md">
          <option value="quest">Quest (md size)</option>
          <option value="build">Build</option>
        </SelectField>
      </div>

      <div className="flex flex-wrap gap-4">
        <CheckField checked={checked} onChange={setChecked}>
          Checkable option
        </CheckField>
        <CheckField checked={!checked} onChange={(v) => setChecked(!v)}>
          Another option
        </CheckField>
      </div>

      <div className="flex flex-wrap gap-4">
        <RadioField name="demo" value="priority" selected={radio} onChange={setRadio}>
          Priority
        </RadioField>
        <RadioField name="demo" value="alpha" selected={radio} onChange={setRadio}>
          Alphabetical
        </RadioField>
        <RadioField name="demo" value="recent" selected={radio} onChange={setRadio}>
          Recent
        </RadioField>
      </div>

      <div className="flex flex-wrap gap-2">
        <Pill>quest</Pill>
        <Pill>build</Pill>
        <Pill onRemove={() => {}} removeLabel="Remove">
          removable
        </Pill>
        <Pill muted>muted (locked)</Pill>
      </div>

      <ul className="space-y-1">
        {items.map((item, i) => (
          <SortableListRow
            key={item}
            index={i}
            total={items.length}
            onMove={move}
            onRemove={items.length > 1 ? () => remove(i) : undefined}
            removeLabel={`Remove ${item}`}
            muted={i === 1 || i === 2 || i === 3}
          >
            {item}
            {i === 0 && (
              <span
                className="ml-2 font-ui text-[9px] uppercase text-gold-text"
                style={{ letterSpacing: "0.12em" }}
              >
                · Top priority
              </span>
            )}
          </SortableListRow>
        ))}
      </ul>
    </div>
  );
}
