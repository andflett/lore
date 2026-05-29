export interface ModelOption {
  id: string; // gateway "provider/model-name" string
  label: string;
  provider: string;
  notes?: string;
}

export const MODELS: ModelOption[] = [
  {
    id: "groq/openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    provider: "Groq (free)",
    notes: "Free · default · structured output",
  },
  {
    id: "groq/llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    provider: "Groq (free)",
    notes: "Free · fast · plain chat only",
  },
  {
    id: "anthropic/claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    provider: "Anthropic",
    notes: "Fast · best search & citations",
  },
  {
    id: "anthropic/claude-sonnet-4-5",
    label: "Claude Sonnet 4.5",
    provider: "Anthropic",
    notes: "Highest quality",
  },
];

export const DEFAULT_MODEL = MODELS[0].id;

export function modelLabel(id: string): string {
  return MODELS.find((m) => m.id === id)?.label ?? id;
}

// Group models by provider for the picker UI.
export function modelsByProvider(): Record<string, ModelOption[]> {
  return MODELS.reduce<Record<string, ModelOption[]>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});
}
