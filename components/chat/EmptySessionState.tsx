"use client";

import { titleCase } from "@/lib/text";

interface Props {
  gameName: string;
}

export function EmptySessionState({ gameName }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <p className="text-[15px] text-text-t2">
        Ask anything about your{" "}
        <span className="text-text-t3">{titleCase(gameName)}</span>{" "}
        playthrough.
      </p>
    </div>
  );
}
