import type { CSSProperties, ReactNode } from "react";
import { frameShadow } from "@/lib/frame";
import { NOISE_TEX } from "@/lib/surfaces";
import { CornerDeco } from "./CornerDeco";

interface Props {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  active?: boolean;
  flat?: boolean;
}

// Core surface: ornate gilded border, stone texture, four corner rivets.
export function Panel({ children, style, className, active = false, flat = false }: Props) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        border: `2px solid ${active ? "var(--color-gold-bright)" : "var(--color-gold)"}`,
        boxShadow: frameShadow(active),
        background: flat
          ? "transparent"
          : `${NOISE_TEX} repeat, linear-gradient(180deg, var(--color-stone-s1) 0%, var(--color-stone-s0) 100%)`,
        backgroundSize: "256px 256px, 100% 100%",
        ...style,
      }}
    >
      <CornerDeco style={{ top: -10, left: -10 }} />
      <CornerDeco style={{ top: -10, right: -10 }} />
      <CornerDeco style={{ bottom: -10, left: -10 }} />
      <CornerDeco style={{ bottom: -10, right: -10 }} />
      {children}
    </div>
  );
}
