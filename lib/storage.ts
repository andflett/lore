import type { UserKeys } from "./types";

// localStorage keys (client-only persistence outside IndexedDB).
export const LAST_PLAYTHROUGH_KEY = "lk:lastPlaythroughId";
export const USER_KEYS_KEY = "lk:userKeys";
export const CLIENT_ID_KEY = "lk:clientId";

// Stable per-browser id, generated on first use. Sent with chat requests so the
// demo's per-identity soft cap has something to key on (best-effort — cleared
// storage resets it; that's fine, the global kill-switch is the hard guard).
export function getClientId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

// BYOK keys live in localStorage (not IndexedDB): they're config/secrets, not
// playthrough data, and need a synchronous read when building a request. They
// never leave the browser except in the request body to our own API.
export function getUserKeys(): UserKeys {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(USER_KEYS_KEY);
    return raw ? (JSON.parse(raw) as UserKeys) : {};
  } catch {
    return {};
  }
}

export function setUserKeys(keys: UserKeys): void {
  if (typeof window === "undefined") return;
  // Drop empty strings so an empty field reads as "not set".
  const cleaned: UserKeys = {};
  if (keys.anthropic?.trim()) cleaned.anthropic = keys.anthropic.trim();
  if (keys.tavily?.trim()) cleaned.tavily = keys.tavily.trim();
  localStorage.setItem(USER_KEYS_KEY, JSON.stringify(cleaned));
}

export function setLastPlaythrough(id: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(LAST_PLAYTHROUGH_KEY, id);
  }
}

// Clear the stored last-playthrough id, but only if it matches the given id
// (so we don't blow away a more recent selection).
export function clearLastPlaythrough(idIfMatch: string): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(LAST_PLAYTHROUGH_KEY) === idIfMatch) {
    localStorage.removeItem(LAST_PLAYTHROUGH_KEY);
  }
}
