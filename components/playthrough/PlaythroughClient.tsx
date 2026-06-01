"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import {
  createSession,
  getPlaythrough,
  getSession,
  isToday,
  listSessions,
} from "@/lib/db";
import { db } from "@/lib/db";
import { setLastPlaythrough } from "@/lib/storage";
import { HeaderActions } from "@/components/shell/HeaderActions";
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
  const router = useRouter();
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
    // Keep the URL pointing at the live session so a refresh doesn't reopen
    // the old (read-only) one we may have started from.
    router.replace(`/playthrough/${playthrough.id}/session/${s.id}`);
  };

  if (fatalError) return <FatalError message={fatalError} />;
  if (playthroughLoaded && !playthrough) return <FatalError message="This playthrough could not be found." />;
  if (!playthroughLoaded || !playthrough || !game || resolving || !session) {
    return <Spinner label="Loading playthrough…" />;
  }

  // Read-only = genuine history: an ended session, or one from a previous day.
  // Today's open session stays editable however you reached it (root
  // auto-resume or a /session/ URL), so "jump to current" and "new session"
  // both land on a usable chat box rather than a dead read-only view.
  const isPast = Boolean(session.endedAt) || !isToday(session.startedAt);
  const sessionIsEmpty = session.messages.length === 0;

  return (
    <>
      {/* Header buttons render into the persistent shell's header slot so the
          surrounding chrome (and the sidebar) stays mounted across sessions. */}
      <HeaderActions>
        <IconButton
          icon="open-book"
          label="Memory"
          size="sm"
          tooltipSide="bottom"
          tooltipAlign="end"
          onClick={() => setMemoryOpen(true)}
        />
        <IconButton
          icon="scroll-unfurled"
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
      </HeaderActions>

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
    </>
  );
}

function FatalError({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <ExclamationTriangleIcon className="h-6 w-6 text-blood-text" />
      <p className="text-[14px] text-text-t1">{message}</p>
      <Link
        href="/"
        className="flex items-center gap-1.5 text-[13px] text-gold-text underline-offset-2 hover:underline"
      >
        <GameIcon name="crossroads" size={12} /> Back to home
      </Link>
    </div>
  );
}
