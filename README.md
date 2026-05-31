# Wyrdscribe

**Your RPG Companion** — an AI chat companion that searches the wikis you trust, remembers your playthrough, and answers without spoiling what you haven't seen yet.

All data lives in your browser (IndexedDB). No account, no cloud sync, no telemetry.

**Try it:** [wyrdscribe.app](https://wyrdscribe.app) — no sign-up. The free demo is rate-limited; [bring your own key](#bring-your-own-key-byok) or [self-host](#self-hosting) for unlimited use.

---

## Features

- **Playthrough memory** — set your character, difficulty, and playstyle once; every answer is shaped by that context
- **Wiki search with citations** — searches sources you configure (game wikis, etc.) via Tavily; every answer links to what it found
- **Spoiler-aware** — tell it you're playing blind and it won't reveal story content
- **Session summaries** — end a session and get an AI-generated summary with proposed memory updates to keep for next time
- **Multiple playthroughs** — separate runs, separate memory, separate history
- **Local-first** — IndexedDB, no backend persistence; data never leaves the device
- **Bring your own key** — use the free shared demo, or add your own Anthropic/Tavily keys for Claude-quality answers and no limits

## Bring your own key (BYOK)

The free hosted demo runs on a shared free tier (Groq + limited wiki search) and is rate-limited. To remove the limits **and** unlock Claude (higher-quality answers and citations), add your own keys — no account needed:

1. Open **Settings** — the lantern icon, top-right.
2. Paste either or both:
   - **Anthropic** — enables Claude (Haiku / Sonnet) + prompt caching. [Get a key](https://console.anthropic.com) (pay-as-you-go; Claude Pro does **not** include API access).
   - **Tavily** — runs wiki search on your own quota. [Get a key](https://app.tavily.com) (free tier available).

That's it — your next message uses them. Pick the model per playthrough with the model switcher in the chat box.

**Where your keys live:** only in this browser (`localStorage`). They're sent to the server *solely* to make your own requests and are never logged or stored server-side. Groq stays on the host's key (it's the free default) — only Anthropic and Tavily are yours to override. Want total control? [Self-host](#self-hosting) — then everything runs on your own deployment.

## Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [LangGraph](https://langchain-ai.github.io/langgraphjs/) — multi-step agent (decide → search → ground → generate)
- [Vercel AI SDK](https://sdk.vercel.ai) — model abstraction + streaming
- [Dexie](https://dexie.org) — IndexedDB wrapper for local persistence
- [Tavily](https://tavily.com) — web/wiki search
- Groq and Anthropic as model providers (configurable per playthrough)

## Self-hosting

You run it on your own keys — your data, your costs, no limits.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fandflett%2Flore&env=GROQ_API_KEY,TAVILY_API_KEY,ANTHROPIC_API_KEY&envDescription=GROQ%20%2B%20TAVILY%20required%3B%20ANTHROPIC%20optional&envLink=https%3A%2F%2Fgithub.com%2Fandflett%2Flore%23environment-variables)

Or locally:

```sh
git clone https://github.com/andflett/lore.git
cd lore
npm install
cp .env.example .env.local   # fill in your keys
npm run dev                  # http://localhost:3000
```

### Environment variables

```
GROQ_API_KEY=gsk_...         # free tier at console.groq.com — required
ANTHROPIC_API_KEY=sk-ant-... # optional; falls back to Groq if absent
TAVILY_API_KEY=tvly_...      # web search; required for wiki lookups
```

- **Groq** — [console.groq.com/keys](https://console.groq.com/keys) — free tier, generous rate limits
- **Anthropic** — [console.anthropic.com](https://console.anthropic.com) — pay-as-you-go (Claude Pro does not include API access)
- **Tavily** — [app.tavily.com](https://app.tavily.com) — free tier available

If `ANTHROPIC_API_KEY` is missing the app falls back to the default Groq model and remains fully functional.

A self-hosted instance is **unlimited by default** — the rate limits only apply if you opt in. If you're putting up your *own* public demo and want to cap what visitors spend on your keys, set the optional `UPSTASH_*` / `DEMO_DAILY_*` variables (see [`.env.example`](.env.example)); visitors who bring their own key always bypass the cap.

## Development

```sh
npm run dev      # dev server with hot reload
npm run build    # production build
npm run lint     # ESLint
npx tsc --noEmit # type check
```

See [`docs/local-dev.md`](docs/local-dev.md) for more: adding models, adding icons, tweaking the agent, wiping local data.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for a full breakdown of the folder layout, data model, LangGraph agent flow, and chat stream protocol.

## License

[PolyForm Noncommercial License 1.0.0](LICENSE) — free to use, modify, and self-host for personal and non-commercial purposes. Commercial use requires a separate agreement.
