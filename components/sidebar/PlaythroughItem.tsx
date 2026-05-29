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

  return (
    <li>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Collapse" : "Expand"}
          className="flex h-6 w-4 items-center justify-center text-gold-b3 hover:text-gold"
        >
          <span className="text-[10px]">{open ? "▾" : "▸"}</span>
        </button>
        <Link
          href={`/playthrough/${playthrough.id}`}
          className={`flex flex-1 items-center gap-2 py-1 text-[14px] ${
            active ? "text-gold-text" : "text-text-t1 hover:text-text-t3"
          }`}
        >
          <GameIcon name="treasure-map" size={14} />
          <span className="truncate">
            {gameName}
            <span className="text-text-dim"> — {playthrough.name}</span>
          </span>
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
