import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  // 'gold' is the default; 'blood' for danger-zone-style sections.
  tone?: "gold" | "blood";
}

// Small caps label used to head sections inside drawers, modals, and
// memory panels. Tightens the head-to-content gap from 6px to 8px so
// content doesn't feel glued to the heading. Always Cinzel.
export function SectionLabel({ children, tone = "gold" }: Props) {
  return (
    <h3
      className={`font-ui mb-2 text-[9px] uppercase ${
        tone === "blood" ? "text-blood-text" : "text-gold-text"
      }`}
      style={{ letterSpacing: "0.14em" }}
    >
      {children}
    </h3>
  );
}
