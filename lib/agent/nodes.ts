import { generateObject } from "ai";
import { resolveModel } from "@/lib/provider";
import {
  searchTavily,
  resolveEffectiveDomains,
  resolveFactualDomains,
  type TavilyOptions,
} from "@/lib/tavily";
import {
  decisionSchema,
  groundingSchema,
  isGameContentKind,
  type QuestionKind,
} from "./schemas";
import type { AgentStateType, RetrievedResult } from "./state";

// Up to three passes: an opinion/question-shaped pass, a cross-reference pass,
// and a dedicated factual (wiki) pass when the ground node finds the hard facts
// missing. Tavily basic searches are fast, so the latency budget holds.
export const MAX_SEARCHES = 3;

// Subjective questions ("what's best?", "is X worth it?", strategy, lore
// interpretation) benefit from cross-referencing two sources. Objective
// lookups ("where is X?", "what does Y do?") are well-served by one good
// result — a second search adds latency without much added confidence.
// `other` defaults to true because we'd rather over-search than answer thin.
const SHOULD_DO_SECOND_SEARCH: Record<QuestionKind, boolean> = {
  build: true, // subjective: trade-offs, recommendations
  boss: true, // subjective: tactics vary by build / patch
  quest: true, // mixed: pure "where" is objective, but multi-step "how do I…" benefits
  lore: true, // subjective: canon vs fan-theory needs cross-ref
  item: false, // objective: one wiki page usually has effect + location
  mechanic: false, // objective: how a system works is one lookup
  meta: false, // about the companion app — no game search needed
  other: true, // safe default
};

// Append a small RPG-specific hint to the query for kinds that benefit.
function shapeQuery(query: string, kind: QuestionKind): string {
  switch (kind) {
    case "boss":
      return `${query} weakness OR strategy OR tactics`;
    case "build":
      return `${query} viable build OR recommendation`;
    case "quest":
      return `${query} location OR walkthrough`;
    case "item":
      return `${query} location OR effect`;
    default:
      return query;
  }
}

// Shape a definitional/factual follow-up query toward the hard facts (what the
// subject does, its numbers, where it is) rather than community opinion. The
// nextQuery from the ground node is already definitional; this nudges it.
function shapeFactualQuery(query: string): string {
  return `${query} effect OR mechanic OR how it works`;
}

// Tavily depth: 'advanced' returns longer snippets, costs more credits.
// Use it for kinds where nuance matters; 'basic' for quick lookups.
function depthFor(kind: QuestionKind): TavilyOptions["searchDepth"] {
  return kind === "build" || kind === "boss" || kind === "lore"
    ? "advanced"
    : "basic";
}

// Compact a single message for the decide prompt. Keeps decide cheap while
// preserving the head + tail of long answers (where the subject of a follow-up
// usually lives).
function compactForDecide(text: string, max = 400): string {
  if (text.length <= max) return text;
  const head = Math.floor(max * 0.6);
  const tail = max - head - 1;
  return `${text.slice(0, head)}…${text.slice(-tail)}`;
}

// ── decide: should we search, what kind of question, how spoilery? ────
export async function decideNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const pt = state.playthrough;
  const contextLines = [
    `Game: ${state.game.name}`,
  ];
  if (pt.playstyleNotes) {
    contextLines.push(`Player preferences: ${pt.playstyleNotes}`);
  }

  // Recent conversation gives the model what it needs to classify follow-ups
  // ("and which is best?") against the actual topic, not the bare words.
  const recent = state.priorMessages.slice(-4);
  if (recent.length > 0) {
    contextLines.push("", "Recent conversation:");
    for (const m of recent) {
      const role = m.role === "user" ? "Player" : "Companion";
      contextLines.push(`${role}: ${compactForDecide(m.content)}`);
    }
  }

  contextLines.push(
    "",
    `Player's new question: "${state.query}"`,
    "",
    "Classify the question (kind), assess spoiler risk relative to the player's current progress, and decide whether a wiki search is needed.",
    "If the player's question is a follow-up that refers back to a previous answer (\"and which is best?\", \"how do I get there?\", \"what about for a mage?\"), classify based on the full topic in context — not the bare words. A follow-up about a game subject still needs a search.",
    "If preferences mention 'blind' or 'no spoilers', be conservative: rate even minor reveals as 'minor', and story/late-game content as 'major'.",
    "When suggesting a query, avoid keywords that would surface much-later content than the player has likely reached.",
  );

  try {
    const { object } = await generateObject({
      model: resolveModel(state.modelId),
      schema: decisionSchema,
      prompt: contextLines.join("\n"),
    });
    // Force a search for any game-content question, even if the model thought
    // it could answer from memory. Game facts must be grounded in a source;
    // answering "from training" is exactly how the Prayer-skill bug happened.
    // (Mirrors D3: search rather than risk a wrong/uncited answer.)
    const needsSearch = object.needsSearch || isGameContentKind(object.kind);
    return {
      needsSearch,
      kind: object.kind,
      spoilerRisk: object.spoilerRisk,
      subject: object.subject ?? null,
      nextQuery: object.query ?? state.query,
      currentStep: "decide",
      stepMessage: needsSearch
        ? "Consulting the wikis…"
        : "Answering from memory…",
    };
  } catch {
    // If the decision call flakes (e.g. a model without structured-output
    // support), search rather than risk answering with fabricated citations.
    return {
      needsSearch: true,
      kind: "other",
      spoilerRisk: "minor",
      subject: null,
      nextQuery: state.query,
      currentStep: "decide",
      stepMessage: "Consulting the wikis…",
    };
  }
}

