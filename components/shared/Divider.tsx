// Ornamental horizontal rule with a centred diamond.
export function Divider({ color = "var(--color-gold-b2)" }: { color?: string }) {
  return (
    <div className="flex items-center gap-2 px-0.5">
      <div
        className="h-px flex-1"
        style={{ background: `linear-gradient(90deg, transparent, ${color})` }}
      />
      <svg width="8" height="8" viewBox="0 0 8 8" fill={color}>
        <polygon points="4,0 8,4 4,8 0,4" />
      </svg>
      <div
        className="h-px flex-1"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
    </div>
  );
}
