"use client";

import { useCallback, useRef, useState } from "react";
import type { Game, Playthrough, SearchSource } from "@/lib/types";
import type { AgentEvent } from "@/lib/agent/events";
import type { QuestionKind } from "@/lib/agent/schemas";
import { getUserKeys } from "@/lib/storage";

type Turn = { role: "user" | "assistant"; content: string };

export interface AgentStep {
  step: string;
  message: string;
}

export interface UseAgentState {
  loading: boolean;
  steps: AgentStep[];
  text: string;
  sources: SearchSource[];
  kind: QuestionKind | null;
  error: string | null;
}

const INITIAL: UseAgentState = {
  loading: false,
  steps: [],
  text: "",
  sources: [],
  kind: null,
  error: null,
};

export interface AskInput {
  query: string;
  priorMessages: Turn[];
  game: Game;
  playthrough: Playthrough;
  modelId?: string;
}

export interface UseAgentReturn extends UseAgentState {
  ask: (input: AskInput) => Promise<{
    text: string;
    sources: SearchSource[];
    kind: QuestionKind | null;
  }>;
  cancel: () => void;
  reset: () => void;
}

export function useAgent(): UseAgentReturn {
  const [state, setState] = useState<UseAgentState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => setState(INITIAL), []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((s) => ({ ...s, loading: false }));
  }, []);

  const ask = useCallback(async (input: AskInput) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ loading: true, steps: [], text: "", sources: [], kind: null, error: null });

    let finalText = "";
    let finalSources: SearchSource[] = [];
    let finalKind: QuestionKind | null = null;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Merge in any BYOK keys stored in this browser so the request runs on
        // the user's own quota (and unlocks Claude). Read at call time so a
        // just-saved key takes effect without remounting.
        body: JSON.stringify({ ...input, userKeys: getUserKeys() }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split("\n\n");
        buffer = messages.pop() ?? "";

        for (const m of messages) {
          if (!m.startsWith("data:")) continue;
          const payload = m.slice(5).trim();
          if (!payload) continue;
          let event: AgentEvent;
          try {
            event = JSON.parse(payload) as AgentEvent;
          } catch {
            continue;
          }

          switch (event.type) {
            case "progress":
              setState((s) => ({
                ...s,
                steps: [...s.steps, { step: event.step, message: event.message }],
              }));
              break;
            case "sources":
              finalSources = event.sources;
              setState((s) => ({ ...s, sources: event.sources }));
              break;
            case "meta":
              finalKind = event.kind;
              setState((s) => ({ ...s, kind: event.kind }));
              break;
            case "token":
              finalText += event.text;
              setState((s) => ({ ...s, text: s.text + event.text }));
              break;
            case "error":
              setState((s) => ({ ...s, error: event.message, loading: false }));
              throw new Error(event.message);
            case "done":
              break;
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState((s) => ({ ...s, loading: false, error: message }));
      throw err;
    } finally {
      setState((s) => ({ ...s, loading: false }));
      abortRef.current = null;
    }

    return { text: finalText, sources: finalSources, kind: finalKind };
  }, []);

  return { ...state, ask, cancel, reset };
}
