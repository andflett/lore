import { createAnthropic } from "@ai-sdk/anthropic";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";
import { DEFAULT_MODEL } from "./models";
import type { UserKeys } from "./types";

// Groq stays a server-side singleton (it's the free default — not user-
// overridable). Anthropic is built per-request so a BYOK key can be injected;
// when no user key is supplied it uses the server env key.
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

function anthropicKey(keys?: UserKeys): string | undefined {
  return keys?.anthropic || process.env.ANTHROPIC_API_KEY;
}

function makeModel(id: string, keys?: UserKeys): LanguageModel {
  const [provider, ...rest] = id.split("/");
  const name = rest.join("/");
  switch (provider) {
    case "anthropic":
      return createAnthropic({ apiKey: anthropicKey(keys) })(name);
    case "groq":
      return groq(name);
    default:
      throw new Error(`Unknown model provider: ${provider} (from "${id}")`);
  }
}

// Resolve a registry model id to a concrete provider model. Calls providers
// directly (no Vercel AI Gateway). A BYOK Anthropic key (from `keys`) takes
// precedence over the server env key. If the chosen provider has no key at all
// (e.g. an Anthropic id with neither a user nor a server key), gracefully fall
// back to DEFAULT_MODEL so chat keeps working on the free Groq tier.
export function resolveModel(id: string, keys?: UserKeys): LanguageModel {
  const [provider] = id.split("/");
  const haveKey =
    (provider === "anthropic" && anthropicKey(keys)) ||
    (provider === "groq" && process.env.GROQ_API_KEY);
  if (!haveKey && id !== DEFAULT_MODEL) {
    console.warn(
      `Provider "${provider}" key missing for model "${id}"; falling back to ${DEFAULT_MODEL}`,
    );
    return makeModel(DEFAULT_MODEL, keys);
  }
  return makeModel(id, keys);
}

// True if the id resolves to Anthropic *and* a key is present (BYOK or server)
// — i.e. the call won't fall back to the default Groq model. Used to gate
// Anthropic-only features like prompt caching, so we never attach cacheControl
// to a Groq call.
export function isAnthropic(id: string, keys?: UserKeys): boolean {
  return id.startsWith("anthropic/") && !!anthropicKey(keys);
}
