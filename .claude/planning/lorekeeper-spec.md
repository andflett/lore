# Lorekeeper — Project Spec

A web app gaming companion. Ask questions about any RPG without re-typing context every time. Maintains structured memory per playthrough, with ephemeral sessions per sitting.

---

## Core concepts

**Playthrough** — long-lived (days/months). One game, one character. Has structured memory that accumulates over time. This is the primary persistence unit.

**Session** — a single sitting within a playthrough (hours). Ephemeral conversational history. At session end, the AI proposes what (if anything) should be promoted to playthrough memory. Sessions are kept for reference but not used as live context.

**Playthrough memory** — discrete, structured facts about the playthrough. Curated by the user (with AI proposals). This is what gets injected into every request, not the raw session history.

---

## Tech stack

- **Next.js 15** (App Router) — per conventions
- **TypeScript** strict mode
- **Tailwind** for styling
- **BaseUI** for components
- **Dexie.js** — IndexedDB wrapper; all data is local-first, no backend
- **Vercel AI SDK** (`ai`) — unified interface to all model providers via Vercel AI Gateway. No provider-specific packages needed. Called server-side via Next.js Route Handlers.
- **Tavily API** — web search, called from the same Route Handler as a tool
- **Zod** — schema validation for AI SDK tool definitions (AI SDK v6 requires Zod for tool input schemas)
- **Motion** (`motion/react`) for animations
- **Lucide React** for icons

---

## Environment variables

```
AI_GATEWAY_API_KEY=gw_xxx    # from Vercel Dashboard → AI Gateway → API Keys
TAVILY_API_KEY=tvly_xxx
```

The `AI_GATEWAY_API_KEY` gives access to all supported providers (Anthropic, OpenAI, Google, etc.) through a single key. No per-provider keys required unless you opt into BYOK for private resources.

---

## Model configuration

Models are referenced as `"provider/model-name"` strings — no import changes needed when switching. Store the active model preference per playthrough (or globally) so the user can choose.

```typescript
// lib/models.ts

export interface ModelOption {
  id: string              // e.g. "anthropic/claude-sonnet-4-5"
  label: string           // e.g. "Claude Sonnet 4.5"
  provider: string        // e.g. "Anthropic"
  notes?: string          // e.g. "Best for long context"
}

export const MODELS: ModelOption[] = [
  { id: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet 4.5', provider: 'Anthropic', notes: 'Recommended' },
  { id: 'anthropic/claude-opus-4',     label: 'Claude Opus 4',     provider: 'Anthropic', notes: 'Highest quality' },
  { id: 'openai/gpt-4o',              label: 'GPT-4o',             provider: 'OpenAI' },
  { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash',  provider: 'Google', notes: 'Fastest' },
]

export const DEFAULT_MODEL = MODELS[0].id
```

Add `modelId: string` to the `Playthrough` interface, defaulting to `DEFAULT_MODEL` on creation. The model picker lives in the MemoryPanel / settings area — not in the chat input, to keep the main interface clean.

---

## Data model

All stored in IndexedDB via Dexie. Export all types from `lib/types.ts`.

```typescript
// lib/types.ts

export interface Game {
  id: string
  name: string                 // e.g. "Tainted Grail: Fall of Avalon"
  createdAt: number
}

export interface Playthrough {
  id: string
  gameId: string
  name: string                 // e.g. "Warrior — second run"
  characterName?: string
  characterClass?: string
  difficulty?: string
  playstyleNotes?: string      // free text: "playing blind", "stealth preferred", etc.
  currentLocation?: string     // loose sense of where they are in the game
  memory: MemoryBlock[]
  createdAt: number
  updatedAt: number
  lastSessionId?: string       // for auto-resume
}

export type MemoryCategory =
  | 'quest'      // active or completed quests
  | 'choice'     // consequential decisions made
  | 'character'  // build, level, abilities
  | 'location'   // current area, discovered places
  | 'note'       // anything else

export interface MemoryBlock {
  id: string
  category: MemoryCategory
  content: string              // e.g. "Completed: The Dying Knight quest. Chose to mercy kill."
  addedAt: number
  source: 'user' | 'ai'       // was this manually added or AI-proposed?
}

export interface Session {
  id: string
  playthroughId: string
  startedAt: number
  endedAt?: number
  summary?: string             // AI-generated at session end; stored for reference only
  messages: Message[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SearchSource[]     // indexed sources fetched during this message; [1] in text = sources[0]
  timestamp: number
}

export interface SearchSource {
  index: number                // 1-based; matches [n] citation in message content
  title: string
  url: string
  domain: string               // e.g. "wiki.gg", "reddit.com"
}

// Returned by the session-end AI call
export interface ProposedMemoryUpdate {
  category: MemoryCategory
  content: string
}
```

