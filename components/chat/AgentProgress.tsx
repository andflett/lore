"use client";

import { motion } from "motion/react";
import type { AgentStep } from "@/hooks/useAgent";
import { GameIcon } from "@/components/shared/GameIcon";

const STEP_ICON: Record<string, string> = {
  decide: "crystal-ball",
  search: "magnifying-glass",
  assess: "scroll-unfurled",
  generate: "quill-ink",
};

interface Props {
  steps: AgentStep[];
  done?: boolean;
}

// Themed list of agent step messages, streamed while the answer is being prepared.
export function AgentProgress({ steps, done }: Props) {
  if (steps.length === 0) return null;
  return (
    <ul className="space-y-1.5 py-1 pl-1">
      {steps.map((s, i) => {
        const isCurrent = !done && i === steps.length - 1;
        return (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 text-[12px]"
          >
            <GameIcon
              name={STEP_ICON[s.step] ?? "scroll-unfurled"}
              size={12}
              className={isCurrent ? "text-gold-text" : "text-gold-b3"}
            />
            <span
              className={isCurrent ? "italic text-text-t1" : "text-text-dim"}
            >
              {s.message}
            </span>
            {isCurrent && (
              <span className="ml-1 inline-block h-2 w-2 animate-pulse bg-gold" />
            )}
          </motion.li>
        );
      })}
    </ul>
  );
}
