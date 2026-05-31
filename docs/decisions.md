# Decisions

Notable architecture decisions, why we made them, and what we'd change first if
something shifts. New decisions go at the bottom.

---

## D1 · Direct provider SDKs, not the Vercel AI Gateway

**Decision:** Call Anthropic and Groq directly via `@ai-sdk/anthropic` and
`@ai-sdk/groq`. `ANTHROPIC_API_KEY` and `GROQ_API_KEY` are in `.env.local`. No
`AI_GATEWAY_API_KEY`. The `resolveModel()` helper in [`lib/provider.ts`](../lib/provider.ts)
splits a registry id like `"groq/llama-3.3-70b-versatile"` and picks the right
provider.

**Why:** The Vercel AI Gateway free tier rate-limits to a handful of requests
per session — even through BYOK (the error literally says
"...including via BYOK"). That throttle is an account/billing constraint, not a
code issue. Dropping the gateway removes it. The `@ai-sdk/*` provider packages
are Vercel-authored but **call the providers directly** with your own keys — no
Vercel middleman in the request path. (`@ai-sdk/groq` ≈ `groq-sdk` under a
unified `LanguageModel` interface.) Same approach as Andrew's `/many` repo.

**Tradeoff:** Slight Vercel dependency (the SDK wrappers) — but they buy us
provider portability (`anthropic ↔ groq` is one string change in the model id).
If full provider-native is ever required, swap `@ai-sdk/groq` for `groq-sdk`
and rewrite call sites (more code, loses unified interface).

**Resilience:** `resolveModel()` falls back to `DEFAULT_MODEL` (currently
gpt-oss-120b on Groq) if the chosen provider's key isn't present. Keeps the
app working when `ANTHROPIC_API_KEY` isn't set and a playthrough has a Claude
modelId stored.

---

## D2 · LangGraph for the chat agent (not in-model tool calling)

**Decision:** Use LangGraph to orchestrate `decide → search → assess → generate`.
The model only does `generateObject` (decide, assess) and `streamText`
(generate). **Our code** runs Tavily — the model never emits tool calls.

**Why:** Tested every other path. Groq's serving of llama-3.3 and gpt-oss
fails three distinct ways when given a `tool()` definition: "Failed to call a
function" (llama can't emit valid tool-call JSON), "Tool call validation
failed" (parallel calls rejected), and "Tool choice is none, but model called
a tool" (model defies the constraint even when we strip tools). These are
provider-side 400s — no framework can recover from them. Anthropic handles
tool calls fine, but we wanted a setup that's free for dev iteration.

By keeping retrieval in our code, the model only ever does two things Groq is
good at: structured JSON (json_schema) and plain text generation. Reliability
went from "fails most of the time" to "works every time."

**Tradeoff:** ~250 lines of agent code we own (state, nodes, graph, bridge).
One extra LLM call per turn (the `decide` step), negligible on Groq. Less
agentic flexibility — if we wanted the model to invent novel tool sequences,
we'd need to change this.

**LangGraph specifically vs plain functions:** Same reliability either way.
LangGraph gives us the graph-as-data, conditional edges, state reducers, and a
streaming interface — matches Andrew's `/many` repo for consistency, and is
easier to extend later.

---

## D3 · `decide` node defaults to **search** on failure, not "answer from training"

**Decision:** If `generateObject` in the decide node throws (model lacks
`json_schema` support, transient failure, etc.), default to `needsSearch:
true` and search anyway.

