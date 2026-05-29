import type { MemoryCategory, ProposedMemoryUpdate } from "./types";
import { MEMORY_CATEGORIES } from "./types";

const PROPOSAL_PATTERN =
  /\[MEMORY_PROPOSAL\s+category="([^"]+)"\]\s*([\s\S]*?)\s*\[\/MEMORY_PROPOSAL\]/g;

function isCategory(value: string): value is MemoryCategory {
  return (MEMORY_CATEGORIES as string[]).includes(value);
}

// Extracts [MEMORY_PROPOSAL] blocks and returns the text with those blocks removed.
export function parseProposals(content: string): {
  text: string;
  proposals: ProposedMemoryUpdate[];
} {
  const proposals: ProposedMemoryUpdate[] = [];
  let match: RegExpExecArray | null;

  PROPOSAL_PATTERN.lastIndex = 0;
  while ((match = PROPOSAL_PATTERN.exec(content)) !== null) {
    const category = match[1].trim();
    const text = match[2].trim();
    if (text && isCategory(category)) {
      proposals.push({ category, content: text });
    }
  }

  const text = content.replace(PROPOSAL_PATTERN, "").trim();
  return { text, proposals };
}
