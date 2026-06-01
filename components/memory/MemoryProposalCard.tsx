"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CheckIcon } from "@radix-ui/react-icons";
import type { ProposedMemoryUpdate } from "@/lib/types";
import { Btn } from "@/components/shared/Btn";
import { GameIcon } from "@/components/shared/GameIcon";
import { TextAreaField } from "@/components/shared/TextAreaField";

interface Props {
  proposal: ProposedMemoryUpdate;
  onAccept: (proposal: ProposedMemoryUpdate) => void;
  onDismiss: () => void;
}

// AI memory suggestion shown inline in the message list, beneath the answer
// that prompted it. Deliberately quiet — a plain bordered note, not the gilded
// Panel — so it reads as an aside rather than a popup demanding attention.
export function MemoryProposalCard({ proposal, onAccept, onDismiss }: Props) {
  const [content, setContent] = useState(proposal.content);

  return (
    <motion.div
      className="border border-gold-b1 bg-stone-s0 px-3 py-2.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="mb-2 flex items-center gap-1.5 text-text-dim">
        <GameIcon name="light-bulb" size={13} />
        <span
          className="font-ui text-[9px] uppercase"
          style={{ letterSpacing: "0.14em" }}
        >
          Remember this? · {proposal.category}
        </span>
      </div>
      <TextAreaField
        value={content}
        onChange={setContent}
        rows={2}
        ariaLabel="Suggested memory"
      />
      <div className="mt-2 flex gap-2">
        <Btn
          variant="confirm"
          size="sm"
          onClick={() => onAccept({ ...proposal, content: content.trim() })}
        >
          <CheckIcon className="h-3.5 w-3.5" /> Save
        </Btn>
        <Btn variant="dim" size="sm" onClick={onDismiss}>
          Dismiss
        </Btn>
      </div>
    </motion.div>
  );
}
