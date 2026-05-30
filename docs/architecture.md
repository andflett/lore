# Hearthnote — Architecture

A local-first gaming companion. Per-playthrough memory persists in IndexedDB;
chat is a LangGraph agent that searches the web (Tavily) and answers with
citations. No backend database — everything lives in the browser, served by a
single Next.js app with API routes for AI/Tavily calls (so keys stay off the
client).

---

## Stack

- **Next.js 16** (App Router, Turbopack), TypeScript strict, **Tailwind v4**
  (CSS-first `@theme` in [`app/globals.css`](../app/globals.css))
- **Dexie.js** (IndexedDB) — single source of truth for games / playthroughs /
  sessions; all writes go through helpers in [`lib/db.ts`](../lib/db.ts)
- **Vercel AI SDK v6** (`ai`) — provider-agnostic interface (`streamText`,
  `generateObject`). We call providers **directly** via `@ai-sdk/anthropic` and
  `@ai-sdk/groq` — no Vercel AI Gateway. See [decisions.md](./decisions.md).
- **LangGraph** (`@langchain/langgraph`) — orchestrates the chat agent
  (`decide → search → assess → [loop] → generate`). The model never emits tool
  calls; our code drives retrieval. This is what makes free Groq models
  reliable here. See [decisions.md](./decisions.md).
- **Tavily** — web search API, scoped to game wikis (wiki.gg, fextralife.com)
  and Reddit. Helper in [`lib/tavily.ts`](../lib/tavily.ts).
- **BaseUI** (`@base-ui-components/react`) — used for `Tooltip` (themed wrapper
  in [`components/shared/Tooltip.tsx`](../components/shared/Tooltip.tsx)). Most
  other UI is custom.
- **Motion** (`motion/react`) — small animations on panels, toasts, sidebar.
- **react-markdown** + **remark-gfm** — assistant answers render markdown
  tuned for chat-reply tone (not document layout). See
  [`components/chat/MarkdownAnswer.tsx`](../components/chat/MarkdownAnswer.tsx).

---

## Folder layout

```
app/
  layout.tsx                 # root layout: fonts + Providers (BaseUI tooltip)
  page.tsx                   # client: redirect to last playthrough or /new
  new/page.tsx               # onboarding entry
  design/page.tsx            # dev-only kitchen sink (/design)
  api/
    chat/route.ts            # SSE stream from the agent; consumes useAgent body
    session-end/route.ts     # generateObject → summary + memory proposals
  playthrough/[id]/page.tsx
  playthrough/[id]/session/[sessionId]/page.tsx

components/
  shared/                    # Btn, Panel, PanelTitle, Divider, CornerDeco,
                             # GameIcon, IconButton, Tooltip, Drawer, Modal,
                             # Spinner, Providers
  shell/AppShell.tsx         # header + sidebar (drawer on mobile) + main
  sidebar/                   # Sidebar, PlaythroughItem, SessionList
  onboarding/                # NewPlaythroughFlow, OnboardingStep
  chat/                      # SessionView (root), ChatInput,
                             # MessageBubble → User/AssistantMessage,
                             # MarkdownAnswer, SourcesFooter, AgentProgress
  memory/                    # MemoryPanel (drawer), MemoryBlockRow,
                             # ModelPicker, MemoryProposalToast
  session-end/               # SessionEndReview (modal)
  playthrough/               # PlaythroughClient (orchestrator)

hooks/
  useAgent.ts                # SSE consumer for /api/chat

lib/
  types.ts                   # all interfaces (Game, Playthrough, Session, etc.)
  db.ts                      # Dexie + helper functions (the ONLY write path)
  storage.ts                 # localStorage keys (lastPlaythroughId)
  models.ts                  # MODELS registry + DEFAULT_MODEL
  provider.ts                # id ("provider/model") → LanguageModel; key fallback
  tokens.ts                  # JS-side palette mirror of @theme (for inline styles)
  surfaces.ts                # stoneSurface(elevation) backgroundImage helper
  frame.ts                   # frameShadow(active) gilded panel border
  tavily.ts                  # Tavily search helper
  build-system-prompt.ts     # legacy system prompt (kept for reference)
  build-answer-prompt.ts     # generate-step system prompt (no tool mentions)
  build-session-end-prompt.ts
  parse-citations.ts         # strips trailing SOURCES block, finds [n] indices
  parse-proposals.ts         # extracts [MEMORY_PROPOSAL] blocks
  agent/                     # LangGraph agent
    state.ts                 # Annotation.Root state with reducers
    schemas.ts               # zod schemas for decide + assess
    nodes.ts                 # decideNode, searchNode, assessNode (+ MAX_SEARCHES)
    generate.ts              # streamAnswer() — streamText over gathered context
    graph.ts                 # decide → (search → assess → loop) → END
    stream-bridge.ts         # runs graph, streams SSE events to the client
    events.ts                # AgentEvent union: progress | sources | token | done | error
```

---

## Data model (Dexie)

Three tables in IndexedDB (db name `lorekeeper` — legacy from before the
Hearthnote rebrand; kept so existing local data survives), version 1:

- **`games`** — `{ id, name, createdAt }`
- **`playthroughs`** — long-lived (days/months); one game, one character.
  Holds `memory: MemoryBlock[]` (the persistent context injected into every
  chat), `modelId`, and `lastSessionId` for auto-resume.
