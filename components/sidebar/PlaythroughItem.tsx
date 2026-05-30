"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import type { Playthrough } from "@/lib/types";
import { listSessions } from "@/lib/db";
import { GameIcon } from "@/components/shared/GameIcon";
import { SessionList } from "./SessionList";

interface Props {
  playthrough: Playthrough;
  gameName: string;
  active: boolean;
  activeSessionId?: string;
}

export function PlaythroughItem({
  playthrough,
  gameName,
  active,
  activeSessionId,
}: Props) {
  const [open, setOpen] = useState(active);
  const sessions = useLiveQuery(
    () => listSessions(playthrough.id),
    [playthrough.id],
    [],
  );

  // Sessions worth counting: ones with content, plus the live one.
  const sessionCount = sessions.filter(
    (s) => s.messages.length > 0 || s.id === activeSessionId,
  ).length;

  return (
    <li>
      <div
        className={`group flex items-stretch border-l-2 transition-colors ${
          active
            ? "border-gold bg-gold-b0"
            : "border-transparent hover:bg-stone-s2"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Collapse" : "Expand"}
          className="flex w-5 shrink-0 items-center justify-center text-gold-b3 hover:text-gold"
        >
          <span className="text-[10px]">{open ? "▾" : "▸"}</span>
        </button>
        <Link
          href={`/playthrough/${playthrough.id}`}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2"
        >
          <GameIcon
            name="treasure-map"
            size={14}
            className={`shrink-0 ${
              active ? "text-gold" : "text-gold-b3 group-hover:text-gold"
            }`}
          />
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span
              className={`truncate text-[14px] ${
                active
                  ? "text-gold-text"
                  : "text-text-t1 group-hover:text-text-t3"
              }`}
            >
              {gameName}
            </span>
            <span className="truncate text-[12px] text-text-dim">
              {playthrough.name}
            </span>
          </span>
          {sessionCount > 0 && (
            <span
              className={`shrink-0 font-ui text-[10px] ${
                active ? "text-gold-text" : "text-text-dim"
              }`}
              style={{ letterSpacing: "0.08em" }}
            >
              {sessionCount}
            </span>
          )}
        </Link>
      </div>
      {open && (
        <SessionList
          playthroughId={playthrough.id}
          sessions={sessions}
          activeSessionId={activeSessionId}
        />
      )}
    </li>
  );
}
