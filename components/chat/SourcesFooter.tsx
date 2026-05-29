"use client";

import { useState } from "react";
import type { SearchSource } from "@/lib/types";
import { GameIcon } from "@/components/shared/GameIcon";

interface Props {
  sources: SearchSource[];
  citedIndices: number[];
}

// Collapsible list of cited sources below an assistant message.
export function SourcesFooter({ sources, citedIndices }: Props) {
  const [open, setOpen] = useState(false);
  const shown = sources
    .filter((s) => citedIndices.includes(s.index))
    .sort((a, b) => a.index - b.index);

  if (shown.length === 0) return null;

  return (
    <div className="mt-3 border-t border-gold-b1 pt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-gold-text hover:text-gold-bright"
      >
        <GameIcon name="scroll-unfurled" size={13} />
        <span
          className="font-ui text-[9px] uppercase"
          style={{ letterSpacing: "0.12em" }}
        >
          {shown.length} {shown.length === 1 ? "Source" : "Sources"}
        </span>
        <span className="text-[9px] text-gold-b3">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <ul className="mt-2 space-y-2">
          {shown.map((s) => (
            <li key={s.index} className="flex items-start gap-2 text-[13px]">
              <span className="text-gold-text">[{s.index}]</span>
              <span className="min-w-0">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-t1 hover:text-text-t3"
                >
                  {s.title}
                </a>
                <span className="ml-2 text-text-dim">{s.domain}</span>
                <code className="mt-0.5 block truncate text-[11px] text-text-dim">
                  {s.url}
                </code>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
