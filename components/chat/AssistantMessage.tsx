import type { SearchSource } from "@/lib/types";
import { isGameContentKind, type QuestionKind } from "@/lib/agent/schemas";
import { parseCitations } from "@/lib/parse-citations";
import { MarkdownAnswer } from "./MarkdownAnswer";
import { SourcesFooter } from "./SourcesFooter";
import { UnsourcedNote } from "./UnsourcedNote";

interface Props {
  content: string;
  sources?: SearchSource[];
  kind?: QuestionKind;
}

export function AssistantMessage({ content, sources = [], kind }: Props) {
  const { text, citedIndices } = parseCitations(content);
  // Game-content kinds carry facts; flag when one answered without a source.
  const showUnsourcedNote =
    sources.length === 0 && kind != null && isGameContentKind(kind);
  return (
    <div className="flex flex-row items-start">
      <div className="max-w-[95%] sm:max-w-[92%]">
        <div
          className="border border-r border-b border-t border-l-[3px] px-3.5 py-2.5 text-[15px] leading-snug text-text-t2"
          style={{
            background: "var(--color-assistant-bg)",
            borderColor: "var(--color-assistant)",
            borderLeftColor: "var(--color-assistant)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          <MarkdownAnswer content={text} sources={sources} />
          <SourcesFooter sources={sources} citedIndices={citedIndices} />
        </div>
        {showUnsourcedNote && <UnsourcedNote />}
      </div>
    </div>
  );
}
