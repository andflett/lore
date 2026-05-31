export interface ModelOption {
  id: string; // gateway "provider/model-name" string
  label: string;
  // Compact name shown in the inline switcher inside the chat input.
  short: string;
  provider: string;
  notes?: string;
}

export const MODELS: ModelOption[] = [
  {
    id: "groq/openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    short: "GPT-OSS",
    provider: "Groq (free)",
    notes: "Free · default · structured output",
  },
  {
    id: "groq/llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    short: "Llama 3.3",
    provider: "Groq (free)",
    notes: "Free · fast · plain chat only",
  },
  {
    id: "anthropic/claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    short: "Haiku 4.5",
    provider: "Anthropic",
    notes: "Fast · best search & citations",
  },
  {
    id: "anthropic/claude-sonnet-4-5",
    label: "Claude Sonnet 4.5",
    short: "Sonnet 4.5",
    provider: "Anthropic",
    notes: "Highest quality",
  },
];

export const DEFAULT_MODEL = MODELS[0].id;

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
