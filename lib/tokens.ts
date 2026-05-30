// Single source of truth for palette values used in JS-side inline styles
// (gradients, box-shadows) that can't be expressed with Tailwind classes.
// Keep in sync with the @theme block in app/globals.css.
export const COLORS = {
  void: "#080807",
  void0: "#090807",
  s0: "#0f0e0c",
  s1: "#161410",
  s2: "#1e1c18",
  s3: "#272420",
  b0: "#1c1408",
  b1: "#342408",
  b2: "#5e3c0c",
  b3: "#8c6010",
  b4: "#c8921a", // gold
  b5: "#dca830", // gold bright
  b6: "#f0d070", // gold text
  tDim: "#706c64",
  t0: "#948e84",
  t1: "#bab6aa",
  t2: "#d8d4c8",
  t3: "#eeeae0",
  assistant: "#4a3418",
  red0: "#3c0a0a",
  red1: "#7a1c1c",
  red2: "#b83030",
  red3: "#e25555", // blood bright
  redText: "#f5b0b0", // blood text — high contrast for danger labels
  grn1: "#2a5020",
} as const;
