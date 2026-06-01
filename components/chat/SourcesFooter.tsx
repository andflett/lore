"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import type { SearchSource } from "@/lib/types";
import { GameIcon } from "@/components/shared/GameIcon";

interface Props {
  sources: SearchSource[];
  citedIndices: number[];
}

// Collapsible list of sources below an assistant message. Prefer the sources
// the model cited inline ([n]); but if it retrieved sources and neglected to
// cite them (weaker models under-cite), still surface what it consulted rather
// than hiding the grounding entirely.
export function SourcesFooter({ sources, citedIndices }: Props) {
  const [open, setOpen] = useState(false);
  const cited = sources.filter((s) => citedIndices.includes(s.index));
  const shown = (cited.length > 0 ? cited : sources)
    .slice()
    .sort((a, b) => a.index - b.index);

  if (shown.length === 0) return null;

  const noun = cited.length > 0 ? "Source" : "Source consulted";
  const label =
    shown.length === 1 ? noun : cited.length > 0 ? "Sources" : "Sources consulted";

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
          {shown.length} {label}
        </span>
        <span className="text-gold-b3">
          {open ? (
            <ChevronDownIcon className="h-3.5 w-3.5" />
          ) : (
            <ChevronRightIcon className="h-3.5 w-3.5" />
          )}
        </span>
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
