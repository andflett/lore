"use client";

import { GameIcon } from "@/components/shared/GameIcon";
import { Btn } from "@/components/shared/Btn";
import { titleCase } from "@/lib/text";

interface Props {
  gameName: string;
  onPick: (text: string) => void;
}

// Starter prompts double as conversation primers — short, generic, work for
// any game. Tapping one inserts the text into the chat input as a draft so
// the player can edit before sending (we don't auto-send to avoid sending
// an incomplete sentence).
const STARTERS = [
  "Where do I find ",
  "How do I beat ",
  "What's a good build for ",
];

// Friendly anchor for a brand-new session. Centred icon, prompt in body size
// with title-cased game, and a small row of starter prompts the player can
// tap to seed the input.
export function EmptySessionState({ gameName, onPick }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
      <GameIcon name="crystal-ball" size={32} className="text-gold-text" />
      <p className="text-[15px] text-text-t1">
        Ask anything about{" "}
        <span className="text-text-t3">{titleCase(gameName)}</span>.
      </p>
      <ul className="flex flex-wrap justify-center gap-2">
        {STARTERS.map((s) => (
          <li key={s}>
            <Btn variant="dim" size="sm" onClick={() => onPick(s)}>
              {s}
            </Btn>
          </li>
        ))}
      </ul>
    </div>
  );
}
