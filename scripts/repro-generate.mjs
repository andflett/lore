// Reproduce the route's generate call as closely as possible to find what kills text output.
import { config } from "dotenv";
config({ path: ".env.local" });
import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

// Pull two Tavily results (mirror what the agent retrieves).
async function tavily(q) {
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query: q,
      include_domains: ["wiki.gg", "fextralife.com", "reddit.com"],
      max_results: 5,
    }),
  });
  const j = await r.json();
  return j.results;
}

const game = "Tainted Grail: Fall of Avalon";
const query = "Where do I find the Lost Knight quest?";

const results = await tavily(`${game} Lost Knight quest location`);
const r2 = await tavily(`${game} Lost Knight side quest details`);
const all = [...results, ...r2];

const context = all
  .map(
    (r, i) =>
      `[${i + 1}] ${r.title} (${r.url})\n${r.content}`,
  )
  .join("\n\n---\n\n");

const system = `You are a knowledgeable gaming companion helping with a specific playthrough.

GAME: ${game}

PLAYTHROUGH: Run 1
PREFERENCES: Playing blind, prefer stealth

PLAYTHROUGH MEMORY:
Nothing recorded yet.

---

INSTRUCTIONS:
- Answer questions about this game concisely and practically.
- Use the search tool when the question requires specific game knowledge — quest steps, enemy weaknesses, item locations, lore details.
- Search at most once or twice, then STOP searching and write your answer using the results. Do not keep searching repeatedly.
- Prefer results from game wikis (Fextralife, wiki.gg, the game's own wiki) over generic gaming sites.

CITATIONS (mandatory when search results are used):
- Every factual claim derived from a search result MUST be followed by its citation number in brackets, e.g. "The Dying Knight is found in the Ossuary [1]."
- Cite the most specific source available.
- If multiple sources confirm the same claim, cite all of them: [1][2].
- Do not invent citation numbers. Only cite sources returned by the search tool in this conversation.
- If you answer from training knowledge without searching, say so: "(from training data — verify with a wiki if critical)".

SPOILERS:
- Do not volunteer spoilers beyond what the question requires.

MEMORY PROPOSALS:
If this conversation reveals something worth remembering, append:

[MEMORY_PROPOSAL category="quest|choice|character|location|note"]
One clear sentence describing the fact to remember.
[/MEMORY_PROPOSAL]
`;

const user = `${query}\n\nSearch results to cite with [n]:\n${context}`;

console.log("system chars:", system.length, "user chars:", user.length, "results:", all.length);

const r = streamText({
  model: groq("openai/gpt-oss-120b"),
  system,
  messages: [{ role: "user", content: user }],
  providerOptions: {
    groq: { reasoningFormat: "parsed", reasoningEffort: "low" },
  },
});

let text = "",
  reasoning = "",
  errs = [];
for await (const p of r.fullStream) {
  if (p.type === "text-delta") text += p.text;
  if (p.type === "reasoning-delta") reasoning += p.text;
  if (p.type === "error") errs.push(JSON.stringify(p.error).slice(0, 200));
}
console.log("text chars:", text.length, "reasoning chars:", reasoning.length, "errs:", errs);
console.log("TEXT:\n" + text.slice(0, 800));
console.log("\nREASONING (first 200):\n" + reasoning.slice(0, 200));
