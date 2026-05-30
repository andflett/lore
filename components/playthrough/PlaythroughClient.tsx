"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
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
import { GameIcon } from "@/components/shared/GameIcon";
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
  const [playthroughLoaded, setPlaythroughLoaded] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const playthrough = useLiveQuery(async () => {
    const p = await getPlaythrough(playthroughId);
    setPlaythroughLoaded(true);
    return p;
  }, [playthroughId]);

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
      try {
        const sessions = await listSessions(playthrough.id);
        const todays = sessions.find((s) => isToday(s.startedAt) && !s.endedAt);
        const resumed = todays ?? (await createSession(playthrough.id));
        if (!cancelled) {
          setActiveSessionId(resumed.id);
          setResolving(false);
        }
      } catch (e) {
        if (!cancelled) {
          setFatalError(e instanceof Error ? e.message : "Failed to load session");
          setResolving(false);
        }
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

  if (fatalError) return <FatalError message={fatalError} />;
  if (playthroughLoaded && !playthrough) return <FatalError message="This playthrough could not be found." />;
  if (!playthroughLoaded || !playthrough || !game || resolving || !session) {
    return <Spinner label="Loading playthrough…" />;
  }

  const isPast = Boolean(session.endedAt) || Boolean(sessionId);
  const sessionIsEmpty = session.messages.length === 0;

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
      {(!sessionIsEmpty || isPast) && (
        <IconButton
          icon="sunrise"
          label="New session"
          size="sm"
          tooltipSide="bottom"
          tooltipAlign="end"
          onClick={isPast ? startNewSession : () => setEndOpen(true)}
        />
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

function FatalError({ message }: { message: string }) {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <GameIcon name="cancel" size={24} className="text-blood-text" />
      <p className="text-[14px] text-text-t1">{message}</p>
      <Link
        href="/"
        className="flex items-center gap-1.5 text-[13px] text-gold-text underline-offset-2 hover:underline"
      >
        <GameIcon name="arrow-scope" size={12} /> Back to home
      </Link>
    </div>
  );
}
