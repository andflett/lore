# Lorekeeper

A local-first gaming companion. Per-playthrough memory in IndexedDB; chat is a
LangGraph agent that searches the web (Tavily) and answers with citations.
Active iterative development — Andrew often picks up small changes ad-hoc,
sometimes from mobile, so always read the orientation below before making
non-trivial changes.

## Start here

If you are a fresh Claude session picking this up, read these in order:

1. **[docs/architecture.md](../docs/architecture.md)** — what the app is, stack,
   folder layout, data model, the LangGraph agent (with diagram), routes, the
   chat stream protocol.
2. **[docs/decisions.md](../docs/decisions.md)** — *why* we made specific
   choices (direct providers vs Vercel Gateway, LangGraph vs in-model tools,
   markdown typography, etc.). Read before changing any of those areas.
3. **[docs/conventions.md](../docs/conventions.md)** — DRY rules, theme tokens,
   small files, visual rules (no border-radius, two fonts, surface helpers).
4. **[docs/local-dev.md](../docs/local-dev.md)** — env keys, default model,
   common tweaks (add a model / icon / category, wipe IndexedDB).
5. **[docs/known-issues.md](../docs/known-issues.md)** — Groq quirks (reasoning
   channel, tool-call failures, json_schema support), workarounds applied.
6. **[docs/tightening-plan.md](../docs/tightening-plan.md)** — proposed visual
   improvements (contrast, spacing, polish). Read before doing UI polish so
   you don't redo work that's already queued.

## Reference

- **[.claude/planning/lorekeeper-spec.md](./planning/lorekeeper-spec.md)** — the
  original full spec. The shipping app diverges in a few places (direct
  providers, LangGraph instead of in-model tool calling, current model
  versions); see [docs/decisions.md](../docs/decisions.md) for what changed
  and why.
- **[.claude/planning/lorekeeper-prototype.jsx](./planning/lorekeeper-prototype.jsx)**
  — visual reference only. Tokens and component patterns were re-implemented
  cleanly; the prototype is not used at runtime.

## House rules

- **All DB writes go through `lib/db.ts`.** Components never call
  `db.table.*` directly.
- **All theme values come from `@theme` (CSS) or `lib/tokens.ts` (JS).** No
  hardcoded hex in components.
- **Small, single-purpose React files.** Extract into `components/shared/` if
  it's reused.
- **No `border-radius` anywhere.** Hard-edged is the aesthetic.
- **`/design` is the visual sandbox.** Use it when iterating on the look.
- **Mobile-first.** Sidebar is a drawer on mobile, fixed on `md+`.

## Use the design system. Do not ad-hoc UI.

Every new piece of UI must compose existing primitives from
[`components/shared/`](../components/shared/) rather than invent its own
markup. **This is non-negotiable** — ad-hoc styled `<div>`s and one-off
`<button>`s rot the visual language. Before writing any UI:

1. Check [`components/shared/`](../components/shared/) for a primitive that
   already does it: `Panel`, `PanelTitle`, `Divider`, `Btn`, `IconButton`,
   `GameIcon`, `Tooltip`, `Drawer`, `Modal`, `Spinner`, `CornerDeco`.
2. Check [`docs/conventions.md`](../docs/conventions.md) for the visual rules
   (surface helpers `stoneSurface`/`frameShadow`, palette tokens, typography,
   no border-radius).
3. Browse [`/design`](http://localhost:3000/design) in the running app to see
   what's already styled.
4. **If a primitive is missing**, add it to `components/shared/` (themed,
   reusable, named clearly) before composing it in the feature. Then add it
   to `/design` so it's documented in the sandbox.

Banned patterns:
- Hand-rolling a `<button>` element. Use `Btn` or `IconButton`.
- Hand-rolling a modal, dialog, or drawer. Use `Modal` or `Drawer`.
- Hand-rolling a bordered surface. Use `Panel` (with corners) or
  `stoneSurface()` (without).
- Hardcoded hex colors anywhere in components. Use Tailwind theme classes or
  `lib/tokens.ts`.
- `border-radius` of any value other than 0.
- Inline copies of an interactive control that already exists in a sibling
  file. Extract and share.

When you submit a meaningful UI change, also update `/design` if you added a
new primitive, and append to [`docs/conventions.md`](../docs/conventions.md)
if you established a new pattern.

## When you finish a meaningful change

Update the relevant doc:

- Architecture or stack shift → [docs/architecture.md](../docs/architecture.md)
- A reasoned tradeoff worth remembering → append a numbered entry to
  [docs/decisions.md](../docs/decisions.md)
- A convention that's now actually being followed → bake it into
  [docs/conventions.md](../docs/conventions.md)
- A new gotcha you'd want to find later → add to
  [docs/known-issues.md](../docs/known-issues.md)

Keep entries small and dated implicitly (the git history). The goal is that
any future session — yours or another Claude's, on a laptop or a phone — can
read these and be productive without re-deriving everything.
