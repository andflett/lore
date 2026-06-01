"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import type { Playthrough } from "@/lib/types";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
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

  // Sessions worth showing: ones with content, plus the live one.
  const visibleSessions = sessions.filter(
    (s) => s.messages.length > 0 || s.id === activeSessionId,
  );

  return (
    <li>
      {/* The whole header is the expand/collapse control — there is no
          separate playthrough page. You expand a playthrough, then pick a
          session (or start one if there are none). Active state is a muted
          gold bar on the left edge (hard-edged, no marker glyph). */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Collapse" : "Expand"}
        aria-expanded={open}
        className="group relative flex w-full cursor-pointer items-start gap-2 py-2 pl-3 pr-2 text-left transition-colors hover:bg-stone-s2"
      >
        {active && (
          <span
            aria-label="Active"
            className="absolute left-0 top-0 h-full w-[3px] bg-gold-b3"
          />
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-tight">
          <span
            className={`text-[14px] transition-colors ${
              active ? "text-gold-text" : "text-text-t1 group-hover:text-text-t3"
            }`}
          >
            {gameName}
          </span>
          <span
            className={`text-[12px] transition-colors ${
              active ? "text-gold-b3" : "text-text-dim group-hover:text-text-t0"
            }`}
          >
            {playthrough.name}
          </span>
        </span>
        <span
          className={`mt-[2px] shrink-0 transition-colors ${
            active ? "text-gold-b3" : "text-text-dim group-hover:text-text-t1"
          }`}
        >
          {open ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </span>
      </button>

      {open &&
        (visibleSessions.length > 0 ? (
          <SessionList
            playthroughId={playthrough.id}
            sessions={visibleSessions}
            activeSessionId={activeSessionId}
          />
        ) : (
          <div className="mb-1 ml-3 border-l border-gold-b1 pl-1">
            <Link
              href={`/playthrough/${playthrough.id}`}
              className="flex items-center gap-1.5 py-1 text-[13px] text-text-dim transition-colors hover:text-gold-text"
            >
              <GameIcon name="sunrise" size={13} /> Start a session
            </Link>
          </div>
        ))}
    </li>
  );
}
