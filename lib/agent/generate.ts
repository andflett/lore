import { streamText, type StreamTextResult } from "ai";
import { resolveModel } from "@/lib/provider";
import { buildAnswerPrompt } from "@/lib/build-answer-prompt";
import type { AgentStateType } from "./state";

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

  return streamText({
    model: resolveModel(state.modelId),
    system: buildAnswerPrompt(state.game, state.playthrough, {
      hasResults: state.results.length > 0,
      kind: state.kind,
      spoilerRisk: state.spoilerRisk,
    }),
    messages: [
      ...state.priorMessages,
      { role: "user", content: userContent },
    ],
    // gpt-oss is a reasoning model. Per Groq provider docs, set reasoningFormat
    // so the SDK separates reasoning from text — otherwise heavy prompts route
    // everything to the reasoning channel and text-delta is empty. Low effort
    // keeps responses snappy.
    providerOptions: {
      groq: { reasoningFormat: "parsed", reasoningEffort: "low" },
    },
  });
}
