import type { CSSProperties } from "react";

// Carved-metalwork diamond corner rivet. Positioned absolutely at panel corners.
export function CornerDeco({ style }: { style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      style={{ position: "absolute", width: 20, height: 20, zIndex: 20, ...style }}
    >
      <svg viewBox="0 0 20 20" style={{ overflow: "visible" }}>
        <rect x="9" y="0" width="2" height="6" fill="var(--color-gold)" />
        <rect x="9" y="14" width="2" height="6" fill="var(--color-gold)" />
        <rect x="0" y="9" width="6" height="2" fill="var(--color-gold)" />
        <rect x="14" y="9" width="6" height="2" fill="var(--color-gold)" />
        <polygon points="10,4 16,10 10,16 4,10" fill="var(--color-gold)" />
        <polygon points="10,7 13,10 10,13 7,10" fill="var(--color-stone-s0)" />
        <rect x="9.5" y="9.5" width="1" height="1" fill="var(--color-gold-bright)" />
      </svg>
    </div>
  );
}
