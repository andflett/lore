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

// assess node: is the retrieved context enough, or do we need another search?
export const assessmentSchema = z.object({
  hasEnough: z.boolean(),
  nextQuery: z
    .string()
    .nullable()
    .describe(
      "If hasEnough is false, a DIFFERENT complementary query (not a reword of past queries).",
    ),
});
