import type { CSSProperties } from "react";

const STONE_URL = "url('/textures/rough-stone.jpg')";

export type Elevation = "raised" | "mid" | "recessed" | "deep";

const OVERLAYS: Record<Elevation, string> = {
  raised: "rgba(255,250,238,0.13), rgba(0,0,0,0.12)",
  mid: "rgba(0,0,0,0.14), rgba(0,0,0,0.26)",
  recessed: "rgba(0,0,0,0.38), rgba(0,0,0,0.50)",
  deep: "rgba(0,0,0,0.52), rgba(0,0,0,0.66)",
};

export function stoneSurface(elevation: Elevation = "mid"): CSSProperties {
  return {
    backgroundImage: `linear-gradient(180deg, ${OVERLAYS[elevation]}), ${STONE_URL}`,
    backgroundSize: "cover, 128px 128px",
    backgroundRepeat: "no-repeat, repeat",
  };
}

// Fine SVG turbulence grain for small content surfaces (message bubbles, source rows).
export const NOISE_TEX =
  "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' seed='9' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.07 0 0 0 0 0.05 0 0 0 0 0.02 0 0 0 0.18 0'/></filter><rect width='512' height='512' filter='url(%23n)'/></svg>\")";