// ── search: run Tavily, index results ──────────────────────────────────
export async function searchNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const baseQuery = state.nextQuery ?? state.query;
  // A factual pass targets the definitional wiki page: drop opinion domains and
  // shape toward "what it does" instead of "what people recommend".
  const factual = state.nextQueryIsFactual;
  const query = factual
    ? shapeFactualQuery(baseQuery)
    : shapeQuery(baseQuery, state.kind);
  const { include, exclude } = factual
    ? resolveFactualDomains(state.game)
    : resolveEffectiveDomains(state.game);
  const raw = await searchTavily(query, {
    includeDomains: include,
    excludeDomains: exclude,
    searchDepth: depthFor(state.kind),
  });
  const offset = state.results.length;
  const indexed: RetrievedResult[] = raw.map((r, i) => ({
    index: offset + i + 1,
    title: r.title,
    url: r.url,
    domain: r.domain,
    content: r.content,
  }));
  return {
    results: indexed,
    retrievalCount: state.retrievalCount + 1,
    queriesRun: [baseQuery],
    // One-shot directive: consume it so the next pass defaults to a normal
    // search unless the ground node asks for another factual one.
    nextQueryIsFactual: false,
    currentStep: "search",
    stepMessage: factual
      ? `Checking the wiki for "${baseQuery}"`
      : `Found ${indexed.length} source${indexed.length === 1 ? "" : "s"} for "${baseQuery}"`,
  };
}

// ── ground: do the sources hold the hard FACTS, or search again? ────────
// Replaces the old "is this enough?" assess node with a fact-aware check: even
// when we have plenty of opinion-shaped results (e.g. Reddit build posts), if
// they don't establish what the subject actually *does*, we fire one more,
// wiki-prioritised, definitional search. This is the gate that catches the
// Prayer-skill failure mode.
export async function groundNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  // Hard cap — we've searched as much as we will. Keep whatever grounding
  // confidence the last assessment established.
  if (state.retrievalCount >= MAX_SEARCHES) {
    return {
      hasEnoughContext: true,
      currentStep: "ground",
      stepMessage: "Cross-referencing sources…",
    };
  }
  // Objective lookup kinds (item/mechanic) hit the wiki on the first pass and
  // one good page usually carries the facts — trust it, skip the extra call.
  if (!SHOULD_DO_SECOND_SEARCH[state.kind] && state.results.length > 0) {
    return {
      hasEnoughContext: true,
      hasFactualGrounding: true,
      currentStep: "ground",
      stepMessage: "Cross-referencing sources…",
    };
  }

  const sample = state.results
    .slice(0, 6)
    .map(
      (r) =>
        `- ${r.title} (${r.domain}): ${r.content.slice(0, 120).replace(/\s+/g, " ")}…`,
    )
    .join("\n");
  try {
    const { object } = await generateObject({
      model: resolveModel(state.modelId),
      schema: groundingSchema,
      prompt: [
        `Question: "${state.query}"`,
        `Question kind: ${state.kind}`,
        state.subject ? `Subject (whose facts matter): ${state.subject}` : "",
        `Queries already run: ${state.queriesRun.join(" | ")}`,
        "",
        "Retrieved so far:",
        sample || "(none)",
        "",
        "Do these sources establish the hard FACTS needed to answer — what the subject actually does, its numbers/effects, where it is — and not just opinions or build chatter? If not, suggest ONE definitional query (include the game name and subject) that would fetch the wiki page stating those facts, and set nextQueryIsFactual=true.",
      ]
        .filter(Boolean)
        .join("\n"),
    });
    return {
      hasEnoughContext: object.hasEnough,
      hasFactualGrounding: object.hasEnough,
      nextQuery: object.nextQuery,
      nextQueryIsFactual: object.nextQueryIsFactual,
      currentStep: "ground",
      stepMessage: object.hasEnough
        ? "Cross-referencing sources…"
        : `Checking the wiki: "${object.nextQuery ?? object.missingFact ?? ""}"`,
    };
  } catch {
    return {
      hasEnoughContext: true,
      hasFactualGrounding: state.results.length > 0,
      currentStep: "ground",
      stepMessage: "Cross-referencing sources…",
    };
  }
}
