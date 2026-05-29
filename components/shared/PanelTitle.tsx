import type { ReactNode } from "react";
import { stoneSurface } from "@/lib/surfaces";

// Panel header bar — Cinzel caps on a raised stone surface. The bottom
// border (single gold-b2 line) acts as the separator on its own; no extra
// ornamental Divider underneath, which previously doubled-up the rule.
export function PanelTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between border-b border-gold-b2 px-[18px] py-2.5"
      style={stoneSurface("recessed")}
    >
      <span
        className="font-ui text-[12px] uppercase text-text-t3"
        style={{ letterSpacing: "0.2em" }}
      >
        {children}
      </span>
      {right}
    </div>
  );
}
