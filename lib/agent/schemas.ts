import { z } from "zod";

// Kinds of questions the player asks about an RPG. Used to shape both the
// search query (e.g. boss → "weakness OR strategy") and the answer tone
// (build → list options with trade-offs; quest → lead with location).
export const QUESTION_KINDS = [
  "quest", // "where is X", "how do I start Y", quest steps
  "build", // class/stat/gear recommendations, "is X worth taking"
  "boss", // boss fight tactics, weaknesses
  "lore", // story/world questions (spoiler-sensitive)
  "item", // what does X do, where to find Y item
  "mechanic", // game systems (combat, crafting, leveling rules)
  "meta", // app/companion question, not about the game
  "other",
] as const;

export type QuestionKind = (typeof QUESTION_KINDS)[number];

// Conversational kinds: the absence of a wiki source is expected and
// uninteresting (the question is about the app or is small-talk). Every other
// kind is game-content — those carry factual claims that must be grounded in a
// source, and the UI flags an unsourced game-content answer. Shared by the
// agent (force-search, grounding contract) and the chat UI so they never drift.
export const CONVERSATIONAL_KINDS: ReadonlySet<QuestionKind> = new Set([
  "meta",
  "other",
]);

export const isGameContentKind = (kind: QuestionKind): boolean =>
  !CONVERSATIONAL_KINDS.has(kind);

// 'none'  — safe, no plot/late-game content.
// 'minor' — mild reveal (e.g. an early region exists).
// 'major' — story-defining (endings, twists, major NPC fates).
export const SPOILER_RISKS = ["none", "minor", "major"] as const;
export type SpoilerRisk = (typeof SPOILER_RISKS)[number];

// decide node: does this question need a web search, what kind of question is
// it, and how spoiler-risky is it?
export const decisionSchema = z.object({
  needsSearch: z
    .boolean()
    .describe(
      "True if answering well requires specific, up-to-date game knowledge (quest steps, item/enemy/location details). False for general questions answerable from training.",
    ),
  query: z
    .string()
    .nullable()
    .describe(
      "If needsSearch is true, the search query. Always include the game name.",
    ),
  subject: z
    .string()
    .nullable()
    .describe(
      "The core game noun the question hinges on, if any — e.g. 'Prayer skill', 'Moonveil katana', 'the Frenzied Flame ending'. Used to fetch a definitional/wiki source for the hard facts. Null for app/meta or subject-less questions.",
    ),
  kind: z
    .enum(QUESTION_KINDS)
    .describe(
      "Kind of question. quest=where/how-to; build=stat/gear advice; boss=fight tactics; lore=story/world; item=what-does-X-do; mechanic=systems; meta=about the companion app; other=anything else.",
    ),
  spoilerRisk: z
    .enum(SPOILER_RISKS)
    .describe(
      "Spoiler risk relative to the player's current progress. 'major' = endings, plot twists, key NPC fates. 'minor' = a region exists, an item exists. 'none' = mechanics, builds, public-knowledge content.",
    ),
});

// ground node: do the retrieved sources actually contain the hard FACTS needed
// to answer, or only opinion/chatter? If facts are missing, what query would
// fetch them? This is what catches "5 Reddit build posts, zero wiki pages on
// what the skill does" — the model can ask us to fetch the definitional source.
export const groundingSchema = z.object({
  hasEnough: z
    .boolean()
    .describe(
      "True only if the retrieved sources contain the hard FACTS (definitions, effects, numbers, locations) needed to answer — not just opinions or build chatter.",
    ),
  missingFact: z
    .string()
    .nullable()
    .describe(
      "If hasEnough is false, the factual gap that remains, in a few words (e.g. 'what the Prayer skill actually does').",
    ),
  nextQuery: z
    .string()
    .nullable()
    .describe(
      "If hasEnough is false, a DIFFERENT complementary query to fill the gap — prefer a definitional query for the subject, not a reword of past queries.",
    ),
  nextQueryIsFactual: z
    .boolean()
    .describe(
      "True if nextQuery targets a definitional/wiki page about how the subject works (so we should drop community opinion sites for that pass).",
    ),
});
