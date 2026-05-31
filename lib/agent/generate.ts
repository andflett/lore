import { streamText, type StreamTextResult } from "ai";
import { resolveModel } from "@/lib/provider";
import { buildAnswerPrompt } from "@/lib/build-answer-prompt";
import type { AgentStateType } from "./state";

// Rough char→token estimate. Avoids pulling in a real tokenizer dep just for
// observability — the ratio is within ±20% for English prose, which is fine
// for spotting growth trends in the dev log.
const approxTokens = (s: string) => Math.ceil(s.length / 4);

// Streams the final cited answer from the gathered context. No tool-calling —
// the search already happened in the graph, so even weak models stay reliable.
export function streamAnswer(
  state: AgentStateType,
): StreamTextResult<Record<string, never>, never> {
  const context = state.results
    .map((r) => `[${r.index}] ${r.title} (${r.url})\n${r.content}`)
    .join("\n\n---\n\n");

  const userContent =
    state.results.length > 0
      ? `${state.query}\n\nSearch results to cite with [n]:\n${context}`
      : state.query;

  const system = buildAnswerPrompt(state.game, state.playthrough, {
    hasResults: state.results.length > 0,
    kind: state.kind,
    spoilerRisk: state.spoilerRisk,
    hasFactualGrounding: state.hasFactualGrounding,
  });

  // Observability: track payload growth across turns so we know when to
  // turn on history compaction (plan: ~/.claude/plans/can-we-think-about-precious-dusk.md).
  const histTokens = state.priorMessages.reduce(
    (n, m) => n + approxTokens(m.content),
    0,
  );
  const sysTokens = approxTokens(system);
  const curTokens = approxTokens(userContent);
  console.log(
    `[agent] tokens~ sys=${sysTokens} history=${histTokens} current=${curTokens} total=${sysTokens + histTokens + curTokens} turns=${state.priorMessages.length}`,
  );

  return streamText({
    model: resolveModel(state.modelId),
    system,
    messages: [
      ...state.priorMessages,
      { role: "user", content: userContent },
    ],
    // gpt-oss is a reasoning model. Per Groq provider docs, set reasoningFormat
    // so the SDK separates reasoning from text — otherwise heavy prompts route
    // everything to the reasoning channel and text-delta is empty. Effort is
    // 'medium' (not 'low') because attributing each claim to the right [n]
    // source is reasoning work — at 'low' the model skips it and under-cites.
    // The trade is slightly slower answers; citations are core to the tool.
    providerOptions: {
      groq: { reasoningFormat: "parsed", reasoningEffort: "medium" },
    },
  });
}
