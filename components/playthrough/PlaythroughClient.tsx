"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  createSession,
  getPlaythrough,
  getSession,
  isToday,
  listSessions,
} from "@/lib/db";
import { db } from "@/lib/db";
import { setLastPlaythrough } from "@/lib/storage";
import { AppShell } from "@/components/shell/AppShell";
import { Spinner } from "@/components/shared/Spinner";
import { IconButton } from "@/components/shared/IconButton";
import { SessionView } from "@/components/chat/SessionView";
import { MemoryPanel } from "@/components/memory/MemoryPanel";
import { SessionEndReview } from "@/components/session-end/SessionEndReview";
import { PlaythroughSettingsDrawer } from "@/components/playthrough/PlaythroughSettingsDrawer";

interface Props {
  playthroughId: string;
  // When set, view a specific (possibly past) session read-only.
  sessionId?: string;
}

export function PlaythroughClient({ playthroughId, sessionId }: Props) {
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(
    sessionId,
  );
  const [resolving, setResolving] = useState(!sessionId);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const playthrough = useLiveQuery(
    () => getPlaythrough(playthroughId),
    [playthroughId],
  );
  const game = useLiveQuery(
    () => (playthrough ? db.games.get(playthrough.gameId) : undefined),
    [playthrough?.gameId],
  );
  const session = useLiveQuery(
    () => (activeSessionId ? getSession(activeSessionId) : undefined),
    [activeSessionId],
  );

  useEffect(() => {
    if (playthroughId) setLastPlaythrough(playthroughId);
  }, [playthroughId]);

  // Auto-resume: today's last session, else create a new one.
  useEffect(() => {
    if (sessionId || !playthrough) return;
    let cancelled = false;
    (async () => {
      const sessions = await listSessions(playthrough.id);
      const todays = sessions.find((s) => isToday(s.startedAt) && !s.endedAt);
      const resumed = todays ?? (await createSession(playthrough.id));
      if (!cancelled) {
        setActiveSessionId(resumed.id);
        setResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, playthrough]);

  const startNewSession = async () => {
    if (!playthrough) return;
    const s = await createSession(playthrough.id);
    setActiveSessionId(s.id);
  };

  if (!playthrough || !game || resolving || !session) {
    return <Spinner label="Loading playthrough…" />;
  }

  const isPast = Boolean(session.endedAt) || Boolean(sessionId);

  const headerRight = (
    <>
      <IconButton
        icon="open-book"
        label="Memory"
        size="sm"
        tooltipSide="bottom"
        tooltipAlign="end"
        onClick={() => setMemoryOpen(true)}
      />
      <IconButton
        icon="quill-ink"
        label="Settings"
        size="sm"
        tooltipSide="bottom"
        tooltipAlign="end"
        onClick={() => setSettingsOpen(true)}
      />
      <IconButton
        icon="sunrise"
        label="New session"
        size="sm"
        tooltipSide="bottom"
        tooltipAlign="end"
        onClick={startNewSession}
      />
      {!isPast && (
        <>
          {/* Thin hairline separates primary trio from contextual/destructive end-session */}
          <span aria-hidden className="mx-1 h-5 w-px bg-gold-b1" />
          <IconButton
            icon="moon-bats"
            label="End session"
            size="sm"
            variant="dim"
            tooltipSide="bottom"
        tooltipAlign="end"
            onClick={() => setEndOpen(true)}
          />
        </>
      )}
    </>
  );

  return (
    <AppShell
      activePlaythroughId={playthrough.id}
      activeSessionId={session.id}
      headerRight={headerRight}
    >
      <SessionView
        key={session.id}
        game={game}
        playthrough={playthrough}
        session={session}
        readOnly={isPast}
      />
      <MemoryPanel
        open={memoryOpen}
        onClose={() => setMemoryOpen(false)}
        playthrough={playthrough}
      />
      <PlaythroughSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        playthrough={playthrough}
        game={game}
      />
      <SessionEndReview
        open={endOpen}
        onClose={() => setEndOpen(false)}
        onEnded={() => {
          setEndOpen(false);
          startNewSession();
        }}
        game={game}
        playthrough={playthrough}
        session={session}
      />
    </AppShell>
  );
}
