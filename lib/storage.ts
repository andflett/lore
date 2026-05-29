// localStorage keys (client-only persistence outside IndexedDB).
export const LAST_PLAYTHROUGH_KEY = "lk:lastPlaythroughId";

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
