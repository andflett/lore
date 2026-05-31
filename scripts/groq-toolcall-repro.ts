/**
 * Throwaway repro for the D2/D4/D18 question: does the current Groq gpt-oss-120b
 * still break when (a) we hand it a tool definition, or (b) we merely mention a
 * "search tool" in the system prompt? This is what forced us to keep all
 * retrieval in code and strip tool language from the generate prompt.
 *
 * Run locally (needs GROQ_API_KEY; the web sandbox blocks api.groq.com):
 *   GROQ_API_KEY=... npx tsx scripts/groq-toolcall-repro.ts
 *
 * Record the outcome in docs/decisions.md D18. If both probes now succeed,
 * Groq's tool handling may have improved — but note D18's other reasons
 * (citation stability, provider bifurcation) for keeping retrieval in code.
 */
import { generateText, streamText, tool } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";

const MODEL = "openai/gpt-oss-120b";

async function main() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is not set — cannot run the repro.");
    process.exit(1);
  }
  const groq = createGroq({ apiKey });
  const model = groq(MODEL);

  // Probe A: hand the model a real tool definition, no toolChoice constraint.
  console.log(`\n[A] tool definition provided (${MODEL})`);
  try {
    const { text, toolCalls } = await generateText({
      model,
      prompt: "What is the weakness of the Tree Sentinel in Elden Ring?",
      tools: {
        webSearch: tool({
          description: "Search the web for game information.",
          inputSchema: z.object({ query: z.string() }),
          execute: async ({ query }) => `(stub results for: ${query})`,
        }),
      },
      providerOptions: { groq: { reasoningFormat: "parsed" } },
    });
    console.log(`  OK — toolCalls=${toolCalls?.length ?? 0}, text len=${text.length}`);
  } catch (e) {
    console.log(`  THREW: ${(e as Error).message}`);
  }

  // Probe B: no tools passed, but the system prompt mentions a "search tool".
  // This is the case that produced "Tool choice is none, but model called a
  // tool" + an empty bubble (D4).
  console.log(`\n[B] "search tool" mentioned in system prompt, no tools passed`);
  try {
    const res = streamText({
      model,
      system:
        "You are a gaming companion. Use the search tool to look up facts before answering.",
      prompt: "What is the weakness of the Tree Sentinel in Elden Ring?",
      providerOptions: { groq: { reasoningFormat: "parsed", reasoningEffort: "medium" } },
    });
    let deltas = 0;
    for await (const chunk of res.textStream) {
      void chunk;
      deltas++;
    }
    console.log(`  OK — text-delta count=${deltas} (0 ⇒ the empty-bubble bug)`);
  } catch (e) {
    console.log(`  THREW: ${(e as Error).message}`);
  }
}

main();
