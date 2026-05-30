# Known issues / gotchas

Things to watch out for, with workarounds where they exist. Useful when a
flaky behavior shows up and you're trying to remember "is this me or is this
the model again?"

---

## Groq

### gpt-oss-120b emits zero text-deltas without `reasoningFormat: 'parsed'`

**Symptom:** Agent runs, search completes, "Writing answer…" shown, but the
assistant bubble is empty.

**Cause:** gpt-oss is a reasoning model. With heavy context and default
settings, all output goes to the reasoning channel — `text-delta` count = 0.

**Fix already applied** in [`lib/agent/generate.ts`](../lib/agent/generate.ts):
```ts
providerOptions: { groq: { reasoningFormat: 'parsed', reasoningEffort: 'low' } }
```

Both options are needed. If you ever change the model in
[`lib/agent/generate.ts`](../lib/agent/generate.ts), revisit.

---

### `"Tool choice is none, but model called a tool"`

**Symptom:** Server log shows this error during a generate call (or worse —
silently swallows and the bubble is empty).

**Cause:** gpt-oss interprets any mention of "tool", "search tool", "function"
in the system prompt as license to emit a tool call. We pass no tools, so
Groq returns 400.

**Fix already applied:** The generate step uses
[`buildAnswerPrompt`](../lib/build-answer-prompt.ts) (no tool mentions)
instead of [`buildSystemPrompt`](../lib/build-system-prompt.ts) (legacy, with
tool instructions). If you change the prompt, **don't reintroduce tool
language** in the generate path.

---

### `"Failed to call a function"` on llama-3.3 when given tools

**Symptom:** Won't appear in the current architecture (we don't pass tools to
models). Would appear if you reverted to in-model tool calling.

**Cause:** llama-3.3 on Groq cannot emit valid tool-call JSON reliably.

**Fix:** Don't pass `tools` to a Groq llama model. Use the LangGraph
retrieve-in-code pattern, or switch to Claude for tool use.

---

### llama-3.3 doesn't support `json_schema` structured output

**Symptom:** `generateObject` throws `"This model does not support response
format 'json_schema'"`.

**Cause:** Per Groq's structured-outputs docs, only some models support
json_schema. llama-3.3 isn't one of them; gpt-oss-120b is.

**Fix:** Use gpt-oss-120b (the default) for `generateObject` paths (decide,
assess, session-end). If you really need a non-supporting model in those
paths, the docs say to pass `providerOptions: { groq: { structuredOutputs:
false } }` and prompt the model to mention "JSON". We don't bother.

The agent nodes already have try/catch that falls through safely if
`generateObject` errors — the decide node falls to "search anyway"
(see [decisions.md D3](./decisions.md)) and assess falls to "enough
context."

---

### Vercel AI Gateway free tier rate-limits (429)

**Symptom:** Would appear as `"Free tier requests on this model are
rate-limited, including via BYOK"`.

**Cause:** Account-level throttle on Vercel's AI Gateway free plan.

**Fix:** Not relevant — we don't use the gateway. If a future change
reintroduces it, you'll hit this within ~5 requests. See
[decisions.md D1](./decisions.md).

---

## Agent / streaming

### Answers come back "unsourced" and citations disappear

**Symptom:** Most answers show no sources and no `[n]` citations, even though
the progress steps said "Found N sources…". Worst on build/boss/quest/lore
questions.

**Cause:** `agentGraph.stream()` yields **per-node deltas**, not accumulated
state (verified: a node returning `["b1"]` after one that returned
`["a1","a2"]` streams `{b:{results:["b1"]}}`, not the merged list). The stream
bridge used to shallow-merge each delta into `finalState`, so
`finalState.results` kept only the **last** search's batch. Since most
question kinds run a second search (see `SHOULD_DO_SECOND_SEARCH` in
`lib/agent/nodes.ts`), the second batch overwrote the first — and a narrower
second query that returned nothing left `results` empty, so no `sources` event
fired and the generate step fell back to the no-results prompt.

**Fix applied** in [`lib/agent/stream-bridge.ts`](../lib/agent/stream-bridge.ts):
accumulate `update.results` into a running array (mirroring the graph's
`results` reducer) instead of relying on the shallow merge. If you add another
node that returns an accumulating annotation, accumulate it in the bridge the
same way — don't read it off `finalState`.

**Related:** [`SourcesFooter`](../components/chat/SourcesFooter.tsx) used to
show *only* sources the model cited inline, so a model that retrieved sources
but under-cited (common on gpt-oss low-effort) hid them entirely. It now falls
back to listing what was consulted ("Sources consulted") when nothing was
cited. Inline `[n]` adherence is still model-dependent — Claude cites most
reliably (see `lib/models.ts` notes); gpt-oss at `reasoningEffort: 'low'` is
the weakest. Bump effort if inline citations matter more than latency.

---

## Anthropic

### Claude Pro ≠ API access

**Symptom:** `"Anthropic API key is missing"` even though you have a Claude
subscription.

**Cause:** A claude.ai Pro subscription does NOT include API access. The
Anthropic **API** is billed separately (https://console.anthropic.com,
pay-as-you-go credits).

**Fix:** Get an API key from the console. Until you do,
[`lib/provider.ts`](../lib/provider.ts) falls back to the default Groq model
when a Claude id is selected — the app still works.

---

## Browser / Dexie

### Dexie writes appearing twice

**Symptom:** User message appears twice in the conversation.

**Cause:** Either the form's button defaulted to `type="submit"` (so click
fires `onClick` AND form `onSubmit`), or you literally clicked Send twice
while the UI was busy.

**Status:** `Btn` defaults to `type="button"`, so the form-submit double-fire
is prevented. If you build a new form, make sure submit buttons explicitly
opt in to `type="submit"`.

### Auto-resume picks a stale "today" session

**Symptom:** Reopening the app lands on a session you didn't expect.

**Cause:** `PlaythroughClient.useEffect` looks for the first session whose
`startedAt` is on the current calendar date and isn't ended — first match
wins. If you created multiple sessions today, you get the oldest.

**Fix if needed:** Filter to `lastSessionId` first, then fall back to
"newest today." Not currently a real problem — leaving as-is.

---

## Markdown rendering

### Citation links rendered inside elements where they shouldn't be

**Symptom:** A `[5]` inside a `<code>` block becomes a link.

**Cause:** The `linkify()` helper in
[`MarkdownAnswer`](../components/chat/MarkdownAnswer.tsx) is wired into every
inline element override. If you add a new override (e.g. `kbd`, `sub`, `sup`)
and pass children through `linkify`, it'll linkify there too.

**Fix when it bites:** For elements where citations don't make sense (code
blocks, etc.), pass `children` through without `linkify`. The current
overrides do this for `code`/`pre`/`blockquote`.

---

## BaseUI Tooltip

### Tooltip doesn't show on touch / disappears on first tap

**Status:** Not observed yet, but BaseUI tooltips on touch devices generally
need an explicit `hoverable={false}` or a fallback. If users report this,
check the [BaseUI Tooltip docs](https://base-ui.com/components/react-tooltip).
