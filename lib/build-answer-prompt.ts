import type { Game, Playthrough } from "./types";
import {
  isGameContentKind,
  type QuestionKind,
  type SpoilerRisk,
} from "./agent/schemas";

interface Options {
  hasResults: boolean;
  kind: QuestionKind;
  spoilerRisk: SpoilerRisk;
  // Whether the ground node judged the retrieved sources to actually hold the
  // hard facts (vs. being opinion-heavy). When false, the prompt leans harder
  // on the "don't assert unverified mechanics" rule.
  hasFactualGrounding: boolean;
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
  const { hasResults, kind, spoilerRisk, hasFactualGrounding } = options;
  const gameContent = isGameContentKind(kind);
  const lines: string[] = [
    "You are a knowledgeable gaming companion helping with a specific playthrough.",
    "",
    `GAME: ${game.name}`,
    "",
    `PLAYTHROUGH: ${playthrough.name}`,
  ];

  if (playthrough.characterName) lines.push(`CHARACTER: ${playthrough.characterName}`);
  if (playthrough.characterClass) lines.push(`CLASS: ${playthrough.characterClass}`);
  if (playthrough.playstyleNotes) lines.push(`PREFERENCES: ${playthrough.playstyleNotes}`);

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
      "",
      "GROUNDING (what you may state as fact):",
      "- State game mechanics, effects, numbers, locations and other hard facts ONLY when a provided source supports them, followed by its [n].",
      "- If the sources cover opinions or builds but do NOT confirm a specific factual claim, do not assert it from prior knowledge. Say plainly that the sources don't confirm it and suggest checking the game's wiki. Still answer the parts you CAN ground.",
      "- Subjective advice (build trade-offs, recommendations, what's 'fun') is fine — frame it as judgement and keep it clearly separate from unverified facts.",
    );
    if (!hasFactualGrounding) {
      lines.push(
        "- Note: the retrieved sources are mostly community opinion and may NOT establish the underlying mechanics. Be especially careful — do not state how something works as fact unless a source explicitly says so.",
      );
    }
  } else if (gameContent) {
    // No sources, but a game-content question — the riskiest case for training
    // hallucination (this is the Prayer-skill failure). Refuse the unverifiable
    // factual part rather than assert it confidently.
    lines.push(
      "",
      "NO SOURCES — answer carefully:",
      "- Do NOT state specific mechanics, numbers, item effects, locations or other hard facts you cannot verify from a source.",
      "- If the question hinges on such a fact, say plainly that you don't have a source to confirm it and recommend checking the game's wiki — do not guess from memory.",
      "- Broad, widely-known guidance and general approach are fine; just don't dress up an uncertain specific as fact.",
    );
  } else {
    // Conversational (meta/other): answering from general knowledge is correct
    // here — it's about the app or small-talk, not game facts. No hedging.
    lines.push(
      "",
      "- Answer from general knowledge. Do not add disclaimers about your sources or training data — the UI handles that separately.",
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
