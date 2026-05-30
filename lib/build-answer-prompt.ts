import type { Game, Playthrough } from "./types";
import type { QuestionKind, SpoilerRisk } from "./agent/schemas";

interface Options {
  hasResults: boolean;
  kind: QuestionKind;
  spoilerRisk: SpoilerRisk;
}

// Tone hint per question kind — keeps answers shaped to the question.
const KIND_TONE: Record<QuestionKind, string> = {
  quest:
    "Lead with the location/start point. Then give the minimal steps to start the quest. Don't recount the whole quest unless asked.",
  build:
    "List 2–3 viable options with their trade-offs (durability vs damage, etc.). Recommend one for this character. Keep it actionable.",
  boss:
    "Lead with the key weakness or pattern. Then 2–3 tactical bullets. Reserve full move-by-move analysis for follow-ups.",
  lore:
    "Stay grounded in what's confirmed in-game. Flag anything that's fan-theory. Be cautious about plot reveals (see SPOILERS).",
  item:
    "What it does, where to find it, and whether it's worth grabbing for this build. One short paragraph.",
  mechanic:
    "Explain the rule concretely with one example. Skip unrelated systems.",
  meta: "Answer briefly. This is about the companion app, not the game.",
  other: "Match the question's shape — short questions get short answers.",
};

// System prompt for the generate step. Distinct from build-system-prompt.ts:
// - No mention of a "search tool" — the search has already happened in the
//   graph. Mentioning tools makes gpt-oss emit tool calls, which Groq then
//   rejects ("Tool choice is none, but model called a tool").
// - Citations are described in terms of the search results we inject below.
// - kind + spoilerRisk tune the tone and spoiler handling.
export function buildAnswerPrompt(
  game: Game,
  playthrough: Playthrough,
  options: Options,
): string {
  const { hasResults, kind, spoilerRisk } = options;
  const lines: string[] = [
    "You are a knowledgeable gaming companion helping with a specific playthrough.",
    "",
    `GAME: ${game.name}`,
    "",
    `PLAYTHROUGH: ${playthrough.name}`,
  ];

  if (playthrough.characterName) lines.push(`CHARACTER: ${playthrough.characterName}`);
  if (playthrough.characterClass) lines.push(`CLASS: ${playthrough.characterClass}`);
  if (playthrough.difficulty) lines.push(`DIFFICULTY: ${playthrough.difficulty}`);
  if (playthrough.playstyleNotes) lines.push(`PREFERENCES: ${playthrough.playstyleNotes}`);
  if (playthrough.currentLocation) lines.push(`CURRENT LOCATION: ${playthrough.currentLocation}`);

  const memory =
    playthrough.memory.length > 0
      ? playthrough.memory
          .map((m) => `[${m.category.toUpperCase()}] ${m.content}`)
          .join("\n")
      : "Nothing recorded yet.";

  lines.push(
    "",
    "PLAYTHROUGH MEMORY:",
    memory,
    "",
    "---",
    "",
    "INSTRUCTIONS:",
    "- Answer the player's question concisely and practically.",
    "- Do not request tools, searches, or external lookups. Answer using the information already provided.",
    `- This is a ${kind.toUpperCase()} question. ${KIND_TONE[kind]}`,
  );

  if (hasResults) {
    lines.push(
      "",
      "CITATIONS (mandatory):",
      "- The user message includes numbered search results. Every factual claim derived from a result MUST be followed by its citation number in brackets, e.g. \"The Dying Knight is found in the Ossuary [1].\"",
      "- Cite the most specific source available. If multiple sources confirm the same claim, cite all of them: [1][2].",
      "- Cite no more than 3 sources per claim, and aim for 4 citations total across the whole answer. If you have more sources, pick the most specific.",
      "- Do not invent citation numbers. Only use numbers that appear in the provided results.",
    );
  } else {
    // No search ran. Answer from training knowledge without any meta-commentary
    // — the UI shows a small "unsourced" badge separately when the question
    // was game-content. Don't apologise in prose.
    lines.push(
      "",
      "- Answer from training knowledge. Do not add disclaimers about your sources or training data — the UI handles that separately.",
    );
  }

  // Spoiler handling, escalated when the player wants to stay blind.
  const wantsBlind = /\b(blind|no spoilers|don'?t spoil|spoiler[- ]?free)\b/i.test(
    playthrough.playstyleNotes ?? "",
  );

  lines.push("", "SPOILERS:");
  if (wantsBlind && spoilerRisk !== "none") {
    lines.push(
      `- The player wants to stay BLIND, and this is a ${spoilerRisk.toUpperCase()}-spoiler question.`,
      "- Do NOT answer the spoiler directly. Instead, briefly acknowledge that a full answer would spoil something, name what kind of spoiler it would be (e.g. \"a major plot reveal\", \"a late-game item\"), and ask if they want you to answer anyway.",
      "- You may still answer the non-spoilery parts if they're clearly separable.",
    );
  } else {
    lines.push(
      "- Do not volunteer spoilers beyond what the question requires.",
      "- If preferences indicate the player is playing blind, err on the side of caution.",
    );
  }

  lines.push(
    "",
    "MEMORY PROPOSALS:",
    "If this conversation reveals something worth remembering about the playthrough — a quest completed, a major choice made, a location reached — append a proposal at the end of your response using this exact format:",
    "",
    '[MEMORY_PROPOSAL category="quest|choice|character|location|note"]',
    "One clear sentence describing the fact to remember.",
    "[/MEMORY_PROPOSAL]",
    "",
    "Only propose genuinely durable facts, not questions or in-progress things.",
  );

  return lines.join("\n");
}
