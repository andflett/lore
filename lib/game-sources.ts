// Static suggestions: well-known games → extra wiki domains worth searching.
// Used by the Settings drawer to offer a one-click "add suggested sources"
// for the current game. Match is case-insensitive substring on game name.
//
// Order within each array is the suggested priority (best wiki first).
// Extend over time — keep entries lowercase.
export const KNOWN_GAME_SOURCES: Record<string, string[]> = {
  "tainted grail": ["taintedgrail.wiki.gg"],
  "elden ring": ["eldenring.wiki.fextralife.com", "eldenring.wiki.gg"],
  "baldur's gate 3": ["bg3.wiki", "baldursgate3.wiki.fextralife.com"],
  "baldurs gate 3": ["bg3.wiki", "baldursgate3.wiki.fextralife.com"],
  skyrim: ["en.uesp.net", "elderscrolls.fandom.com"],
  starfield: ["starfieldwiki.net", "en.uesp.net"],
  "cyberpunk 2077": ["cyberpunk.fandom.com"],
  "the witcher 3": ["witcher.fandom.com"],
  "dark souls": ["darksouls3.wiki.fextralife.com", "darksouls.wiki.fextralife.com"],
  "dragon's dogma": ["dragonsdogma.wiki.fextralife.com"],
  "monster hunter": ["monsterhunter.fandom.com", "mhrise.kiranico.com"],
  divinity: ["divinityoriginalsin2.wiki.fextralife.com"],
  "kingdom come": ["kingdomcomedeliverance.wiki.fextralife.com"],
};

// Return suggestions for a game name, matched by case-insensitive substring.
// Earliest matching key wins.
export function suggestedSourcesFor(gameName: string): string[] {
  const lower = gameName.toLowerCase();
  for (const [key, domains] of Object.entries(KNOWN_GAME_SOURCES)) {
    if (lower.includes(key)) return domains;
  }
  return [];
}
