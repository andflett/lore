"use client";

import type { ReactNode } from "react";
import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip";

interface Props {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  // 'center' (default) centres the tooltip on the trigger. 'end' aligns it
  // to the trigger's trailing edge — useful for right-cluster buttons so
  // the tooltip extends inward instead of being centred (and clipped) at
  // the page edge.
  align?: "start" | "center" | "end";
}

// Simplified-ornate tooltip: solid black surface with a thin gold border and
// a subtle inset highlight. Matches the overlay family (Drawer / Modal /
// Tooltip) without the heavy multi-layer frame those use. No texture, no
// arrow — tooltips need to read instantly.
export function Tooltip({ label, children, side = "bottom", align = "center" }: Props) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger
        render={(props) => <span {...props}>{children}</span>}
      />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} align={align} sideOffset={6}>
          <BaseTooltip.Popup
            className="font-ui z-50 border border-gold-b3 bg-stone-s0 px-2 py-1 text-[9px] uppercase text-gold-text"
            style={{
              letterSpacing: "0.12em",
              boxShadow:
                "inset 0 0 0 1px var(--color-gold-b1), 0 2px 12px rgba(0,0,0,0.75)",
            }}
          >
            {label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
