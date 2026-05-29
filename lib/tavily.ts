interface TavilyResult {
  title: string;
  url: string;
  domain: string;
  content: string;
}

import type { Game } from "./types";

// Domains we trust by default. Per-game allowlists layer on top or replace
// these; see resolveEffectiveDomains().
export const DEFAULT_INCLUDE_DOMAINS = [
  "wiki.gg",
  "fextralife.com",
  "reddit.com",
];

// Compute the ordered list of domains to search for this game, plus the
// excludes to apply. The order of `include` is the priority order used by
// the post-search re-rank in searchTavily.
export function resolveEffectiveDomains(game: Game): {
  include: string[];
  exclude: string[];
} {
  const s = game.sources ?? {};
  const base = s.replaceDefaults
    ? (s.include ?? [])
    : [...DEFAULT_INCLUDE_DOMAINS, ...(s.include ?? [])];
  const exclude = s.exclude ?? [];
  // de-dupe, preserve order, drop any excluded entries.
  const seen = new Set<string>();
  const include: string[] = [];
  for (const d of base) {
    if (seen.has(d)) continue;
    if (exclude.includes(d)) continue;
    seen.add(d);
    include.push(d);
  }
  return { include, exclude };
}

export interface TavilyOptions {
  // Ordered list of domains the search is allowed to return. Order also
  // serves as priority for re-ranking results (earlier = higher).
  includeDomains?: string[];
  // Domains to filter out post-search (Tavily doesn't reliably honour
  // exclude_domains, so we filter client-side too as a safety net).
  excludeDomains?: string[];
  // Tavily's 'advanced' returns longer snippets; use for analytical
  // questions (build, boss). 'basic' is faster + cheaper for lookups.
  searchDepth?: "basic" | "advanced";
  maxResults?: number;
}

// Calls the Tavily search API, scoped to game wikis and community sites.
// Re-ranks results so higher-priority domains (earlier in includeDomains) appear first.
export async function searchTavily(
  query: string,
  opts: TavilyOptions = {},
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not set");

  const include = opts.includeDomains ?? DEFAULT_INCLUDE_DOMAINS;
  const exclude = opts.excludeDomains ?? [];

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      include_domains: include,
      exclude_domains: exclude,
      max_results: opts.maxResults ?? 5,
      search_depth: opts.searchDepth ?? "basic",
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily search failed: ${res.status}`);
  }

  const json = (await res.json()) as {
    results: { title: string; url: string; content: string }[];
  };

  const results: TavilyResult[] = json.results.map((r) => ({
    title: r.title,
    url: r.url,
    domain: new URL(r.url).hostname.replace(/^www\./, ""),
    content: r.content,
  }));

  // Defensive exclude (Tavily can leak excluded domains occasionally).
  const filtered = results.filter(
    (r) => !exclude.some((d) => r.domain.endsWith(d)),
  );

  // Re-rank by include-list order: a result whose domain matches an earlier
  // entry in `include` comes first. Domains not in the list go last (rare,
  // since include_domains usually filters them, but keep the path safe).
  const priorityOf = (domain: string) => {
    for (let i = 0; i < include.length; i++) {
      if (domain.endsWith(include[i])) return i;
    }
    return include.length;
  };
  filtered.sort((a, b) => priorityOf(a.domain) - priorityOf(b.domain));

  return filtered;
}
