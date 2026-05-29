"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useLiveQuery } from "dexie-react-hooks";
import { EmptySessionState } from "./EmptySessionState";
import type { ChatInputHandle } from "./ChatInput";
import type {
  Game,
  Playthrough,
  ProposedMemoryUpdate,
  Session,
} from "@/lib/types";
import { addMemoryBlock, appendMessage, getSession } from "@/lib/db";
import { stoneSurface } from "@/lib/surfaces";
import { parseProposals } from "@/lib/parse-proposals";
import { useAgent } from "@/hooks/useAgent";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { AgentProgress } from "./AgentProgress";
import { MemoryProposalToast } from "@/components/memory/MemoryProposalToast";

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
  const { ask, loading, steps, text, sources, error } = useAgent();

  const send = async (query: string) => {
    if (loading || readOnly) return;
    // 1. Persist the user message immediately so it appears right away.
    await appendMessage(session.id, { role: "user", content: query });

    // 2. Build prior context from already-persisted turns (excluding the one we just added).
    const priorMessages = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const { text: finalText, sources: finalSources } = await ask({
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
  }, [messages, text, steps]);

  const acceptProposal = async (proposal: ProposedMemoryUpdate) => {
    await addMemoryBlock(playthrough.id, {
      category: proposal.category,
      content: proposal.content,
      source: "ai",
    });
    // The toast may pass back an edited copy (different reference) so we always
    // pop the first item — toasts are shown one at a time in queue order.
    setProposals((p) => p.slice(1));
  };

  // Strip proposals from streaming text too so they don't briefly flash in the bubble.
  const streamingText = useMemo(() => parseProposals(text).text, [text]);

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="message-overlay flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6"
        style={stoneSurface("raised")}
      >
        {messages.length === 0 && !loading && (
          <EmptySessionState
            gameName={game.name}
            onPick={(t) => inputRef.current?.setDraft(t)}
          />
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content}
            sources={m.sources}
          />
        ))}
        {loading && (
          <div className="space-y-2">
            <AgentProgress steps={steps} />
            {streamingText.length > 0 && (
              <MessageBubble role="assistant" content={streamingText} sources={sources} />
            )}
          </div>
        )}
        {error && !loading && (
          <div
            className="border-2 border-blood-1 px-3 py-2 text-[13px] text-blood"
            role="alert"
          >
            {error}
          </div>
        )}
      </div>

      {!readOnly && (
        <div
          className="border-t-2 border-gold px-3 py-3 sm:px-4"
          style={{
            ...stoneSurface("raised"),
            boxShadow:
              "0 -4px 20px rgba(0,0,0,0.6), 0 0 14px rgba(200,146,26,0.10)",
          }}
        >
          <ChatInput ref={inputRef} disabled={loading} onSend={send} />
        </div>
      )}

      <AnimatePresence>
        {proposals.length > 0 && (
          <MemoryProposalToast
            proposal={proposals[0]}
            onAccept={acceptProposal}
            onDismiss={() => setProposals((p) => p.slice(1))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
