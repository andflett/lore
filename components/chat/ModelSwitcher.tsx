"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { MODELS, modelShort, preferredDefaultModel } from "@/lib/models";
import { GameIcon } from "@/components/shared/GameIcon";
import { Btn } from "@/components/shared/Btn";
import { ApiKeysModal } from "@/components/settings/ApiKeysModal";
import { useHasAnthropicKey } from "@/hooks/useHasAnthropicKey";
import { stoneSurface } from "@/lib/surfaces";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

// Compact inline model switcher used inside ChatInput. Custom popover (not a
// native <select>) so it can match the app's hard-edged stone aesthetic. Also
// the single home for BYOK: the Anthropic (Claude) models are locked until the
// user adds their own key, with the key entry reachable right here.
export function ModelSwitcher({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hasKey = useHasAnthropicKey();
  const defaultId = preferredDefaultModel(hasKey);

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

  // Group by provider so the popover keeps a clear Demo / Anthropic split.
  const groups = MODELS.reduce<Record<string, typeof MODELS>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  const openKeys = () => {
    setOpen(false);
    setKeysOpen(true);
  };

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
        <ChevronDownIcon className="h-3 w-3 text-text-dim" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute bottom-full left-0 z-20 mb-2 w-64 border border-gold-b3 py-1.5"
          style={{
            ...stoneSurface("deep"),
            boxShadow:
              "0 10px 26px rgba(0,0,0,0.7), 0 0 18px rgba(200,146,26,0.12)",
          }}
        >
          {Object.entries(groups).map(([provider, models], gi) => {
            const locked = models[0].tier === "byok" && !hasKey;
            return (
              <div key={provider}>
                {gi > 0 && <div className="my-1 h-px bg-gold-b2" />}
                <div
                  className="font-ui flex items-center justify-between px-2.5 py-1 text-[9px] uppercase text-gold-text"
                  style={{ letterSpacing: "0.16em" }}
                >
                  <span>{provider}</span>
                  {locked && <span className="text-text-dim">locked</span>}
                </div>

                {models.map((m) => {
                  const selected = m.id === value;
                  const disabled = m.tier === "byok" && !hasKey;
                  const isDefault = m.id === defaultId;

                  if (disabled) {
                    return (
                      <div
                        key={m.id}
                        aria-disabled
                        className="flex w-full items-start gap-2 px-2.5 py-1.5 text-left text-[13px] text-text-dim opacity-60"
                      >
                        <span className="mt-[3px] flex h-3 w-3 flex-shrink-0 items-center justify-center" />
                        <span className="flex-1">
                          <span className="block leading-tight">{m.label}</span>
                          {m.notes && (
                            <span className="block text-[11px] leading-tight">
                              {m.notes}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  }

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
                          <CheckIcon className="h-3 w-3 text-gold-text" />
                        )}
                      </span>
                      <span className="flex-1">
                        <span className="flex items-center gap-1.5 leading-tight">
                          {m.label}
                          {isDefault && (
                            <span
                              className="font-ui text-[8px] uppercase text-text-dim"
                              style={{ letterSpacing: "0.12em" }}
                            >
                              default
                            </span>
                          )}
                        </span>
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
            );
          })}

          {/* BYOK entry — the only place keys are managed now. */}
          <div className="my-1 h-px bg-gold-b2" />
          {hasKey ? (
            <div className="px-2.5 py-1">
              <button
                type="button"
                onClick={openKeys}
                className="flex items-center gap-1.5 text-[11px] text-text-dim hover:text-gold-text"
              >
                <GameIcon name="lantern-flame" size={11} />
                Manage API keys
              </button>
            </div>
          ) : (
            <div className="px-2.5 py-1.5">
              <p className="mb-1.5 text-[11px] leading-snug text-text-dim">
                Add your own Anthropic key to unlock Claude and run without demo
                limits.
              </p>
              <Btn variant="dim" size="sm" fullWidth onClick={openKeys}>
                <GameIcon name="lantern-flame" size={11} /> Add API key
              </Btn>
            </div>
          )}
        </div>
      )}

      <ApiKeysModal open={keysOpen} onClose={() => setKeysOpen(false)} />
    </div>
  );
}
