import { agentGraph } from "./graph";
import { streamAnswer } from "./generate";
import type { AgentStateType, RetrievedResult } from "./state";
import type { AgentEvent } from "./events";
import type { Game, Playthrough, UserKeys } from "@/lib/types";

interface Input {
  query: string;
  game: Game;
  playthrough: Playthrough;
  modelId: string;
  keys: UserKeys;
  priorMessages: { role: "user" | "assistant"; content: string }[];
}

// Runs the LangGraph agent (progress + retrieval), then streams the final
// answer token-by-token. Emits SSE-framed AgentEvents.
export function createAgentStream(input: Input): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (e: AgentEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));

      try {
        const stream = await agentGraph.stream({
          query: input.query,
          game: input.game,
          playthrough: input.playthrough,
          modelId: input.modelId,
          keys: input.keys,
          priorMessages: input.priorMessages,
        });

        let finalState: Partial<AgentStateType> = {};
        // `.stream()` yields per-node deltas, not accumulated state. The search
        // node returns ONLY its newest batch, so we accumulate here to mirror
        // the graph's `results` reducer. A shallow merge into finalState would
        // keep just the last search's batch — and a narrower second search that
        // returns nothing would wipe the sources entirely, making the answer
        // silently fall back to "unsourced". Indices were already assigned with
        // a running offset in searchNode, so they stay contiguous (1..N).
        const results: RetrievedResult[] = [];
        for await (const chunk of stream) {
          const entry = Object.entries(chunk)[0];
          if (!entry) continue;
          const [, update] = entry as [string, Partial<AgentStateType>];
          if (update.currentStep && update.stepMessage) {
            emit({ type: "progress", step: update.currentStep, message: update.stepMessage });
          }
          if (update.results?.length) results.push(...update.results);
          finalState = { ...finalState, ...update };
        }
        if (results.length > 0) {
          emit({
            type: "sources",
            sources: results.map((r) => ({
              index: r.index,
              title: r.title,
              url: r.url,
              domain: r.domain,
            })),
          });
        }

        if (finalState.kind) {
          emit({ type: "meta", kind: finalState.kind, queries: finalState.queriesRun ?? [] });
        }

        emit({ type: "progress", step: "generate", message: "Writing answer…" });

        // Node updates don't echo the input fields, so merge them back in for generate.
        const generateState = {
          ...finalState,
          query: input.query,
          game: input.game,
          playthrough: input.playthrough,
          modelId: input.modelId,
          keys: input.keys,
          priorMessages: input.priorMessages,
          results,
        } as AgentStateType;

        // Use fullStream so stream-level errors surface (otherwise textStream
        // silently terminates on a 400 like "Tool choice is none...").
        const result = streamAnswer(generateState);
        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            emit({ type: "token", text: part.text });
          } else if (part.type === "error") {
            const message =
              part.error instanceof Error
                ? part.error.message
                : typeof part.error === "string"
                  ? part.error
                  : JSON.stringify(part.error);
            emit({ type: "error", message });
          }
        }

        emit({ type: "done" });
      } catch (err) {
        emit({ type: "error", message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });
}
