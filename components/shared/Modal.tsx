"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Panel } from "./Panel";
import { PanelTitle } from "./PanelTitle";
import { IconButton } from "./IconButton";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-[min(520px,100%)]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            <Panel>
              <PanelTitle
                right={
                  <IconButton radixIcon={Cross2Icon} label="Close" size="sm" onClick={onClose} />
                }
              >
                {title}
              </PanelTitle>
              <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
            </Panel>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
