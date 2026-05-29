import { createAnthropic } from "@ai-sdk/anthropic";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";
import { DEFAULT_MODEL } from "./models";

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

function makeModel(id: string): LanguageModel {
  const [provider, ...rest] = id.split("/");
  const name = rest.join("/");
  switch (provider) {
    case "anthropic":
      return anthropic(name);
    case "groq":
      return groq(name);
    default:
      throw new Error(`Unknown model provider: ${provider} (from "${id}")`);
  }
}

// Resolve a registry model id to a concrete provider model. Calls providers
// directly (no Vercel AI Gateway). If the chosen provider's key isn't set
// (e.g. an old playthrough stored an Anthropic id but only GROQ_API_KEY is
// present), gracefully fall back to DEFAULT_MODEL so chat keeps working.
export function resolveModel(id: string): LanguageModel {
  const [provider] = id.split("/");
  const haveKey =
    (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) ||
    (provider === "groq" && process.env.GROQ_API_KEY);
  if (!haveKey && id !== DEFAULT_MODEL) {
    console.warn(
      `Provider "${provider}" key missing for model "${id}"; falling back to ${DEFAULT_MODEL}`,
    );
    return makeModel(DEFAULT_MODEL);
  }
  return makeModel(id);
}