### Dexie schema

```typescript
// lib/db.ts
import Dexie, { type Table } from 'dexie'
import type { Game, Playthrough, Session } from './types'

export class LKDatabase extends Dexie {
  games!: Table<Game>
  playthroughs!: Table<Playthrough>
  sessions!: Table<Session>

  constructor() {
    super('lorekeeper')
    this.version(1).stores({
      games: 'id, name',
      playthroughs: 'id, gameId, updatedAt',
      sessions: 'id, playthroughId, startedAt',
    })
  }
}

export const db = new LKDatabase()
```

---

## Route handlers

All AI calls go through Next.js Route Handlers (server-side) to keep API keys off the client. Both use the Vercel AI SDK — no Anthropic-specific imports anywhere.

```typescript
// Shared import pattern for all route handlers
import { streamText, generateObject, tool } from 'ai'
import { z } from 'zod'
```

### `POST /api/chat`

Main inference endpoint. Builds context, runs tool-augmented completion, streams response.

**Request body:**
```typescript
{
  messages: { role: 'user' | 'assistant', content: string }[]
  playthrough: Playthrough
  game: Game
  modelId?: string   // falls back to playthrough.modelId or DEFAULT_MODEL
}
```

**Implementation:**
```typescript
import { streamText, tool, StreamData } from 'ai'
import { z } from 'zod'

export async function POST(req: Request) {
  const { messages, playthrough, game, modelId } = await req.json()

  const data = new StreamData()
  const collectedSources: SearchSource[] = []

  const result = streamText({
    model: modelId ?? playthrough.modelId ?? DEFAULT_MODEL,
    system: buildSystemPrompt(game, playthrough),
    messages,
    tools: {
      search_web: tool({
        description: 'Search the web for specific game information. Use for quest steps, item locations, enemy details, or anything requiring up-to-date wiki or community knowledge.',
        parameters: z.object({
          query: z.string().describe('The search query. Always include the game name. Be specific.')
        }),
        execute: async ({ query }) => {
          const raw = await searchTavily(query)
          // Number sources sequentially so model can cite them as [1], [2] etc.
          const indexed = raw.map((r, i) => ({
            ...r,
            index: collectedSources.length + i + 1,
          }))
          collectedSources.push(...indexed)
          // Return to model in a format that makes citing easy
          return indexed.map(s =>
            `[${s.index}] ${s.title} (${s.url})\n${s.content}`
          ).join('\n\n')
        }
      })
    },
    maxSteps: 3,
    onFinish: () => {
      // Send sources as structured metadata alongside the text stream
      if (collectedSources.length > 0) {
        data.append({ sources: collectedSources })
      }
      data.close()
    }
  })

  return result.toDataStreamResponse({ data })
}
```

`StreamData` lets the route send structured JSON alongside the text stream in the same HTTP response. The client receives both simultaneously — the text renders as it streams, and sources arrive in the `data` field of the `useChat` hook when `onFinish` fires.

**Tavily helper:**
```typescript
async function searchTavily(query: string) {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      include_domains: ['wiki.gg', 'fextralife.com', 'reddit.com'],
      max_results: 5,
    })
  })
  const json = await res.json()
  return json.results.map((r: any) => ({
    title: r.title,
    url: r.url,
    domain: new URL(r.url).hostname.replace('www.', ''),
    content: r.content,
  }))
}
```

**Receiving sources on the client with `useChat`:**
```typescript
const { messages, data } = useChat({ api: '/api/chat', body: { playthrough, game } })

// data is an array of StreamData payloads appended during the stream.
// Match sources to the last assistant message after stream completes.
// Store sources on the Message record in Dexie once the stream finishes.
```

Because `useChat` manages message state internally, persist sources to Dexie in the `onFinish` callback and reload from Dexie for rendering — don't rely on in-memory `data` across re-renders.

**Response:** AI SDK `toDataStreamResponse({ data })` with `StreamData` attached.

---

### `POST /api/session-end`

One-shot JSON generation — no streaming needed.

**Request body:**
```typescript
{
  session: Session
  playthrough: Playthrough
  game: Game
}
```

