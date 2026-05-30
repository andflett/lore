import { ICON_PATHS, type IconName } from "@/lib/icon-paths";

interface Props {
  name: IconName;
  className?: string;
  size?: number;
}

// Renders a game-icons.net glyph as an inline <svg> filled with currentColor,
// so colour comes from Tailwind text-* classes:
//   <GameIcon name="dragon" className="text-gold-text" />
//
// Path data lives in lib/icon-paths.ts and ships in the JS bundle — no
// per-icon network request and no late-discovered mask-image fetch, so icons
// paint with the rest of the UI instead of popping in after layout.
export function GameIcon({ name, className, size = 20 }: Props) {
  const d = ICON_PATHS[name];
  if (!d) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`GameIcon: unknown icon "${name}"`);
    }
    return null;
  }
  return (
    <svg
      aria-hidden
      className={className}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="currentColor"
    >
      <path d={d} />
    </svg>
  );
}
