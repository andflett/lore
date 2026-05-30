import type { SearchSource } from "@/lib/types";
import type { QuestionKind } from "./schemas";

// SSE event protocol between /api/chat and the client useAgent hook.
export type AgentEvent =
  | { type: "progress"; step: string; message: string }
  | { type: "sources"; sources: SearchSource[] }
  | { type: "meta"; kind: QuestionKind }
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };
