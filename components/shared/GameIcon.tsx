interface Props {
  name: string;
  className?: string;
  size?: number;
}

// Renders a game-icons.net SVG (from public/icons) as a colourable CSS mask.
// Colour via Tailwind text-* classes, e.g. <GameIcon name="dragon" className="text-gold-text" />
export function GameIcon({ name, className, size = 20 }: Props) {
  return (
    <span
      aria-hidden
      className={`game-icon ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(/icons/${name}.svg)`,
        maskImage: `url(/icons/${name}.svg)`,
      }}
    />
  );
}
