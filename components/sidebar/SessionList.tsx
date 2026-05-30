"use client";

import Link from "next/link";
import type { Session } from "@/lib/types";
import { isToday } from "@/lib/db";

function sessionLabel(session: Session): string {
  if (isToday(session.startedAt)) return "Today";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(session.startedAt);
}

interface Props {
  playthroughId: string;
  sessions: Session[];
  activeSessionId?: string;
}

// Collapsible session history under a playthrough in the sidebar.
export function SessionList({ playthroughId, sessions, activeSessionId }: Props) {
  // Hide empty past sessions — they add noise and can't be interacted with.
  // The currently active session always shows so the user can see where they are.
  const visible = sessions.filter(
    (s) => s.messages.length > 0 || s.id === activeSessionId,
  );
  if (visible.length === 0) return null;

  return (
    <ul className="ml-3 border-l border-gold-b1 pl-2">
      {visible.map((s) => {
        const active = s.id === activeSessionId;
        return (
          <li key={s.id}>
            <Link
              href={`/playthrough/${playthroughId}/session/${s.id}`}
              className={`block py-1 text-[13px] ${
                active ? "text-gold-text" : "text-text-t0 hover:text-text-t2"
              }`}
            >
              {sessionLabel(s)}
              {!s.endedAt && isToday(s.startedAt) ? " ·" : ""}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
