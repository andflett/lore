// Title-case a string with small-words handling. Display only — never persist
// the result, so user-typed casing survives in storage and round-trips.
// Examples:
//   "diablo 2 resurrected" → "Diablo 2 Resurrected"
//   "the witcher 3"        → "The Witcher 3"   (first word always capitalised)
//   "tainted grail: fall of avalon" → "Tainted Grail: Fall of Avalon"
const SMALL_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "vs",
  "with",
]);

function capitalise(word: string): string {
  if (word.length === 0) return word;
  return word[0].toUpperCase() + word.slice(1);
}

export function titleCase(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed
    .split(/(\s+)/) // preserve whitespace runs
    .map((token, i) => {
      if (/^\s+$/.test(token)) return token;
      const lower = token.toLowerCase();
      // First word always capitalised; small words otherwise stay lowercase.
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      return capitalise(lower);
    })
    .join("");
}
