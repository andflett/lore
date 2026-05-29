"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { ProposedMemoryUpdate } from "@/lib/types";
import { Panel } from "@/components/shared/Panel";
import { Btn } from "@/components/shared/Btn";
import { GameIcon } from "@/components/shared/GameIcon";

interface Props {
  proposal: ProposedMemoryUpdate;
  onAccept: (proposal: ProposedMemoryUpdate) => void;
  onDismiss: () => void;
}

// Inline, dismissible card surfacing an AI memory proposal during chat.
export function MemoryProposalToast({ proposal, onAccept, onDismiss }: Props) {
  const [content, setContent] = useState(proposal.content);

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-30 w-[min(360px,calc(100vw-2rem))]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.18 }}
    >
      <Panel style={{ padding: 14 }}>
        <div className="mb-2 flex items-center gap-1.5 text-gold-text">
          <GameIcon name="light-bulb" size={14} />
          <span
            className="font-ui text-[9px] uppercase"
            style={{ letterSpacing: "0.14em" }}
          >
            Remember this? · {proposal.category}
          </span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="mb-3 w-full resize-none border border-gold-b2 bg-stone-s0 px-2 py-1 text-[14px] text-text-t2 outline-none focus:border-gold"
        />
        <div className="flex gap-2">
          <Btn
            variant="confirm"
            size="sm"
            onClick={() => onAccept({ ...proposal, content: content.trim() })}
          >
            <GameIcon name="check-mark" size={12} /> Save
          </Btn>
          <Btn variant="dim" size="sm" onClick={onDismiss}>
            <GameIcon name="cancel" size={12} /> Dismiss
          </Btn>
        </div>
      </Panel>
    </motion.div>
  );
}
