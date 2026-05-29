"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { listGames, listPlaythroughs } from "@/lib/db";
import { GameIcon } from "@/components/shared/GameIcon";
import { Btn } from "@/components/shared/Btn";
import { IconButton } from "@/components/shared/IconButton";
import { titleCase } from "@/lib/text";
import { PlaythroughItem } from "./PlaythroughItem";

interface Props {
  activePlaythroughId?: string;
  activeSessionId?: string;
  onNavigate?: () => void;
  // When supplied, shows a close button — used by the mobile drawer.
  onClose?: () => void;
}

export function Sidebar({
  activePlaythroughId,
  activeSessionId,
  onNavigate,
  onClose,
}: Props) {
  const playthroughs = useLiveQuery(() => listPlaythroughs(), [], []);
  const games = useLiveQuery(() => listGames(), [], []);
  const gameName = (id: string) =>
    titleCase(games.find((g) => g.id === id)?.name ?? "Unknown game");

  return (
    <nav className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="flex items-center gap-2">
          <GameIcon name="dragon" size={16} className="text-gold" />
          <span
            className="font-ui text-[11px] uppercase text-text-t2"
            style={{ letterSpacing: "0.18em" }}
          >
            Playthroughs
          </span>
        </span>
        {onClose && (
          <IconButton icon="close" label="Close" size="sm" onClick={onClose} />
        )}
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto px-3">
        {playthroughs.length === 0 ? (
          <li className="px-1 py-2 text-[13px] text-text-dim">
            No playthroughs yet.
          </li>
        ) : (
          playthroughs.map((p) => (
            <PlaythroughItem
              key={p.id}
              playthrough={p}
              gameName={gameName(p.gameId)}
              active={p.id === activePlaythroughId}
              activeSessionId={activeSessionId}
            />
          ))
        )}
      </ul>

      <div className="p-3">
        <Link href="/new" onClick={onNavigate} className="block">
          <Btn variant="metal" size="sm" fullWidth>
            <GameIcon name="dragon" size={14} /> New Playthrough
          </Btn>
        </Link>
      </div>
    </nav>
  );
}
