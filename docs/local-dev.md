# Local dev

Running and iterating on the app locally.

---

## Setup

```sh
npm install
cp .env.example .env.local   # then fill in keys
npm run dev                  # http://localhost:3000
```

### Required env keys (`.env.local`)

```
GROQ_API_KEY=gsk_...         # free, fast, used for dev iteration
ANTHROPIC_API_KEY=sk-ant-... # optional, used for production / Claude models
TAVILY_API_KEY=tvly_...      # web search; required for the search feature
```

Get them from:
- **Groq** — https://console.groq.com/keys (free tier; rate limits are
  generous for dev)
- **Anthropic** — https://console.anthropic.com (pay-as-you-go; **Claude Pro
  does not include API access**)
- **Tavily** — https://app.tavily.com (free tier)

If `ANTHROPIC_API_KEY` is missing, `lib/provider.ts` falls back to the
default Groq model — the app still works, just no Claude option in practice.

---

## Default model + switching

Default is `groq/llama-3.3-70b-versatile` (free, fast). The Memory panel
includes a model picker — pick one, it persists per-playthrough in Dexie.

Recommendation:
- **Dev iteration** → free Groq models (default).
- **Production / sharing the live app** → Claude Haiku 4.5 (best
  tool-following + citation behavior in this app).

See [decisions.md D1](./decisions.md) for why we don't use the Vercel Gateway.

---

## Useful URLs while running

- `/` — auto-redirects to the last playthrough or `/new`
- `/design` — dev-only kitchen sink: all colour tokens, fonts, components,
  buttons, icons, a sample message bubble with a citation. **Use this when
  iterating on visual changes** — it's the fastest feedback loop.
- `/new` — onboarding flow (creates game + playthrough)
- `/playthrough/[id]` — auto-resumes today's session
- `/playthrough/[id]/session/[sessionId]` — view a specific past session
  (read-only)

---

## Common dev tasks

### Add a new model

1. Add an entry to `MODELS` in [`lib/models.ts`](../lib/models.ts) with
   `id: "<provider>/<model-name>"`, label, provider, notes.
2. If it's a new provider (not Anthropic/Groq), add a case in
   `lib/provider.ts` and `npm install @ai-sdk/<provider>`.

### Add a new icon

The mask-based `GameIcon` expects a single-path SVG with no fill at
`public/icons/<name>.svg`. Either:
- Pull from game-icons.net via `scripts/download-icons.mjs` (strips the
  black background rect and explicit fills automatically).
- Hand-place an SVG manually.

Reference it with `<GameIcon name="..." />`. Colour it with Tailwind text
classes (`text-gold-text`, `text-text-t2`, etc.).

### Add a memory category

Add to `MEMORY_CATEGORIES` in [`lib/types.ts`](../lib/types.ts), then add the
icon mapping in [`components/memory/MemoryBlockRow.tsx`](../components/memory/MemoryBlockRow.tsx)
(`CATEGORY_ICON`). The agent's `MEMORY_PROPOSAL` block and the session-end
Zod enum derive from the same list — they update automatically.

### Wipe IndexedDB (start clean)

The IndexedDB is named `lorekeeper` (legacy working name, kept across the
Hearthnote/Wyrdscribe rebrands so existing local data survives). In the
browser console:
```js
indexedDB.deleteDatabase('lorekeeper'); location.reload();
```

Or selectively:
```js
const r = indexedDB.open('lorekeeper');
r.onsuccess = () => {
  const tx = r.result.transaction(['sessions','playthroughs','games'], 'readwrite');
  tx.objectStore('sessions').clear();
  // tx.objectStore('playthroughs').clear();
  // tx.objectStore('games').clear();
};
```

### Tweak the agent

- Search loop cap: `MAX_SEARCHES` in [`lib/agent/nodes.ts`](../lib/agent/nodes.ts).
- Decision logic: `decideNode` + `decisionSchema`.
- Generate behavior: `streamAnswer` in
  [`lib/agent/generate.ts`](../lib/agent/generate.ts) (provider options,
  prompt selection, context shape).
- Stream events: see `AgentEvent` in
  [`lib/agent/events.ts`](../lib/agent/events.ts) and the consumer in
  [`hooks/useAgent.ts`](../hooks/useAgent.ts).

### Tweak markdown rendering

[`components/chat/MarkdownAnswer.tsx`](../components/chat/MarkdownAnswer.tsx)
has component overrides for every markdown element. Citation handling is in
`linkify()` (recurses through children — works inside any element).

---

## Build + verify

```sh
npx tsc --noEmit      # typecheck
npm run lint          # eslint
npm run build         # production build (catches RSC boundary issues)
```

CI/deploy isn't wired up yet — when it is, these are the gates.

---

## Visual review checklist

A 5-minute pass before merging any visual change. Open the dev server at
mobile width (~390px) and walk through:

- [ ] **`/design`** — all primitives render and look on-brand
  (TextField, TextAreaField, SelectField, CheckField, RadioField, Pill,
  SortableListRow, Btn variants, GameIcon grid, MessageBubble samples).
  No primitive is missing, none look broken.
- [ ] **`/new`** — onboarding panel reads against the page bg; field
  primitives behave; suggestions render on the game step.
- [ ] **Active playthrough — empty session** — `EmptySessionState`
  centred with crystal-ball icon, title-cased game name, starter chips
  visible.
- [ ] **Active playthrough — with chat** — both bubble types render
  (user gold-pip + right accent, assistant muted-pip + left accent);
  citation `[n]` is clickable; sources footer expands; markdown
  headings stay small/inline.
- [ ] **Memory drawer** — open, ModelPicker dropdown, add a block,
  edit, remove. No texture inside body.
- [ ] **Settings drawer** — open, change a field (auto-save on blur),
  reorder a source (`↴`, `↵`, drag), add a domain, see `(default)`
  pills on default rows, `Top priority` label on first row.
- [ ] **Delete confirmation modal** — opens via Settings danger zone,
  shows live session count, cancel works.
- [ ] **Tooltips** — hover any header IconButton; tooltip is solid
  (no texture), no arrow, no clipping (right-cluster aligns to trigger
  end).
- [ ] **Sidebar (mobile drawer)** — opens with close button, shows
  playthrough list with title-cased game names.

Catches everything in the tightening backlog and most regressions on
new visual work.
