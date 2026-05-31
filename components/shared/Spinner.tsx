"use client";

import { motion } from "motion/react";
import { stoneSurface } from "@/lib/surfaces";

// Arcane loading sigil: two counter-rotating gilded rings, each with a single
// brightened arc so the spin reads, around a pulsing gold core. The circular
// elements are an intentional exception to the otherwise hard-edged aesthetic.
function Sigil() {
  return (
    <div className="relative h-9 w-9" aria-hidden>
      <motion.span
        className="absolute inset-0 rounded-full border border-gold-b1 border-t-gold"
        style={{ boxShadow: "0 0 12px rgba(200,146,26,0.30)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2.6, ease: "linear", repeat: Infinity }}
      />
      <motion.span
        className="absolute inset-[5px] rounded-full border border-gold-b0 border-b-gold-b3"
        animate={{ rotate: -360 }}
        transition={{ duration: 3.4, ease: "linear", repeat: Infinity }}
      />
      <motion.span
        className="absolute inset-[15px] rounded-full bg-gold"
        animate={{ opacity: [0.35, 1, 0.35], scale: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
      />
    </div>
  );
}

// Full-screen centred loading state.
export function Spinner({ label }: { label?: string }) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-4"
      style={stoneSurface("mid")}
      role="status"
    >
      <Sigil />
      {label && (
        <motion.span
          className="font-ui text-[10px] uppercase text-text-t0"
          style={{ letterSpacing: "0.15em" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
}
