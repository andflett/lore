import { GameIcon } from "@/components/shared/GameIcon";

// Small dim badge shown beneath a game-content assistant answer that came
// back without any wiki sources. Mirrors the SourcesFooter's caps-label
// treatment so the two read as opposites of the same affordance.
export function UnsourcedNote() {
  return (
    <div className="mt-1.5 flex items-center gap-1.5 px-1">
      <GameIcon name="crystal-ball" size={11} className="text-text-dim" />
      <span
        className="font-ui text-[9px] uppercase text-text-dim"
        style={{ letterSpacing: "0.14em" }}
      >
        Answered without sources
      </span>
    </div>
  );
}
