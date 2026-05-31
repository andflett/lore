export interface ModelOption {
  id: string; // gateway "provider/model-name" string
  label: string;
  // Compact name shown in the inline switcher inside the chat input.
  short: string;
  provider: string;
  // "demo" runs on our shared server keys (no setup, capped). "byok" needs the
  // user's own Anthropic key — gated in the picker until a key is present.
  tier: "demo" | "byok";
  notes?: string;
}

export const MODELS: ModelOption[] = [
  {
    id: "groq/openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    short: "Demo",
    provider: "Demo",
    tier: "demo",
    notes: "Free · no key needed · capped",
  },
  {
    id: "anthropic/claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    short: "Haiku 4.5",
    provider: "Anthropic",
    tier: "byok",
    notes: "Fast · best search & citations",
  },
  {
    id: "anthropic/claude-sonnet-4-5",
    label: "Claude Sonnet 4.5",
    short: "Sonnet 4.5",
    provider: "Anthropic",
    tier: "byok",
    notes: "Highest quality",
  },
];

// The shared free model. Also the server-side fallback: an Anthropic id with no
// key resolves to this so chat keeps working (see lib/provider.ts).
export const DEMO_MODEL = "groq/openai/gpt-oss-120b";
export const DEFAULT_MODEL = DEMO_MODEL;

// Once the user brings an Anthropic key, new playthroughs default to Haiku —
// it's the recommended everyday model (fast, great citations).
export const DEFAULT_BYOK_MODEL = "anthropic/claude-haiku-4-5";

// The model a fresh playthrough should start on, given whether the user has
// configured their own Anthropic key. With a key → Haiku; without → the demo.
export function preferredDefaultModel(hasAnthropicKey: boolean): string {
  return hasAnthropicKey ? DEFAULT_BYOK_MODEL : DEMO_MODEL;
}

const MODEL_IDS = new Set(MODELS.map((m) => m.id));

// True if `id` is one of the models we actually offer. The chat/session-end
// routes use this to reject arbitrary client-supplied model strings (the body
// is public) — an unknown id is coerced to DEFAULT_MODEL rather than passed
// through to a provider.
export function isKnownModel(id: string): boolean {
  return MODEL_IDS.has(id);
}

export function modelLabel(id: string): string {
  return MODELS.find((m) => m.id === id)?.label ?? id;
}

export function modelShort(id: string): string {
  return MODELS.find((m) => m.id === id)?.short ?? id;
}

// Group models by provider for the picker UI.
export function modelsByProvider(): Record<string, ModelOption[]> {
  return MODELS.reduce<Record<string, ModelOption[]>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});
}
