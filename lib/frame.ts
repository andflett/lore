import { COLORS as C } from "./tokens";

// Multi-layer box-shadow that produces the gilded gold panel border.
export function frameShadow(active = false): string {
  return [
    "inset 0 1px 0 rgba(240,216,144,0.08)",
    `inset 0 0 0 1px ${active ? C.b2 : C.b1}`,
    "inset 0 0 50px rgba(0,0,0,0.55)",
    `0 0 0 1px ${C.void0}`,
    `0 0 0 4px ${active ? C.b2 : C.b1}`,
    `0 0 0 6px ${active ? C.b4 : C.b3}`,
    `0 0 0 7px ${C.b0}`,
    "0 0 12px rgba(200,146,26,0.22)",
    "0 0 28px rgba(200,146,26,0.10)",
    "0 12px 40px rgba(0,0,0,0.95)",
  ].join(", ");
}
