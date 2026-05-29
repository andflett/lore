import { Annotation } from "@langchain/langgraph";
import type { Game, Playthrough, SearchSource } from "@/lib/types";
import type { QuestionKind, SpoilerRisk } from "./schemas";

// A retrieved web result carries its full content for the generate step,
// alongside the indexed SearchSource fields the client renders.
export interface RetrievedResult extends SearchSource {
  content: string;
}

type Turn = { role: "user" | "assistant"; content: string };

export const AgentState = Annotation.Root({
  // ── Input (set once) ──────────────────────────────────────────
  query: Annotation<string>({ reducer: (_, n) => n }),
  game: Annotation<Game>({ reducer: (_, n) => n }),
  playthrough: Annotation<Playthrough>({ reducer: (_, n) => n }),
  modelId: Annotation<string>({ reducer: (_, n) => n }),
  priorMessages: Annotation<Turn[]>({
    reducer: (_, n) => n,
    default: () => [],
  }),

  // ── Decision (set by decide node) ─────────────────────────────
  needsSearch: Annotation<boolean>({ reducer: (_, n) => n, default: () => false }),
  kind: Annotation<QuestionKind>({ reducer: (_, n) => n, default: () => "other" }),
  spoilerRisk: Annotation<SpoilerRisk>({ reducer: (_, n) => n, default: () => "none" }),

  // ── Retrieval (accumulates across loops) ──────────────────────
  results: Annotation<RetrievedResult[]>({
    reducer: (cur, n) => [...cur, ...n],
    default: () => [],
  }),
  retrievalCount: Annotation<number>({ reducer: (_, n) => n, default: () => 0 }),
  queriesRun: Annotation<string[]>({
    reducer: (cur, n) => [...cur, ...n],
    default: () => [],
  }),
  nextQuery: Annotation<string | null>({ reducer: (_, n) => n, default: () => null }),
  hasEnoughContext: Annotation<boolean>({
    reducer: (_, n) => n,
    default: () => false,
  }),

  // ── Progress (read by the stream bridge) ──────────────────────
  currentStep: Annotation<string>({ reducer: (_, n) => n, default: () => "" }),
  stepMessage: Annotation<string>({ reducer: (_, n) => n, default: () => "" }),
});

export type AgentStateType = typeof AgentState.State;
