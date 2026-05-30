import Dexie, { type Table } from "dexie";
import type {
  Game,
  MemoryBlock,
  Message,
  Playthrough,
  Session,
} from "./types";
import { DEFAULT_MODEL } from "./models";

export class LKDatabase extends Dexie {
  games!: Table<Game>;
  playthroughs!: Table<Playthrough>;
  sessions!: Table<Session>;

  constructor() {
    // IndexedDB name kept as the legacy "lorekeeper" so existing local data
    // (playthroughs/sessions) survives the rebrands (Lorekeeper → Hearthnote →
    // Wyrdscribe). Don't change this without a migration that copies data
    // from the old db on first boot — see docs/decisions.md.
    super("lorekeeper");
    this.version(1).stores({
      games: "id, name",
      playthroughs: "id, gameId, updatedAt",
      sessions: "id, playthroughId, startedAt",
    });
  }
}

export const db = new LKDatabase();

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// ── Games ──────────────────────────────────────────────────────
export async function listGames(): Promise<Game[]> {
  return db.games.orderBy("name").toArray();
}

export async function findGameByName(name: string): Promise<Game | undefined> {
  const lower = name.trim().toLowerCase();
  return (await db.games.toArray()).find(
    (g) => g.name.toLowerCase() === lower,
  );
}

export async function createGame(name: string): Promise<Game> {
  const game: Game = { id: uid(), name: name.trim(), createdAt: Date.now() };
  await db.games.add(game);
  return game;
}

// Return an existing game with this name or create one.
export async function ensureGame(name: string): Promise<Game> {
  return (await findGameByName(name)) ?? (await createGame(name));
}

export async function updateGame(
  id: string,
  changes: Partial<Game>,
): Promise<void> {
  await db.games.update(id, changes);
}

// ── Playthroughs ───────────────────────────────────────────────
export async function listPlaythroughs(): Promise<Playthrough[]> {
  return db.playthroughs.orderBy("updatedAt").reverse().toArray();
}

export async function getPlaythrough(
  id: string,
): Promise<Playthrough | undefined> {
  return db.playthroughs.get(id);
}

export async function createPlaythrough(
  input: Omit<
    Playthrough,
    "id" | "memory" | "modelId" | "createdAt" | "updatedAt"
  > &
    Partial<Pick<Playthrough, "modelId">>,
): Promise<Playthrough> {
  const now = Date.now();
  const playthrough: Playthrough = {
    ...input,
    id: uid(),
    memory: [],
    modelId: input.modelId ?? DEFAULT_MODEL,
    createdAt: now,
    updatedAt: now,
  };
  await db.playthroughs.add(playthrough);
  return playthrough;
}

export async function updatePlaythrough(
  id: string,
  changes: Partial<Playthrough>,
): Promise<void> {
  await db.playthroughs.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deletePlaythrough(id: string): Promise<void> {
  await db.transaction("rw", db.playthroughs, db.sessions, async () => {
    await db.sessions.where("playthroughId").equals(id).delete();
    await db.playthroughs.delete(id);
  });
}

// ── Memory blocks ──────────────────────────────────────────────
export async function addMemoryBlock(
  playthroughId: string,
  block: Omit<MemoryBlock, "id" | "addedAt">,
): Promise<void> {
  const pt = await getPlaythrough(playthroughId);
  if (!pt) return;
  const next: MemoryBlock = { ...block, id: uid(), addedAt: Date.now() };
  await updatePlaythrough(playthroughId, { memory: [...pt.memory, next] });
}

export async function updateMemoryBlock(
  playthroughId: string,
  blockId: string,
  content: string,
): Promise<void> {
  const pt = await getPlaythrough(playthroughId);
  if (!pt) return;
  await updatePlaythrough(playthroughId, {
    memory: pt.memory.map((m) => (m.id === blockId ? { ...m, content } : m)),
  });
}

export async function removeMemoryBlock(
  playthroughId: string,
  blockId: string,
): Promise<void> {
  const pt = await getPlaythrough(playthroughId);
  if (!pt) return;
  await updatePlaythrough(playthroughId, {
    memory: pt.memory.filter((m) => m.id !== blockId),
  });
}

// ── Sessions ───────────────────────────────────────────────────
export async function listSessions(
  playthroughId: string,
): Promise<Session[]> {
  return db.sessions
    .where("playthroughId")
    .equals(playthroughId)
    .reverse()
    .sortBy("startedAt");
}

export async function getSession(id: string): Promise<Session | undefined> {
  return db.sessions.get(id);
}

export async function createSession(
  playthroughId: string,
): Promise<Session> {
  const session: Session = {
    id: uid(),
    playthroughId,
    startedAt: Date.now(),
    messages: [],
  };
  await db.sessions.add(session);
  await updatePlaythrough(playthroughId, { lastSessionId: session.id });
  return session;
}

export async function appendMessage(
  sessionId: string,
  message: Omit<Message, "id" | "timestamp"> & Partial<Pick<Message, "id">>,
): Promise<Message> {
  const session = await getSession(sessionId);
  if (!session) throw new Error(`session ${sessionId} not found`);
  const full: Message = {
    ...message,
    id: message.id ?? uid(),
    timestamp: Date.now(),
  };
  await db.sessions.update(sessionId, { messages: [...session.messages, full] });
  return full;
}

// Replace a message's content/sources (used when a streamed reply finishes).
export async function updateMessage(
  sessionId: string,
  messageId: string,
  changes: Partial<Pick<Message, "content" | "sources">>,
): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;
  await db.sessions.update(sessionId, {
    messages: session.messages.map((m) =>
      m.id === messageId ? { ...m, ...changes } : m,
    ),
  });
}

export async function endSession(
  sessionId: string,
  summary: string,
): Promise<void> {
  await db.sessions.update(sessionId, { summary, endedAt: Date.now() });
}

// A session counts as "today" if it started on the current calendar date.
export function isToday(timestamp: number): boolean {
  const d = new Date(timestamp);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