**Implementation:**
```typescript
import { generateObject } from 'ai'
import { z } from 'zod'

export async function POST(req: Request) {
  const { session, playthrough, game } = await req.json()

  const { object } = await generateObject({
    model: playthrough.modelId ?? DEFAULT_MODEL,
    schema: z.object({
      summary: z.string(),
      proposals: z.array(z.object({
        category: z.enum(['quest', 'choice', 'character', 'location', 'note']),
        content: z.string(),
      }))
    }),
    prompt: buildSessionEndPrompt(game, playthrough, session),
  })

  return Response.json(object)
}
```

`generateObject` with a Zod schema replaces the fragile JSON parsing in the original spec — the SDK enforces the schema and retries automatically if the model produces malformed output.

---

## System prompt

```
You are a knowledgeable gaming companion helping with a specific playthrough.

GAME: {{game.name}}

PLAYTHROUGH: {{playthrough.name}}
{{if characterName}}CHARACTER: {{characterName}}{{/if}}
{{if characterClass}}CLASS: {{characterClass}}{{/if}}
{{if difficulty}}DIFFICULTY: {{difficulty}}{{/if}}
{{if playstyleNotes}}PREFERENCES: {{playstyleNotes}}{{/if}}
{{if currentLocation}}CURRENT LOCATION: {{currentLocation}}{{/if}}

PLAYTHROUGH MEMORY:
{{memory.map(m => `[${m.category.toUpperCase()}] ${m.content}`).join('\n') || 'Nothing recorded yet.'}}

---

INSTRUCTIONS:
- Answer questions about this game concisely and practically.
- Use the search tool when the question requires specific game knowledge — quest steps, enemy weaknesses, item locations, lore details. Do not search for general RPG questions you can answer from training.
- Prefer results from game wikis (Fextralife, wiki.gg, the game's own wiki) over generic gaming sites.

CITATIONS (mandatory when search results are used):
- Every factual claim derived from a search result MUST be followed by its citation number in brackets, e.g. "The Dying Knight is found in the Ossuary [1]."
- Cite the most specific source available. If a wiki page covers the exact quest being asked about, cite that page — not a general wiki homepage.
- If multiple sources confirm the same claim, cite all of them: [1][2].
- At the end of your response, if any searches were performed, include a SOURCES section listing each cited source:
  SOURCES
  [1] Page Title — domain.com — https://full-url
- Do not invent citation numbers. Only cite sources returned by the search tool in this conversation.
- If you answer from training knowledge without searching, say so: "(from training data — verify with a wiki if critical)".

SPOILERS:
- Do not volunteer spoilers beyond what the question requires.
- If the player's preferences indicate they're playing blind, acknowledge when something would be a spoiler and ask before answering.

MEMORY PROPOSALS:
If this conversation reveals something worth remembering about the playthrough — a quest completed, a major choice made, a location reached — append a proposal at the end of your response using this exact format:

[MEMORY_PROPOSAL category="quest|choice|character|location|note"]
One clear sentence describing the fact to remember.
[/MEMORY_PROPOSAL]

Only propose things that are genuinely durable facts, not questions or in-progress things.
```

---

## Session-end prompt

```
The following is a Q&A session from a {{game.name}} playthrough.
Review it and:
1. Write a 2–3 sentence plain summary of what was covered this session.
2. List any facts that should be added to the playthrough's permanent memory.

Only propose durable facts (quests completed, choices made, locations reached, build decisions).
Do not propose questions asked, information the player already knew, or things that were in-progress.

Respond as JSON only:
{
  "summary": "...",
  "proposals": [
    { "category": "quest|choice|character|location|note", "content": "..." }
  ]
}

SESSION:
{{session.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}}
```

---

## New playthrough onboarding

Triggered when the user creates a new playthrough. A short multi-step flow (not a form — one question per screen) that populates the initial playthrough fields.

**Steps:**
1. **Game** — type-ahead over existing games, or create new. Just a name.
2. **Playthrough name** — optional, defaults to `"Run 1"` etc. Useful when multiple runs exist.
3. **Character** — character name + class/build (both optional, placeholder: "skip for now")
4. **Difficulty** — short text or skip
5. **Playstyle** — free text, placeholder: `"e.g. playing blind, prefer stealth, don't spoil main story"`. This is the most useful field.
6. **Where are you?** — free text: `"Just started"` or `"Act 2, just reached the Avalon coast"`. Optional.

All fields except game name are optional. The user can fill them in later from the memory/settings panel.

---

## App structure

