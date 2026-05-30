"use client";

import { useState } from "react";
import type { MemoryCategory, Playthrough } from "@/lib/types";
import { MEMORY_CATEGORIES } from "@/lib/types";
import {
  addMemoryBlock,
  removeMemoryBlock,
  updateMemoryBlock,
} from "@/lib/db";
import { Drawer } from "@/components/shared/Drawer";
import { Divider } from "@/components/shared/Divider";
import { Btn } from "@/components/shared/Btn";
import { GameIcon } from "@/components/shared/GameIcon";
import { SelectField } from "@/components/shared/SelectField";
import { TextAreaField } from "@/components/shared/TextAreaField";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { MemoryBlockRow } from "./MemoryBlockRow";

interface Props {
  open: boolean;
  onClose: () => void;
  playthrough: Playthrough;
}

export function MemoryPanel({ open, onClose, playthrough }: Props) {
  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState<MemoryCategory>("note");
  const [content, setContent] = useState("");

  const submitAdd = async () => {
    const text = content.trim();
    if (!text) return;
    await addMemoryBlock(playthrough.id, { category, content: text, source: "user" });
    setContent("");
    setAdding(false);
  };

  return (
    <Drawer open={open} onClose={onClose} title="Playthrough Memory">
      <Divider />

      <div className="mt-4 space-y-4">
        {MEMORY_CATEGORIES.map((cat) => {
          const blocks = playthrough.memory.filter((m) => m.category === cat);
          if (blocks.length === 0) return null;
          return (
            <section key={cat}>
              <SectionLabel>{cat}</SectionLabel>
              <ul className="space-y-1.5">
                {blocks.map((b) => (
                  <MemoryBlockRow
                    key={b.id}
                    block={b}
                    onEdit={(text) => updateMemoryBlock(playthrough.id, b.id, text)}
                    onRemove={() => removeMemoryBlock(playthrough.id, b.id)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
        {playthrough.memory.length === 0 && (
          <p className="text-[14px] text-text-dim">Nothing recorded yet.</p>
        )}
      </div>

      <div className="mt-6">
        {adding ? (
          <div className="space-y-2 border border-gold-b2 bg-stone-s0 p-3">
            <SelectField<MemoryCategory>
              value={category}
              onChange={setCategory}
              ariaLabel="Memory category"
              size="sm"
            >
              {MEMORY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </SelectField>
            <TextAreaField
              autoFocus
              value={content}
              onChange={setContent}
              rows={2}
              placeholder="A durable fact to remember…"
              ariaLabel="Memory content"
            />
            <div className="flex gap-2">
              <Btn variant="confirm" size="sm" onClick={submitAdd}>
                <GameIcon name="check-mark" size={12} /> Add
              </Btn>
              <Btn variant="dim" size="sm" onClick={() => setAdding(false)}>
                Cancel
              </Btn>
            </div>
          </div>
        ) : (
          <Btn variant="metal" size="sm" fullWidth onClick={() => setAdding(true)}>
            <GameIcon name="quill-ink" size={14} /> Add Memory
          </Btn>
        )}
      </div>
    </Drawer>
  );
}
