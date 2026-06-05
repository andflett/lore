import type { QuestionKind } from "./agent/schemas";

// Bring-your-own-key: user-supplied API keys, stored in the browser and sent
// per-request so they run on their own quota (and unlock Claude). Optional —
// when absent the server falls back to its own env keys (the free Groq demo).
// Groq stays server-side (it's the free default); only Anthropic + Tavily are
// user-overridable.
export interface UserKeys {
  anthropic?: string;
  tavily?: string;
}

export interface Game {
  id: string;
  name: string;
  createdAt: number;
  sources?: GameSources;
}

// Per-game source allowlist. Domains the agent is allowed to search.
// `include` is ORDERED — earlier entries are higher priority and are
// re-ranked to the front of search results. If `replaceDefaults` is true,
// `include` is the *only* set used; otherwise it layers on top of
// DEFAULT_INCLUDE_DOMAINS. `exclude` is always applied last as a safety net.
export interface GameSources {
  include?: string[];
  exclude?: string[];
  replaceDefaults?: boolean;
}

export interface Playthrough {
  id: string;
  gameId: string;
  name: string;
  characterName?: string;
  characterClass?: string;
  playstyleNotes?: string;
  memory: MemoryBlock[];
  modelId: string;
  createdAt: number;
  updatedAt: number;
  lastSessionId?: string;
}

export type MemoryCategory =
  | "quest"
  | "choice"
  | "character"
  | "location"
  | "note";

export interface MemoryBlock {
  id: string;
  category: MemoryCategory;
  content: string;
  addedAt: number;
  source: "user" | "ai";
}

export interface Session {
  id: string;
  playthroughId: string;
  startedAt: number;
  endedAt?: number;
  summary?: string;
  messages: Message[];
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SearchSource[];
  // Question classification from the decide node. Used by the UI to decide
  // whether an unsourced answer deserves a "no sources" badge (game-content
  // kinds do; meta/other don't). Optional — older messages won't have it.
  kind?: QuestionKind;
  // Tavily queries run to produce this answer. Persisted so the model can
  // reference them accurately in follow-up turns ("what did you search for?").
  queries?: string[];
  timestamp: number;
}

export interface SearchSource {
  index: number; // 1-based; matches [n] citation in message content
  title: string;
  url: string;
  domain: string;
}

// Returned by the session-end AI call.
export interface ProposedMemoryUpdate {
  category: MemoryCategory;
  content: string;
}

export const MEMORY_CATEGORIES: MemoryCategory[] = [
  "quest",
  "choice",
  "character",
  "location",
  "note",
];
