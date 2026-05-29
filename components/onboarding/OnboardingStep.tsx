import type { ReactNode } from "react";
import { motion } from "motion/react";

interface Props {
  title: string;
  hint?: string;
  children: ReactNode;
}

// One question per screen, fading in on mount.
export function OnboardingStep({ title, hint, children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      <h2
        className="font-ui text-[14px] uppercase text-text-t3"
        style={{ letterSpacing: "0.16em" }}
      >
        {title}
      </h2>
      {hint && <p className="text-[14px] text-text-t0">{hint}</p>}
      {children}
    </motion.div>
  );
}
