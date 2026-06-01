"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { NOISE_TEX } from "@/lib/surfaces";
import { PanelTitle } from "./PanelTitle";
import { IconButton } from "./IconButton";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

// Right-side slide-over. Shares the overlay vibe with Modal/Panel (black
// gradient + subtle noise, gold border) but skips corner rivets — they'd
// land off-screen on an edge-attached sheet.
export function Drawer({ open, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-y-0 right-0 z-50 flex w-[min(420px,100vw)] flex-col border-l-1 border-gold-b2"
            style={{
              background: `${NOISE_TEX} repeat, linear-gradient(180deg, var(--color-stone-s1) 0%, var(--color-stone-s0) 100%)`,
              backgroundSize: "256px 256px, 100% 100%",
              boxShadow:
                "inset 0 0 80px rgba(0,0,0,0.5), -8px 0 24px rgba(0,0,0,0.7)",
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.18 }}
          >
            <PanelTitle
              right={
                <IconButton radixIcon={Cross2Icon} label="Close" size="sm" onClick={onClose} />
              }
            >
              {title}
            </PanelTitle>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
