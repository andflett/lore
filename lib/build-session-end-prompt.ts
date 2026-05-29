import type { Game, Playthrough, Session } from "./types";

// Pure: (game, playthrough, session) => session-end prompt string.
export function buildSessionEndPrompt(
  game: Game,
  playthrough: Playthrough,
  session: Session,
): string {
  const transcript = session.messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  return [
    `The following is a Q&A session from a ${game.name} playthrough ("${playthrough.name}").`,
    "Review it and:",
    "1. Write a 2-3 sentence plain summary of what was covered this session.",
    "2. List any facts that should be added to the playthrough's permanent memory.",
    "",
    "Only propose durable facts (quests completed, choices made, locations reached, build decisions).",
    "Do not propose questions asked, information the player already knew, or things that were in-progress.",
    "",
    "SESSION:",
    transcript || "(no messages)",
  ].join("\n");
}