```
app/
  layout.tsx                  # root layout — sidebar + main panel
  page.tsx                    # redirects to last playthrough or /new
  new/
    page.tsx                  # new playthrough onboarding flow
  playthrough/
    [id]/
      page.tsx                # loads playthrough, auto-resumes last session
      session/
        [sessionId]/
          page.tsx            # specific session view (read-only for past sessions)

api/
  chat/
    route.ts
  session-end/
    route.ts

components/
  sidebar/
    Sidebar.tsx               # playthrough list
    PlaythroughItem.tsx
    SessionList.tsx           # collapsible session history per playthrough
  chat/
    SessionView.tsx           # active session — message list + input
    MessageBubble.tsx         # user/assistant message wrapper; routes to AssistantMessage or UserMessage
    AssistantMessage.tsx      # renders CitedText + SourcesFooter
    CitedText.tsx             # replaces [n] markers in streamed text with superscript anchor links
    SourcesFooter.tsx         # expandable list of cited sources below assistant message
    ChatInput.tsx
  memory/
    MemoryPanel.tsx           # slide-over or drawer — view/add/remove memory blocks
    MemoryBlock.tsx
    MemoryProposalToast.tsx   # inline proposal during chat (from [MEMORY_PROPOSAL] tags)
  session-end/
    SessionEndReview.tsx      # modal: session summary + proposed memory updates to accept/reject
  onboarding/
    NewPlaythroughFlow.tsx    # multi-step, one question per screen
  shared/
    IconButton.tsx

lib/
  db.ts                       # Dexie instance
  types.ts                    # all interfaces
  build-system-prompt.ts      # assembles system prompt from playthrough
  parse-proposals.ts          # extracts [MEMORY_PROPOSAL] blocks from streamed response
  parse-citations.ts          # extracts [n] markers + SOURCES block; matches to SearchSource[]
```

---

## Citations

Citations are first-class — every factual claim should be traceable to a source the player can open and verify (or use as a walkthrough). This section covers the full pipeline from Tavily result to rendered link.

### How it works end-to-end

1. The model calls `search_web`. The `execute` function assigns each result a sequential index and returns them to the model formatted as `[1] Title\nContent`, `[2] Title\nContent`, etc.
2. The model's response uses `[n]` markers inline: *"Go to the Ossuary on the north side of the map [1]."*
3. When the stream finishes, `onFinish` fires and appends `{ sources: SearchSource[] }` to the `StreamData`.
4. The client receives sources via `useChat`'s `data` array. On finish, it writes the sources to the message record in Dexie.
5. `CitedText` renders the message content, replacing `[n]` with a superscript `<a>` that links to `sources[n-1].url`. Clicking opens the source in a new tab.
6. `SourcesFooter` renders a collapsed list of all sources below the message. Each entry shows domain, title (linked), and full URL.

### `parse-citations.ts`

```typescript
// Strips the SOURCES block the model appends (since we have structured sources from StreamData,
// we don't need the model-generated list — but we keep [n] markers in the main text).
// Returns: { text: string (cleaned), citedIndices: number[] }

export function parseCitations(content: string): {
  text: string
  citedIndices: number[]
} {
  const sourcesBlockPattern = /\n*SOURCES\n[\s\S]*$/
  const text = content.replace(sourcesBlockPattern, '').trim()
  const citedIndices = [...text.matchAll(/\[(\d+)\]/g)].map(m => parseInt(m[1]))
  return { text, citedIndices: [...new Set(citedIndices)] }
}
```

### `CitedText.tsx`

```typescript
// Splits content on [n] markers and renders each as:
// span of text + superscript anchor to the source URL

interface Props {
  content: string
  sources: SearchSource[]
}

export function CitedText({ content, sources }: Props) {
  const parts = content.split(/(\[\d+\])/)
  return (
    <p>
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/)
        if (match) {
          const index = parseInt(match[1])
          const source = sources.find(s => s.index === index)
          if (source) {
            return (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                title={source.title}
                className="..." // superscript style
              >
                [{index}]
              </a>
            )
          }
        }
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}
```

### `SourcesFooter.tsx`

Renders below each assistant message that has sources. Collapsed by default — one click expands to show the full source list.

Each source entry shows:
- Domain favicon (via `https://www.google.com/s2/favicons?domain={domain}`)
- Title as a clickable link (opens in new tab)
- Domain label in muted text
- Full URL in a copyable `<code>` element (useful when a wiki page has a long walkthrough the player wants to visit properly)

Sources are ordered by index. Only sources actually cited in the text (matched by `citedIndices`) are shown — unfetched or unused results from Tavily are not displayed.

