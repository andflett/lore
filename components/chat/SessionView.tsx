"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useLiveQuery } from "dexie-react-hooks";
import { MemoryProposalCard } from "@/components/memory/MemoryProposalCard";
import Link from "next/link";
import { EmptySessionState } from "./EmptySessionState";
import type { ChatInputHandle } from "./ChatInput";
import { Btn } from "@/components/shared/Btn";
import { GameIcon } from "@/components/shared/GameIcon";
import type {
  Game,
  Playthrough,
  ProposedMemoryUpdate,
  Session,
} from "@/lib/types";
import { addMemoryBlock, appendMessage, getSession, updatePlaythrough } from "@/lib/db";
import { stoneSurface } from "@/lib/surfaces";
import { parseProposals } from "@/lib/parse-proposals";
import { useAgent } from "@/hooks/useAgent";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { AgentProgress } from "./AgentProgress";

const STARTERS = ["Where do I find ", "How do I beat ", "Best build for "];

interface Props {
  game: Game;
  playthrough: Playthrough;
  session: Session;
  readOnly?: boolean;
}

export function SessionView({ game, playthrough, session, readOnly }: Props) {
  const live = useLiveQuery(() => getSession(session.id), [session.id], session);
  const messages = live?.messages ?? session.messages;

  const [proposals, setProposals] = useState<ProposedMemoryUpdate[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ChatInputHandle>(null);
  const { ask, loading, steps, text, sources, kind, error } = useAgent();

  const send = async (query: string) => {
    if (loading || readOnly) return;
    // 1. Persist the user message immediately so it appears right away.
    await appendMessage(session.id, { role: "user", content: query });

    // 2. Build prior context from already-persisted turns (excluding the one we just added).
    const priorMessages = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const { text: finalText, sources: finalSources, kind: finalKind } = await ask({
        query,
        priorMessages,
        game,
        playthrough,
        modelId: playthrough.modelId,
      });

      // 3. Split [MEMORY_PROPOSAL] blocks out before persisting the visible text.
      const { text: cleanedText, proposals: found } = parseProposals(finalText);
      if (cleanedText.trim().length > 0) {
        await appendMessage(session.id, {
          role: "assistant",
          content: cleanedText,
          sources: finalSources.length ? finalSources : undefined,
          kind: finalKind ?? undefined,
        });
        if (found.length) setProposals((p) => [...p, ...found]);
      }
    } catch {
      // useAgent already captured the error in `error`; the persisted user
      // message remains so the UI doesn't lose context.
    }
  };

  // Keep the latest message visible.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, text, steps, proposals]);

  const acceptProposal = async (index: number, proposal: ProposedMemoryUpdate) => {
    await addMemoryBlock(playthrough.id, {
      category: proposal.category,
      content: proposal.content,
      source: "ai",
    });
    setProposals((p) => p.filter((_, i) => i !== index));
  };

  const dismissProposal = (index: number) =>
    setProposals((p) => p.filter((_, i) => i !== index));

  // Strip proposals from streaming text too so they don't briefly flash in the bubble.
  const streamingText = useMemo(() => parseProposals(text).text, [text]);

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="relative flex h-full min-h-0 flex-col" style={stoneSurface("raised")}>
      <div
        ref={scrollRef}
        className="message-overlay flex flex-col flex-1 min-h-0 overflow-y-auto"
      >
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-24 pt-6 sm:px-6">
            <div className="flex w-full max-w-2xl flex-col items-center gap-6">
              <EmptySessionState gameName={game.name} />
              {!readOnly && (
                <>
                  <div className="w-full">
                    <ChatInput
                      ref={inputRef}
                      disabled={loading}
                      onSend={send}
                      size="hero"
                      modelId={playthrough.modelId}
                      onModelChange={(id) =>
                        updatePlaythrough(playthrough.id, { modelId: id })
                      }
                    />
                  </div>
                  <div className="flex w-full gap-2">
                    {STARTERS.map((s) => (
                      <Btn
                        key={s}
                        variant="dim"
                        size="sm"
                        style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}
                        onClick={() => inputRef.current?.setDraft(s)}
                      >
                        {s.trim()}
                      </Btn>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          // Bottom padding leaves room for the floating input/hint that sits over this scroll area.
          <div className="space-y-4 px-4 py-4 pb-48 sm:px-6">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                content={m.content}
                sources={m.sources}
                kind={m.kind}
              />
            ))}
            {loading && (
              <div className="space-y-2">
                <AgentProgress steps={steps} />
                {streamingText.length > 0 && (
                  <MessageBubble
                    role="assistant"
                    content={streamingText}
                    sources={sources}
                    kind={kind ?? undefined}
                  />
                )}
              </div>
            )}
            {error && !loading && (
              <div
                className="border-2 border-blood bg-blood-0 px-3 py-2 text-[13px] text-blood-text"
                role="alert"
              >
                {error}
              </div>
            )}
            <AnimatePresence>
              {!readOnly &&
                proposals.map((p, i) => (
                  <MemoryProposalCard
                    key={`${p.category}-${i}-${p.content}`}
                    proposal={p}
                    onAccept={(edited) => acceptProposal(i, edited)}
                    onDismiss={() => dismissProposal(i)}
                  />
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {!isEmpty && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-4 sm:px-6 sm:pb-5">
          <div className="pointer-events-auto w-full max-w-2xl">
            {readOnly ? (
              <ReadOnlyHint playthroughId={playthrough.id} latestSessionId={playthrough.lastSessionId} currentSessionId={session.id} />
            ) : (
              <div
                style={{
                  filter:
                    "drop-shadow(0 8px 22px rgba(0,0,0,0.55)) drop-shadow(0 0 14px rgba(200,146,26,0.08))",
                }}
              >
                <ChatInput
                  ref={inputRef}
                  disabled={loading}
                  onSend={send}
                  modelId={playthrough.modelId}
                  onModelChange={(id) =>
                    updatePlaythrough(playthrough.id, { modelId: id })
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Floating prompt shown over a read-only past session, pointing the player back
// to where the chat box would normally be so it's clear they can't type here.
function ReadOnlyHint({
  playthroughId,
  latestSessionId,
  currentSessionId,
}: {
  playthroughId: string;
  latestSessionId?: string;
  currentSessionId: string;
}) {
  const target =
    latestSessionId && latestSessionId !== currentSessionId
      ? `/playthrough/${playthroughId}/session/${latestSessionId}`
      : `/playthrough/${playthroughId}`;
  return (
    <Link
      href={target}
      className="flex items-center justify-center gap-2 border border-gold-b3 px-4 py-3 text-[13px] text-text-t1 hover:border-gold hover:text-text-t3"
      style={{
        ...stoneSurface("deep"),
        boxShadow:
          "inset 0 0 0 1px var(--color-gold-b1), 0 10px 28px rgba(0,0,0,0.7)",
      }}
    >
      <GameIcon name="scroll-unfurled" size={14} className="text-gold-text" />
      <span>Viewing a past session. Jump back to the current chat to keep playing.</span>
    </Link>
  );
}
