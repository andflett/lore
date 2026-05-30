// The playthrough name is just a sidebar label. We don't ask for it directly —
// it's derived from the character so onboarding and Settings stay in sync.
// Shared by NewPlaythroughFlow (create) and PlaythroughSettingsDrawer (edit).
export function derivePlaythroughName(
  characterName?: string,
  characterClass?: string,
): string {
  return characterName?.trim() || characterClass?.trim() || "Playthrough 1";
}