### Edge cases for Claude Code

- **Stream still in progress**: `CitedText` must handle partial content gracefully. While streaming, `[n]` markers may appear before sources arrive. Render them as plain `[n]` text during streaming; swap to links once sources are received in `data`.
- **Model cites a non-existent index**: If the model hallucinates `[7]` and there are only 3 sources, render `[7]` as plain text, not a broken link.
- **Multiple searches in one response** (`maxSteps: 3` allows one tool call): indices are sequential across all searches in a single response. If a second search call is needed within a request, the `execute` function's `collectedSources.length` offset handles this correctly.
- **SOURCES block in text**: The model will append a SOURCES block as instructed. Strip it using `parseCitations` before rendering — the structured `StreamData` sources are the authoritative source list.

---

## Key flows

### App open
1. Read `lastPlaythroughId` from localStorage
2. Load playthrough from Dexie → if none, redirect to `/new`
3. Load `lastSessionId` from playthrough → if session is from today, resume it; otherwise create a new session
4. Render session with existing messages (today's session) or empty

### Ask a question
1. User types message → optimistically append to session in Dexie + render
2. POST to `/api/chat` with full session messages + playthrough
3. Stream response → render via `CitedText` as text arrives; `[n]` markers render as plain text during streaming
4. Stream finishes → sources arrive in `useChat`'s `data` → write sources to message record in Dexie → `[n]` markers become clickable superscripts, `SourcesFooter` appears
5. Parse `[MEMORY_PROPOSAL]` blocks from the cleaned text → show as dismissible inline card (MemoryProposalToast)
6. User can accept (adds to playthrough memory), edit then accept, or dismiss

### End session
1. User clicks "End session" in sidebar or header
2. POST to `/api/session-end` — returns summary + proposals
3. SessionEndReview modal opens with:
   - Session summary (read-only)
   - List of proposed MemoryBlocks — each can be accepted, edited, or rejected
4. On confirm: write accepted blocks to `playthrough.memory` in Dexie, write summary to `session.summary`, set `session.endedAt`
5. Modal closes — sidebar now shows the ended session as collapsed history

### New session in existing playthrough
1. User clicks "New session" in sidebar
2. Creates new Session record in Dexie, sets as `lastSessionId` on playthrough
3. Chat view clears — but MemoryPanel still shows all accumulated playthrough memory
4. Previous session moves to collapsed history in sidebar

### Manage memory manually
1. User opens MemoryPanel (button in header)
2. Can see all MemoryBlocks grouped by category
3. Can delete any block, edit content inline, or add a block manually
4. Changes write immediately to Dexie

---

## Build order

**Step 1 — Design system (agree before continuing)**
Before any feature work, establish and sign off the design system in isolation, base this on planning/lorekeeper-prototype.jsx, but do not copy code directly — re-implement as a clean Next.js + Tailwind setup. This is to ensure the visual language and core components are solid before building features on top.

IMPORTANT: this app will primarily be used on mobile, so while a desktop view is encouraged, it should be MOBILE FIRST.

- Next.js app scaffolded with Tailwind config (colour tokens, font setup, no border-radius global)
- `globals.css` with base styles and any utilities
- Any common components, based on BaseUI, like button etc, but styled to match the prototype's look (stone backgrounds, gold borders, Cinzel font for labels, metal-style buttons with hover states, etc.)
- `GameIcon` component wired to a small initial icon set in `public/icons/` taken from https://game-icons.net/
- A single `/design` route (dev-only) that renders a kitchen sink: colour swatches, both fonts at various sizes, panel variants, button states, icon grid, a sample message bubble with a citation
- No DB, no API calls, no routing logic — purely visual

This page is the checkpoint. Agree it looks right before any feature work begins.

**Step 2 onwards — feature build per the rest of this spec.**

---

## MVP scope

**In scope:**
- Full playthrough/session data model in IndexedDB
- New playthrough onboarding flow
- Chat with streamed responses via AI SDK `useChat`
- Tavily web search as a tool (resolved server-side via `maxSteps`, transparent to client)
- Inline memory proposals during chat
- Session-end review modal with AI-proposed memory updates via `generateObject`
- Manual memory management panel
- Auto-resume last session on open
- Sidebar with playthrough list + per-playthrough session history
- Model picker per playthrough (Anthropic, OpenAI, Google via gateway)

**Out of scope for MVP:**
- Auth / sync / multi-device (local-first only)
- Game database / auto-complete for known games
- Image/screenshot upload
- Export playthrough notes
- Multiple playthroughs for the same game shown as "runs"

---

## Notes for Claude Code

> The file `lorekeeper-prototype.jsx` is a single-file React prototype showing the full UI. It contains:
> - The complete `C` (colour) and `F` (font) token objects — copy these directly
> - The `ST(elevation)` surface helper — translate to `stoneSurface()` from `lib/surfaces.ts`
> - The `Btn` component with all variants and `size`/`icon` props — re-implement as a BaseUI-based  component
> - The `Ico` inline SVG icon set — replace with game-icons.net files served as CSS masks
> - `PanelTitle`, `Panel`, `Divider`, `SourcesFooter`, `Render` (rich text), `ProposalToast` — all production-ready reference components
> - The `MSGS` / `PTS` data shapes match the TypeScript interfaces in this spec
> - All modals (`SessionEndModal`, `MemorySheet`, `PlaythroughSheet`) use `PanelTitle` with `ST('raised')` — no custom header backgrounds



- All DB writes should go through small helper functions in `lib/db.ts`, not scattered across components
- `build-system-prompt.ts` should be a pure function: `(game: Game, playthrough: Playthrough) => string`
- `build-session-end-prompt.ts` similarly: `(game: Game, playthrough: Playthrough, session: Session) => string`
- The `[MEMORY_PROPOSAL]` parsing approach from the original design is replaced by `generateObject` with a Zod schema in the session-end route — more reliable. During chat, inline proposals still come from the streamed text and need `parse-proposals.ts` for extraction.
- Client-side streaming: use the AI SDK's `useChat` hook from `ai/react`. It handles the data stream format that `toDataStreamResponse()` emits. Pass `api: '/api/chat'` and `body: { playthrough, game, modelId }`.
- The model picker should show provider alongside model name. Group by provider in the dropdown. Store selection in `playthrough.modelId` and write to Dexie on change.
- Dates: store all timestamps as `Date.now()` (ms epoch). Display with `Intl.DateTimeFormat`.
- Session "today" check: a session counts as today's if `startedAt` is on the same calendar date as now (local time). Don't create a new session just because it's been a few hours.
---

## Design language

> **A working prototype exists at `lorekeeper-prototype.jsx`. Read the tokens and component patterns there first — this section is the spec translation into Next.js terms. When in doubt, the prototype is the visual truth.**

The visual identity is dark fantasy / old-school CRPG: heavy stone-and-gold panel borders, deep near-black backgrounds, classical serif text. Nothing rounded, nothing modern, no blur. Every surface feels like aged stone or tarnished metal. The two fonts — Cinzel for chrome labels, Crimson Text for body — carry the atmosphere without needing pixel fonts.

---

### Fonts

Install via `next/font/google`. Two families only:

| Use | Font | Size range | Notes |
|-----|------|-----------|-------|
| Body, chat text, labels | `Crimson Text` | 13–16px | Readable serif with old-world feel. All prose and UI copy. |
| Headers, panel titles, key UI chrome | `Cinzel` | 8–12px | Classical Roman caps. Sparingly — panel titles, section labels. |

```typescript
// app/layout.tsx
import { Cinzel, Crimson_Text } from 'next/font/google'

const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-ui' })
const crimsonText = Crimson_Text({ weight: ['400','600'], subsets: ['latin'], variable: '--font-body' })
```

Set base `font-size: 14px`. Crimson Text at 14–16px for body, Cinzel at 9–12px for chrome labels. Letter-spacing `0.12–0.22em` on Cinzel. Nothing rounded, nothing modern.

---

### Colour palette

```typescript
// tailwind.config.ts  (tokens match the approved prototype exactly)
colors: {
  void:   '#080807',     // page background — warm near-black
  stone: {
    s0:   '#0f0e0c',     // deepest — panel body backgrounds
    s1:   '#161410',     // sidebar, raised chrome
    s2:   '#1e1c18',     // elevated surfaces, inputs
    s3:   '#272420',     // highest raised chrome
  },
  gold: {                // bronze/gold — borders and highlights only
    b0:   '#1c1408',
    b1:   '#342408',
    b2:   '#5e3c0c',
    b3:   '#8c6010',
    DEFAULT: '#c8921a',  // primary gold — active borders, diamond accents
    bright:  '#dca830',  // hover / focus
    text:    '#f0d070',  // lightest — gold text on dark
  },
  text: {
    dim:  '#706c64',     // very muted — placeholders, disabled
    t0:   '#948e84',     // secondary / caption text
    t1:   '#bab6aa',     // body / assistant text
    t2:   '#d8d4c8',     // primary body text
    t3:   '#eeeae0',     // emphasis / headings
  },
  assistant: '#4a3418',  // warm dark parchment — assistant message border
  blood:  '#b83030',     // danger, error states
  verdant:'#2a5020',     // success, positive states
}
```

---

### Panel borders — the core visual motif

Every panel, modal, and card uses the same layered border treatment. Implement as a Tailwind plugin or a reusable CSS class `panel`:

```css
.panel {
  background-color: theme('colors.stone.deep');
  border: 2px solid theme('colors.gold.DEFAULT');
  box-shadow:
    inset 0 0 0 1px theme('colors.gold.dim'),   /* inner glow line */
    0 0 0 1px theme('colors.stone.deep'),        /* gap between borders */
    0 0 0 3px theme('colors.gold.dim');          /* outer shadow line */
  image-rendering: pixelated;
}

.panel:focus-within,
.panel--active {
  border-color: theme('colors.gold.bright');
  box-shadow:
    inset 0 0 0 1px theme('colors.gold.DEFAULT'),
    0 0 0 1px theme('colors.stone.deep'),
    0 0 0 3px theme('colors.gold.DEFAULT');
}
```

No `border-radius` anywhere in the app. Everything hard-edged.

**Decorative corner dots**: Add to panels using a `::before` / `::after` trick — four 4×4px squares at corners using `box-shadow` to simulate the chunky corner rivets common in UO:

```css
.panel::before {
  content: '';
  position: absolute;
  inset: -1px;
  pointer-events: none;
  background:
    theme('colors.gold.bright') 0 0 / 4px 4px no-repeat,
    theme('colors.gold.bright') 100% 0 / 4px 4px no-repeat,
    theme('colors.gold.bright') 0 100% / 4px 4px no-repeat,
    theme('colors.gold.bright') 100% 100% / 4px 4px no-repeat;
}
```

---

### Texture

Two texture layers. Both are applied via CSS `backgroundImage` stacking — no separate DOM element needed.

**ROUGH_STONE** (real photographic rock aggregate, colour-graded to warm grey): applied to all structural surfaces via a helper function. Store as a base64 JPEG constant in the prototype; in production serve from `/public/textures/rough-stone.jpg`.

**TEX** (SVG `feTurbulence` noise): a very fine subtle grain layer for small content areas (message bubbles, source rows). Applied at low opacity so it doesn't fight the stone.

Surface elevation is conveyed by a CSS overlay gradient stacked above the stone texture, not by changing the texture itself:

```typescript
// lib/surfaces.ts
const STONE_URL = "url('/textures/rough-stone.jpg')"

export type Elevation = 'raised' | 'mid' | 'recessed' | 'deep'

export function stoneSurface(elevation: Elevation): React.CSSProperties {
  const overlays: Record<Elevation, string> = {
    raised:   'rgba(255,250,238,0.13), rgba(0,0,0,0.12)',
    mid:      'rgba(0,0,0,0.14), rgba(0,0,0,0.26)',
    recessed: 'rgba(0,0,0,0.38), rgba(0,0,0,0.50)',
    deep:     'rgba(0,0,0,0.52), rgba(0,0,0,0.66)',
  }
  return {
    backgroundImage: `linear-gradient(180deg, ${overlays[elevation]}), ${STONE_URL}`,
    backgroundSize:  'cover, 128px 128px',
    backgroundRepeat:'no-repeat, repeat',
  }
}
```

- `raised` — header, sidebar, footer chrome (slight warm highlight)
- `mid` — neutral panels
- `recessed` — message wall (darker, sits further back)
- `deep` — overlays, modals

---

### Icons — game-icons.net

Icons are single-path SVGs in white on transparent. Colour them via `currentColor` (set `fill="currentColor"` in the SVG) or use as CSS masks over a `background-color`.

**Setup:**

Download a curated set from https://game-icons.net and place in `public/icons/`. Use the mask approach for colourability:

```css
.game-icon {
  display: inline-block;
  width: 20px;
  height: 20px;
  background-color: currentColor;
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}
```

```tsx
// components/shared/GameIcon.tsx
interface Props {
  name: string        // filename without .svg
  className?: string
  size?: number
}
export function GameIcon({ name, className, size = 20 }: Props) {
  return (
    <span
      className={`game-icon ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(/icons/${name}.svg)`,
        maskImage: `url(/icons/${name}.svg)`,
      }}
    />
  )
}
```

Colouring is then just Tailwind `text-*` classes: `<GameIcon name="scroll-quill" className="text-gold-text" />`

**Icon assignments:**

| Context | Icon name (game-icons.net) |
|---------|---------------------------|
| Memory panel / open | `open-book` |
| Quest memory | `treasure-map` |
| Choice memory | `branching` or `crossroads` |
| Character memory | `cowled` or `gladius` |
| Location memory | `medieval-gate` or `castle` |
| Note memory | `quill-ink` |
| New playthrough | `dragon` |
| New session | `sunrise` |
| End session | `moon-bats` |
| Search / sources | `magnifying-glass` |
| Citation / source link | `scroll-unfurled` |
| Accept / confirm | `check-mark` |
| Dismiss / close | `cancel` |
| Model selector | `crystal-ball` |
| Sidebar toggle | `halberd` |
| Memory proposal | `light-bulb` |

Use https://game-icons.net/tags/ to find alternatives. All icons credited to their authors per CC BY 3.0 — add a small credits line in the app footer or an `/about` page.

---

### Scrollbars

Style scrollbars to match — thin, dark, gold thumb:

```css
/* globals.css */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: theme('colors.stone.deep'); }
::-webkit-scrollbar-thumb {
  background: theme('colors.gold.DEFAULT');
  border: 1px solid theme('colors.stone.deep');
}
::-webkit-scrollbar-thumb:hover { background: theme('colors.gold.bright'); }
```

---

### Motion

Use `motion/react` for:
- Panel entrances: `initial={{ opacity: 0, y: 8 }}` → `animate={{ opacity: 1, y: 0 }}`, `duration: 0.15` — fast, not floaty
- MemoryProposalToast: slide in from bottom-right
- SessionEndReview modal: scale from `0.96` to `1.0`
- Message stream: each message fades in on mount, no per-character animation

Keep everything fast. RPG UIs are snappy — no 0.5s transitions. 100–200ms max.

---

### Input and interactive elements

```css
/* Chat input */
.chat-input {
  background: theme('colors.stone.raised');
  border: 2px solid theme('colors.gold.dim');
  color: theme('colors.parchment.DEFAULT');
  font-family: var(--font-body);
  font-size: 20px;
  padding: 10px 14px;
  outline: none;
  resize: none;
}
.chat-input:focus {
  border-color: theme('colors.gold.DEFAULT');
}
```

Buttons use a raised border treatment to mimic physical buttons:
```css
.btn {
  background: theme('colors.stone.raised');
  border: 2px solid theme('colors.gold.DEFAULT');
  border-bottom: 3px solid theme('colors.gold.dim');
  color: theme('colors.gold.text');
  font-family: var(--font-display');
  font-size: 8px;
  padding: 6px 12px;
  cursor: pointer;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.btn:hover { border-color: theme('colors.gold.bright'); color: theme('colors.parchment.bright'); }
.btn:active { border-bottom-width: 2px; transform: translateY(1px); }
```

---

### Layout skeleton

```
┌─────────────────────────────────────────────────────────────────┐
│  [halberd icon] LOREKEEPER                         [crystal-ball]│  ← header bar (stone.deep bg, gold border-b)
├──────────────────┬──────────────────────────────────────────────┤
│                  │                                               │
│  [dragon] My     │  ┌─ Tainted Grail — Warrior run ───────────┐ │
│  Playthroughs    │  │  [open-book] Memory  [sunrise] New       │ │
│                  │  └───────────────────────────────────────── ┘ │
│  ▶ Tainted Grail │                                               │
│    ├─ Today      │  [message bubbles...]                         │
│    └─ Tue 20 May │                                               │
│                  │                                               │
│  + New           │  ─────────────────────────────────────────── │
│    Playthrough   │  [ Ask anything about this playthrough...   ] │
│                  │  [Send ▶]              [moon-bats End Session]│
└──────────────────┴──────────────────────────────────────────────┘
```

Sidebar: `240px` fixed, `stone.deep` bg. Main panel: flex-1, `stone.DEFAULT` bg. Both use `.panel` border treatment on their shared edge only. Header: `48px`, `stone.deep`.

---

### Cursor

Use a custom crosshair cursor to complete the RPG feel:
```css
* { cursor: url('/cursor.png') 8 8, crosshair; }
a, button, [role='button'] { cursor: url('/cursor-pointer.png') 8 8, pointer; }
```

A simple 16×16 pixel art crosshair in gold. Can be generated as an SVG and converted, or drawn in any pixel editor.

