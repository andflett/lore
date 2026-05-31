"use client";

import { titleCase } from "@/lib/text";

interface Props {
  gameName: string;
}

export function EmptySessionState({ gameName }: Props) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 text-center">
      <h2 className="font-ui text-3xl leading-[1.1] text-text-t3 sm:text-[2.75rem]">
        Ask anything
      </h2>
      <p className="font-body text-lg italic text-text-t1 sm:text-xl">
        about your{" "}
        <span className="text-gold-text not-italic">{titleCase(gameName)}</span>{" "}
        playthrough
      </p>
    </div>
  );
}
