"use client";

import { useEffect, useState } from "react";
import type {
  Game,
  MemoryCategory,
  Playthrough,
  ProposedMemoryUpdate,
  Session,
} from "@/lib/types";
import { MEMORY_CATEGORIES } from "@/lib/types";
import { addMemoryBlock, endSession } from "@/lib/db";
import { Modal } from "@/components/shared/Modal";
import { Divider } from "@/components/shared/Divider";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { SelectField } from "@/components/shared/SelectField";
import { Btn } from "@/components/shared/Btn";
import { GameIcon } from "@/components/shared/GameIcon";

interface Props {
  open: boolean;
  onClose: () => void;
  onEnded: () => void;
  game: Game;
  playthrough: Playthrough;
  session: Session;
}

interface ReviewItem extends ProposedMemoryUpdate {
  accepted: boolean;
}

export function SessionEndReview({
  open,
  onClose,
  onEnded,
  game,
  playthrough,
  session,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [customCategory, setCustomCategory] = useState<MemoryCategory>("note");
  const [customContent, setCustomContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCustomCategory("note");
    setCustomContent("");
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/session-end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session, playthrough, game }),
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = (await res.json()) as {
          summary: string;
          proposals: ProposedMemoryUpdate[];
        };
        if (cancelled) return;
        setSummary(data.summary);
        setItems(data.proposals.map((p) => ({ ...p, accepted: true })));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, session, playthrough, game]);

  const confirm = async () => {
    setSaving(true);
    for (const item of items) {
      if (item.accepted && item.content.trim()) {
        await addMemoryBlock(playthrough.id, {
          category: item.category,
          content: item.content.trim(),
          source: "ai",
        });
      }
    }
    const custom = customContent.trim();
    if (custom) {
      await addMemoryBlock(playthrough.id, {
        category: customCategory,
        content: custom,
        source: "user",
      });
    }
    await endSession(session.id, summary);
    setSaving(false);
    onEnded();
  };

  return (
    <Modal open={open} onClose={onClose} title="End Session">
      {loading ? (
        <p className="text-[14px] text-text-dim">Reviewing this session…</p>
      ) : error ? (
        <p className="text-[14px] text-blood">{error}</p>
      ) : (
        <div className="space-y-4">
          <section>
            <SectionLabel>Summary</SectionLabel>
            <p className="text-[14px] leading-relaxed text-text-t1">{summary}</p>
          </section>

          <Divider />

          <section>
            <SectionLabel>
              Proposed Memory ({items.filter((i) => i.accepted).length} selected)
            </SectionLabel>
            {items.length === 0 ? (
              <p className="text-[14px] text-text-dim">Nothing to remember.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-2 border px-2 py-1.5 ${
                      item.accepted
                        ? "border-gold-b2 bg-stone-s0"
                        : "border-gold-b1 bg-stone-s0 opacity-50"
                    }`}
                  >
                    <button
                      type="button"
                      aria-label={item.accepted ? "Reject" : "Accept"}
                      onClick={() =>
                        setItems((arr) =>
                          arr.map((x, j) =>
                            j === i ? { ...x, accepted: !x.accepted } : x,
                          ),
                        )
                      }
                      className="mt-0.5 text-gold-text"
                    >
                      <GameIcon
                        name={item.accepted ? "check-mark" : "cancel"}
                        size={14}
                      />
                    </button>
                    <span className="flex-1">
                      <span
                        className="font-ui text-[8px] uppercase text-text-dim"
                        style={{ letterSpacing: "0.12em" }}
                      >
                        {item.category}
                      </span>
                      <textarea
                        value={item.content}
                        onChange={(e) =>
                          setItems((arr) =>
                            arr.map((x, j) =>
                              j === i ? { ...x, content: e.target.value } : x,
                            ),
                          )
                        }
                        rows={2}
                        className="mt-0.5 w-full resize-none border border-gold-b1 bg-stone-s1 px-1.5 py-1 text-[14px] text-text-t2 outline-none focus:border-gold"
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Divider />

          <section>
            <SectionLabel>Add Your Own Memory (optional)</SectionLabel>
            <div className="flex items-start gap-2">
              <div className="w-32 shrink-0">
                <SelectField
                  value={customCategory}
                  onChange={setCustomCategory}
                  ariaLabel="Memory category"
                  size="sm"
                >
                  {MEMORY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </SelectField>
              </div>
              <textarea
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                rows={2}
                placeholder="Anything you want to remember from this session…"
                className="flex-1 resize-none border-2 border-gold-b2 bg-stone-s0 px-2 py-1 text-[14px] text-text-t2 outline-none placeholder:text-text-dim focus:border-gold"
              />
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="dim" size="sm" onClick={onClose}>
              Cancel
            </Btn>
            <Btn variant="confirm" size="sm" onClick={confirm} disabled={saving}>
              <GameIcon name="moon-bats" size={12} /> End Session
            </Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}