**Why:** The opposite default produced **fabricated citations**. When llama-3.3
hit the catch (it doesn't support `json_schema`), it fell through to "answer
from memory", and the system prompt's "cite [n] when you have results" got
interpreted creatively — output included `[1]` with no real source attached.
Searching on uncertainty wastes a Tavily call at worst; hallucinating a
citation is wrong.

**Tradeoff:** Some Tavily calls on questions that didn't need them. Cheap.

---

## D4 · Two system prompts: `buildSystemPrompt` (legacy) vs `buildAnswerPrompt` (generate)

**Decision:** The generate-step prompt
([`lib/build-answer-prompt.ts`](../lib/build-answer-prompt.ts)) is distinct
from the original spec's `buildSystemPrompt`
([`lib/build-system-prompt.ts`](../lib/build-system-prompt.ts)). The answer
prompt **does not mention "the search tool"** and explicitly tells the model
not to request lookups.

**Why:** With LangGraph, by the time generate runs, search has already
happened. Mentioning a "search tool" was tripping Groq's tool-call detection
on gpt-oss — the model would emit a tool call attempt, Groq returned 400 ("Tool
choice is none, but model called a tool"), `streamText` emitted no `text-delta`,
and the user saw an empty bubble. Removing all tool mentions from the prompt
fixed it cleanly.

`buildSystemPrompt` is kept around for now in case we ever revert to in-model
tool calling on a different provider (Anthropic), but the agent route uses
`buildAnswerPrompt`.

---

## D5 · `reasoningFormat: 'parsed'` + `reasoningEffort: 'low'` for gpt-oss generate

**Decision:** Pass `providerOptions: { groq: { reasoningFormat: 'parsed',
reasoningEffort: 'low' } }` to the generate `streamText` call.

**Why:** gpt-oss is a reasoning model. At default settings with a heavy
context, it routes *everything* to the reasoning channel and emits zero
`text-delta`s — the UI shows nothing. The Groq provider docs explicitly call
out `reasoningFormat` ('parsed' separates reasoning from text) and
`reasoningEffort` (low keeps responses snappy). Both verified by a repro
script; both required.

**Note:** llama-3.3-70b-versatile is *not* a reasoning model, so these options
are harmless but inert when it's selected.

---

## D6 · Markdown rendering: chat tone, not document

**Decision:** [`MarkdownAnswer`](../components/chat/MarkdownAnswer.tsx) uses
react-markdown with custom component overrides:
- `h1`/`h2` → small Cinzel caps in gold (act as inline section labels)
- `h3`+ → 14px semibold body (no caps, tight margins)
- bullets: gold-b3 markers, tight spacing
- inline code: stone-s0 bg with thin gold-b1 border, no border-radius
- citations `[n]`: inline superscript links walked recursively through
  `linkify(children, sources)` so they keep working inside any element

**Why:** Default markdown styling makes responses look like Wikipedia
articles. The app is a chat companion — answers should feel like a knowledgeable
friend's reply, not a long-form document. Andrew explicitly flagged "don't
want huge headings, it needs to be read like a response not a large document."

**Citation walker:** Because markdown nests inline elements arbitrarily,
plain regex over the source doesn't work. The `linkify()` helper recursively
maps `Children`, replacing `[n]` substrings inside any string child with
anchor tags. Slightly more code, but supports `[1]` inside a bold, list item,
table cell, etc.

---

## D7 · Persistence boundary: never write empty assistant messages

**Decision:** `SessionView.send()` only calls `appendMessage(role: assistant)`
if `cleanedText.trim().length > 0`.

**Why:** When generation fails mid-stream (provider 400, network blip), we
get a final `text = ""`. Previously we persisted the empty bubble, polluting
the conversation list with mystery boxes. The user message is still saved
(we want it in history regardless of outcome) and the error surfaces inline.

---

## D8 · Toast queue: pop first, don't filter by reference

**Decision:** `acceptProposal` / `dismiss` use `setProposals((p) => p.slice(1))`.

**Why:** The `MemoryProposalToast` lets the user edit the proposal before
saving, which produces a new object reference. Filtering by `x !== proposal`
silently failed because the reference didn't match. Toasts are shown one at a
time in queue order, so popping the first item is always correct.

---

## D9 · Mobile-first layout, sidebar as drawer

**Decision:** Sidebar is a fixed 240px column on `md+`, a slide-in drawer
overlay on smaller screens (via Motion). Header has a halberd-icon toggle
visible only on mobile.

**Why:** Andrew's primary use case is mobile (he mentioned at spec time and
when asking for these docs). Mobile-first defaults; desktop is the
upgrade path.

---

## D10 · Tooltip via BaseUI, themed wrapper

**Decision:** [`Tooltip`](../components/shared/Tooltip.tsx) wraps
`@base-ui-components/react/tooltip` — we get a11y + positioning + portal
handling for free, then apply the stone-and-gold styling via Tailwind classes
on `Popup` and a custom SVG `Arrow`.

**Why:** Hand-rolling tooltips with hover/focus/escape/portal/positioning is
a lot of fiddly accessibility code. BaseUI handles it; we own the visual.
A `<Tooltip.Provider delay={300}>` lives in
[`components/shared/Providers.tsx`](../components/shared/Providers.tsx),
wrapped around `{children}` in the root layout.

---

## D11 · `IconButton` carries the accessible name on the real button

**Decision:** `IconButton` puts `ariaLabel` on the inner `<Btn>` (which
forwards to `<button aria-label>`) and wraps the whole thing in a `Tooltip`
whose `label` matches. No more `role="img"` wrapper.

**Why:** Earlier version wrapped the button in a `<span role="img"
aria-label>`, which doubled-up roles and made the actual focusable element
unnamed. Fixed it so the button itself is what assistive tech sees.

---

## D12 · Question `kind` + `spoilerRisk` live on the agent's decision

**Decision:** The decide node's `generateObject` returns four fields now:
`needsSearch`, `query`, `kind` (quest/build/boss/lore/item/mechanic/meta/other),
and `spoilerRisk` (none/minor/major). Both `kind` and `spoilerRisk` are
threaded through state and consumed by `searchNode` (query shaping +
`search_depth` choice), `assessNode` (loop length), and `streamAnswer` (tone
hint + spoiler-aware behavior).

**Why:** RPG questions are not all the same shape — build advice wants
options-with-tradeoffs; quest questions want a location lead; mechanics
want a concrete example. Putting these on the *decision* (one model call
that's already happening) keeps it free, and means every downstream node
has the classification available without re-asking. Spoiler risk lives there
too because the decide step is the only place that has both the question
and the player's progress context in one shot — perfect for inference.

**Tradeoff:** The decide prompt is heavier now and a flaky `generateObject`
loses both pieces of info. The catch falls back to `kind: 'other'`,
`spoilerRisk: 'minor'`, which is safe-but-bland.

---

## D13 · Source allowlist lives on `Game`, not `Playthrough`

**Decision:** `Game.sources?: GameSources` holds the per-game allowlist
(`include` ordered, `exclude` flat, `replaceDefaults` boolean). Playthroughs
of the same game share the same sources.

**Why:** A wiki recommendation is a property of the game, not the run —
if `taintedgrail.wiki.gg` is the best wiki for one playthrough of Tainted
Grail, it's the best wiki for every playthrough of Tainted Grail. Putting
sources on `Game` means setting them once benefits all current and future
runs. Avoids per-playthrough divergence (where two runs of the same game
mysteriously get different answers).

**Priority:** `include[]` is ordered; the post-search re-rank in
[`lib/tavily.ts`](../lib/tavily.ts) sorts results so higher-priority domains
get lower citation indices (and thus get cited first by the model). Tavily
has no native priority parameter — we do it client-side.

**Tradeoff:** If you ever wanted "this run trusts a niche fan wiki the
others don't," you'd need to add per-playthrough overrides. Not currently
needed; if asked for, layer `playthrough.sources` on top of `game.sources`
at resolve time.

---

## D14 · Edit/delete live in a Settings drawer; field inputs are extracted

**Decision:** New `PlaythroughSettingsDrawer` (sibling to MemoryPanel,
opened from a `quill-ink` icon button in the header) composes per-field
components from `components/playthrough/fields/` (`GameNameField`,
`PlaythroughNameField`, `CharacterFields`, `DifficultyField`,
`PlaystyleField`, `LocationField`). Onboarding and settings now consume
the same field components.

**Why:** Two reasons:

1. **Drawer over route** matches the existing app pattern (Memory is a
   drawer; Settings should feel like its sibling, not a context-switch to a
   different page).
2. **Extracted fields** were necessary the moment two places needed the
   same input. Previously the inputs were inlined in `NewPlaythroughFlow`
   only; copying them to the drawer would have been the most ad-hoc thing
   we could possibly do.

**Auto-save:** Field changes commit on blur via `updatePlaythrough` (same
inline pattern as the Memory panel — no Save button). Drafts live in local
state so each keystroke isn't a Dexie write.

**Game name** is intentionally read-only in the drawer — changing a
playthrough's game would also require migrating its memory's frame of
reference, which is out of scope; tell the user to create a new playthrough.

---

## D15 · New patterns become `components/shared/` primitives the first time they're needed twice

**Decision:** When this plan needed inputs in two places (onboarding +
settings), reorderable lists (sources), and chip-style tags (excluded
sources, suggestions), they were promoted to `components/shared/` as
`TextField`, `TextAreaField`, `SortableListRow`, and `Pill` — *not*
inlined again. Each was added to `/design` so it's visually documented.

**Why:** The "use the design system, don't ad-hoc UI" rule in CLAUDE.md is
only true if we keep promoting reusable patterns up the stack. Otherwise
they rot back into inline duplicates.

**Rule of thumb codified:** if the second consumer of an interactive style
shows up, extract before composing.

**Banned patterns the audit grep enforces** (in feature-layer files —
shared primitives may use raw elements internally):

- `<button>` elements (use `Btn` or `IconButton`)
- `border-radius` / `rounded-*` classes (everything's hard-edged)
- Hardcoded hex colors (use Tailwind theme classes or `lib/tokens.ts`)

---

## D16 · Rebranded from "Lorekeeper" to "Hearthnote"; IndexedDB name retained

**Decision:** The app's visible brand is **Hearthnote**. Visible strings
(header wordmark, `<title>`, `package.json` name, all doc front matter)
were updated in a single sweep. The **IndexedDB database is still named
`lorekeeper`** (`super("lorekeeper")` in
[`lib/db.ts`](../lib/db.ts)), and the historical planning artifacts under
`.claude/planning/` keep their original `lorekeeper-*` filenames.

**Why brand-only:** "Lorekeeper" was a working name and turned out to be
heavily used — a Final Fantasy ability, several WoW guild add-ons, multiple
itch.io games. See [`docs/naming.md`](./naming.md) for the shortlist
review; **Hearthnote** won (hearth = home/safe-room, note = the records
the player keeps).

**Why keep the IndexedDB name:** renaming the db would orphan existing
local data (every playthrough + session + memory block on every user's
machine). A migration is possible (open both dbs, copy across, delete the
old) but adds boot complexity and risks for zero visible benefit — users
never see the db name. Trade reads cleanly in favour of leaving it alone.

**Why keep `.claude/planning/lorekeeper-*` filenames:** historical
artifacts — the original spec and prototype. Renaming would break the
in-repo links and lose provenance.

**How to apply going forward:** any new user-facing text says "Hearthnote."
Old "Lorekeeper" mentions only legitimately survive in (a) the IndexedDB
name string, (b) planning-folder filenames, (c)
[`docs/naming.md`](./naming.md) and this entry as records of the rename.
A grep for `Lorekeeper` outside those locations is a regression.

---

## D17 · Fact-aware grounding loop + "refuse the unverified fact" voice

**Decision:** The agent now distinguishes *opinion* from *hard facts* and
refuses to assert the latter without a source.

- The old `assess` node ("is this enough?") became **`ground`**: a
  `generateObject` (`groundingSchema`) call that judges whether the retrieved
  sources actually establish the hard **facts** (what the subject does, its
  numbers/effects, where it is) — not just opinion. If they don't, it returns a
  definitional `nextQuery` with `nextQueryIsFactual: true` and the graph loops
  one more time.
- A **factual search pass** drops community/opinion domains
  (`resolveFactualDomains`, currently filters out `reddit.com`) and shapes the
  query toward "what it does", so the definitional wiki page wins.
- **`decide` force-searches every game-content kind** (`isGameContentKind` —
  everything except `meta`/`other`). A game question never answers "from
  memory."
- `MAX_SEARCHES` 2 → **3** so an opinion pass, a cross-ref pass, and a factual
  pass can coexist.
- The generate prompt ([`build-answer-prompt.ts`](../lib/build-answer-prompt.ts))
  gained a **grounding contract**: state mechanics/numbers/locations as fact
  *only* when a source backs them with `[n]`; if the sources are opinion-only,
  say plainly they don't confirm it and point to the wiki — still answering the
  groundable parts. The no-results branch for game-content kinds now *refuses
  the unverifiable specific* instead of the old "answer from training knowledge,
  no disclaimers" (the line that directly produced the bug below). Conversational
  kinds (meta/other) keep answering from general knowledge.

**Why:** A player asked "should I use the Prayer skill for my build?" and
gpt-oss confidently described Prayer as something it isn't, sourced from
training data. Root cause was twofold: (1) the build-shaped query retrieved 5
Reddit opinion posts and never the wiki page stating what Prayer does, and (2)
the prompt told the model to fill gaps from memory with no hedging. The model
backfilled the factual gap with a wrong "fact" and cited Reddit for tone — and
because `sources.length > 0`, even the "unsourced" badge stayed hidden. The
grounding loop fetches the missing facts; the contract stops the model asserting
what no source confirms.

**Voice choice (Andrew):** *refuse the factual part* — give grounded + opinion
answers, but decline to state unverified mechanics rather than hedge-and-assert.

**Tradeoff:** Up to one extra Tavily call + one extra `generateObject` on
build/boss/quest/lore questions (objective item/mechanic lookups still
short-circuit after one good wiki hit). Worth it — a wrong "fact" stated
confidently is the failure this tool most needs to avoid.

**Shared partition:** `CONVERSATIONAL_KINDS` / `isGameContentKind` now live in
[`schemas.ts`](../lib/agent/schemas.ts) and are imported by both the agent and
`AssistantMessage` (was a local copy in the component) so the "is this
game-content?" judgement can't drift between the prompt and the UI badge.

---

## D18 · Re-evaluated model-side search — still keep retrieval in code

**Decision:** Revisited the D2/D4 "the model never emits tool calls" rule while
fixing D17, since the obvious alternative ("just let the model search for the
facts itself") was on the table. Kept retrieval in code; gave the model agency
over *what we fetch next* through `generateObject` (the `ground` node) instead.

**Why, beyond the original Groq tool-call breakage:**

1. **Provider bifurcation.** The D2/D4 failures are provider-side 400s on the
   *default* free models (gpt-oss, llama). Native tool-search would only work on
   Anthropic — splitting behavior by provider for the exact feature meant to
   make answers *more* reliable.
2. **Citation stability.** Our `[n]` indices are assigned in code and re-ranked
   by the per-game domain priority list ([D13](#d13--source-allowlist-lives-on-game-not-playthrough),
   [`tavily.ts`](../lib/tavily.ts)). Model-driven tool calls would retrieve in an
   order we don't control, breaking stable, re-rankable citations.
3. **Same benefit without the risk.** The point was "the hard facts get
   fetched." The `ground` node achieves that deterministically via the one thing
   Groq is reliable at — structured JSON — with no tool-call surface.

**Empirical re-check (pending):** [`scripts/groq-toolcall-repro.ts`](../scripts/groq-toolcall-repro.ts)
probes whether current gpt-oss-120b still 400s when given a tool / a "search
tool" mention. It could **not** be run in the web sandbox (network policy blocks
`api.groq.com`; no `GROQ_API_KEY`). Run it locally to confirm; the decision
stands regardless on arguments 1–3.

---

## D19 · Anthropic prompt caching on the generate step only

**Decision:** Attach an ephemeral `cacheControl` breakpoint to the **system
prompt** and the **end of the conversation-history prefix** in `streamAnswer`
([`lib/agent/generate.ts`](../lib/agent/generate.ts)), gated to the Anthropic
provider via `isAnthropic()` ([`lib/provider.ts`](../lib/provider.ts)). The
current user turn — which carries the freshly-retrieved search results — is left
**uncached**.

**Why:** Token cost is dominated by the `generate` step's input (system + memory
+ history + injected results). The system prompt and history prefix repeat every
turn within a session, so caching them turns most of that input into ~10%-priced
cache reads. The search results differ every turn, so caching them would only
pay the write premium for no reuse — they stay out of the cached prefix (placed
last, after the breakpoint).

**Why generate-only:**
- The `decide`/`ground` `generateObject` prompts are small (~700–1000 tokens) —
  below Anthropic's **2048-token minimum cacheable prefix for Haiku** (1024 for
  Sonnet/Opus). They'd never cache, so we don't add the complexity.
- Even the generate prefix only clears the Haiku floor once a session's history
  grows, so caching is a **no-op on short chats** and an honest win mainly in
  longer sessions. Acceptable — it costs nothing when it doesn't apply.

**Why gated:** Groq has no cache-control concept; attaching `cacheControl` to a
Groq message is at best ignored and at worst an error. `isAnthropic()` also
returns false when the Anthropic key is missing (the call would fall back to the
default Groq model — see [D1](#d1--direct-provider-sdks-not-the-vercel-ai-gateway)),
so we never tag a request that won't actually hit Anthropic.

**Mechanism note:** Caching uses the AI SDK's
`providerOptions.anthropic.cacheControl: { type: 'ephemeral' }` on `ModelMessage`s
(not the raw Anthropic SDK's `cache_control` blocks). This required moving the
system prompt from the top-level `system` param into a `role: 'system'` message
so a breakpoint can sit on it. Default TTL (5m) — turns land within minutes.

**Tradeoff:** Default model is still Groq, so this is dormant until a playthrough
runs on Haiku/Sonnet. Shipped now as cheap, gated groundwork for the Claude
default discussed alongside this change.
