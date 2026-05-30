"use client";

import { useEffect, useRef, useState } from "react";
import { MODELS, modelShort } from "@/lib/models";
import { GameIcon } from "@/components/shared/GameIcon";
import { stoneSurface } from "@/lib/surfaces";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

// Compact inline model switcher used inside ChatInput. Custom popover (not a
// native <select>) so it can match the app's hard-edged stone aesthetic.
export function ModelSwitcher({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Group by provider so the popover mirrors the long-form picker's structure.
  const groups = MODELS.reduce<Record<string, typeof MODELS>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 border border-gold-b1 bg-stone-s0 px-2 py-1 text-[12px] text-text-t2 hover:border-gold-b2 hover:text-text-t3"
      >
        <GameIcon name="crystal-ball" size={11} className="text-gold-text" />
        <span>{modelShort(value)}</span>
        <span className="text-[8px] text-text-dim">▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute bottom-full left-0 z-20 mb-2 w-60 border-2 border-gold py-1.5"
          style={{
            ...stoneSurface("deep"),
            boxShadow:
              "0 10px 26px rgba(0,0,0,0.7), 0 0 18px rgba(200,146,26,0.12)",
          }}
        >
          {Object.entries(groups).map(([provider, models], gi) => (
            <div key={provider}>
              {gi > 0 && <div className="my-1 h-px bg-gold-b2" />}
              <div
                className="font-ui px-2.5 py-1 text-[9px] uppercase text-gold-text"
                style={{ letterSpacing: "0.16em" }}
              >
                {provider}
              </div>
              {models.map((m) => {
                const selected = m.id === value;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(m.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start gap-2 px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                      selected
                        ? "text-gold-text"
                        : "text-text-t1 hover:text-text-t3"
                    }`}
                    style={{
                      backgroundColor: selected
                        ? "var(--color-gold-b0)"
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected)
                        e.currentTarget.style.backgroundColor =
                          "var(--color-gold-b0)";
                    }}
                    onMouseLeave={(e) => {
                      if (!selected)
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span className="mt-[3px] flex h-3 w-3 flex-shrink-0 items-center justify-center">
                      {selected && (
                        <GameIcon
                          name="check-mark"
                          size={11}
                          className="text-gold-text"
                        />
                      )}
                    </span>
                    <span className="flex-1">
                      <span className="block leading-tight">{m.short}</span>
                      {m.notes && (
                        <span className="block text-[11px] leading-tight text-text-dim">
                          {m.notes}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