- **`sessions`** — single sitting within a playthrough. Holds `messages[]`
  (user + assistant) and optional `summary`/`endedAt` once ended. Past
  sessions are read-only in the UI.

A `MemoryBlock` has a category (`quest | choice | character | location | note`)
and a `source` (`user | ai`) marking whether it was added manually or
AI-proposed.

All writes go through helpers in `lib/db.ts` (`createPlaythrough`,
`addMemoryBlock`, `appendMessage`, etc.). Components never touch `db.table.*`
directly — keeps invariants (e.g. `updatedAt` bumping, session message arrays
treated as immutable) in one place.

Read components use `useLiveQuery` (`dexie-react-hooks`) for reactivity.

---

## Chat agent (LangGraph)

Lives under [`lib/agent/`](../lib/agent/). The graph is:

```
            ┌──────────┐ needsSearch=false
START ───►  │  decide  │ ─────────────────► END
            └──────────┘
                  │ needsSearch=true
                  ▼
            ┌──────────┐         ┌──────────┐ hasEnough=true or
            │  search  │ ──────► │  assess  │ retrievalCount ≥ MAX_SEARCHES
            └──────────┘         └──────────┘ ────► END
                  ▲                   │
                  └───────────────────┘ hasEnough=false
```

- **`decide`** — `generateObject` returns `{ needsSearch, query }`. If
  search is needed, sets `nextQuery`. Falls back to **search-anyway** on
  error (better than risking hallucinated citations).
- **`search`** — calls Tavily, appends indexed `RetrievedResult`s to state
  (`results` reducer concatenates across loops). Indices are 1-based, sequential
  across loop iterations — citations stay stable.
- **`assess`** — `generateObject` returns `{ hasEnough, nextQuery }`.
  `MAX_SEARCHES` (currently 2) hard-caps the loop. Falls back to
  `hasEnough: true` on error.

After the graph ends, [`stream-bridge.ts`](../lib/agent/stream-bridge.ts) runs
**`streamAnswer`** ([`lib/agent/generate.ts`](../lib/agent/generate.ts)) — a
`streamText` call that injects the gathered context as part of the user
message and instructs the model to cite `[n]`. **It does not pass tools.**
Tokens stream to the client as `token` events.

### Why no model tool-calling

The whole point of LangGraph here is that **the model never emits tool
calls**. Groq's free models (llama-3.3, gpt-oss) have flaky tool-calling
behavior (parallel-call validator rejects, "Failed to call a function" errors,
"Tool choice is none, but model called a tool" if the prompt even *mentions* a
tool). By keeping retrieval in our code and only asking the model to (a)
decide via `generateObject` and (b) write the cited answer, we sidestep that
entire failure surface. See [decisions.md](./decisions.md) and
[known-issues.md](./known-issues.md).

### Stream protocol

`/api/chat` returns Server-Sent Events. Each event is a JSON `AgentEvent`:

```ts
{ type: 'progress'; step: string; message: string }
{ type: 'sources'; sources: SearchSource[] }     // emitted once before tokens
{ type: 'token'; text: string }                  // many during streaming
{ type: 'done' }
{ type: 'error'; message: string }
```

The client consumes via [`hooks/useAgent.ts`](../hooks/useAgent.ts). The
`SessionView` persists the user message to Dexie immediately, then on
completion persists the assistant message (with cleaned text — `[MEMORY_PROPOSAL]`
blocks stripped — and `sources` if any) and surfaces any proposals as toasts.

---

## Theming / design system

See [conventions.md](./conventions.md) for the DRY rules. High-level:

- Palette + fonts live in `@theme` in [`app/globals.css`](../app/globals.css)
  (Tailwind v4 CSS-first). JS-side inline styles (gradients, box-shadows)
  mirror the same values via [`lib/tokens.ts`](../lib/tokens.ts) — single
  source of truth.
- Surface elevation via [`stoneSurface(elevation)`](../lib/surfaces.ts) —
  layered overlay + stone texture in `public/textures/rough-stone.jpg`.
- Gilded multi-layer border via [`frameShadow()`](../lib/frame.ts).
- Icons: game-icons.net SVGs in `public/icons/`, colourable via CSS mask in
  [`components/shared/GameIcon.tsx`](../components/shared/GameIcon.tsx).
- Two fonts only: **Cinzel** (caps chrome labels, `.font-ui`) + **Crimson Text**
  (body, default).
- **No `border-radius`** anywhere. Everything hard-edged.

---

## Routes

```
GET  /                                        client redirect → last playthrough or /new
GET  /new                                     onboarding multi-step
GET  /playthrough/[id]                        auto-resume today's session
GET  /playthrough/[id]/session/[sessionId]    view a specific session (read-only if past)
POST /api/chat                                SSE: agent run + answer stream
POST /api/session-end                         JSON: summary + memory proposals
GET  /design                                  dev-only kitchen sink (tokens, components, sample bubble)
```

---

## Files worth knowing about

- [`.claude/planning/lorekeeper-spec.md`](../.claude/planning/lorekeeper-spec.md) — the original full spec
- [`.claude/planning/lorekeeper-prototype.jsx`](../.claude/planning/lorekeeper-prototype.jsx) — visual reference only; not used at runtime
- [`docs/decisions.md`](./decisions.md) — the why behind specific choices
- [`docs/conventions.md`](./conventions.md) — code/UI conventions
- [`docs/local-dev.md`](./local-dev.md) — env keys, running the app
- [`docs/known-issues.md`](./known-issues.md) — provider quirks, gotchas
