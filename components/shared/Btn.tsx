"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { COLORS as C } from "@/lib/tokens";

type Variant = "metal" | "confirm" | "dim" | "danger" | "default";
type Size = "sm" | "md" | "lg";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  ariaLabel?: string;
  style?: CSSProperties; // layout-only overrides (margin, maxWidth, etc.)
}

const VARIANTS: Record<Variant, { bg: string; border: string; borderB: string; shadow: string; color: string }> = {
  metal: {
    bg: "linear-gradient(180deg, #332e24 0%, #201c14 60%, #2a2419 100%)",
    border: `1px solid ${C.b3}`,
    borderB: `1px solid ${C.b2}`,
    shadow: `inset 0 1px 0 rgba(230,190,90,0.28), inset 0 -1px 0 rgba(0,0,0,0.6), inset 1px 0 0 rgba(200,160,60,0.08), 0 0 0 1px rgba(0,0,0,0.5)`,
    color: C.t2,
  },
  confirm: {
    bg: `linear-gradient(180deg, ${C.s3} 0%, ${C.s1} 100%)`,
    border: `2px solid ${C.b5}`,
    borderB: `3px solid ${C.b4}`,
    shadow: `inset 0 1px 0 rgba(240,216,144,0.2), 0 0 0 1px ${C.b1}, 0 0 8px rgba(200,146,26,0.2), 0 3px 10px rgba(0,0,0,0.7)`,
    color: C.b6,
  },
  dim: {
    bg: `linear-gradient(180deg, ${C.s1} 0%, ${C.s0} 100%)`,
    border: `2px solid ${C.b2}`,
    borderB: `3px solid ${C.b1}`,
    shadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px ${C.b0}, 0 2px 6px rgba(0,0,0,0.6)`,
    color: C.t0,
  },
  danger: {
    bg: `linear-gradient(180deg, ${C.red0} 0%, #200808 100%)`,
    border: `2px solid ${C.red2}`,
    borderB: `3px solid ${C.red3}`,
    shadow: `inset 0 1px 0 rgba(226,85,85,0.18), 0 0 0 1px ${C.b0}, 0 3px 10px rgba(0,0,0,0.7)`,
    color: C.redText,
  },
  default: {
    bg: `linear-gradient(180deg, ${C.s2} 0%, ${C.s0} 100%)`,
    border: `2px solid ${C.b4}`,
    borderB: `3px solid ${C.b3}`,
    shadow: `inset 0 1px 0 rgba(240,200,100,0.15), inset 0 -1px 0 rgba(0,0,0,0.5), 0 0 0 1px ${C.b1}, 0 3px 10px rgba(0,0,0,0.7)`,
    color: C.t3,
  },
};

const SIZES: Record<Size, { height: number; padding: string; fontSize: number; letterSpacing: string; gap: number }> = {
  sm: { height: 30, padding: "0 12px", fontSize: 8, letterSpacing: "0.12em", gap: 6 },
  md: { height: 36, padding: "0 18px", fontSize: 10, letterSpacing: "0.15em", gap: 8 },
  lg: { height: 44, padding: "0 24px", fontSize: 11, letterSpacing: "0.15em", gap: 9 },
};

export function Btn({
  children,
  onClick,
  variant = "default",
  size = "md",
  icon = false,
  fullWidth = false,
  type = "button",
  disabled = false,
  ariaLabel,
  style,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const h = s.height;
  const w = fullWidth ? "100%" : icon ? h : "auto";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        background: v.bg,
        border: v.border,
        borderBottom: pressed ? v.border : v.borderB,
        boxShadow: v.shadow,
        color: v.color,
        fontFamily: "var(--font-ui)",
        fontSize: s.fontSize,
        letterSpacing: s.letterSpacing,
        textTransform: "uppercase",
        height: h,
        width: w,
        minWidth: w,
        padding: icon ? 0 : s.padding,
        gap: s.gap,
        boxSizing: "border-box",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        flexGrow: 0,
        alignSelf: "center",
        transform: pressed ? "translateY(1px)" : "none",
        transition: "transform 0.08s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
