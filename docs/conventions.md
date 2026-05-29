# Conventions

Rules to keep the codebase tidy as it grows. If you're iterating ad-hoc, these
are the things that drift first — re-read before adding new components or
styles.

---

## Design system: DRY, theme-driven, small files

These three are the user's standing preferences (set early; non-negotiable):

1. **Maintainable, predictable, DRY.** Extract reusable components into
   `components/shared/` rather than repeating markup. If you find yourself
   inlining a stone-with-gold-border-and-padding `<div>` for the third time,
   that's a component.
2. **Always use theme values.** Tailwind classes for everything (`text-text-t1`,
   `bg-stone-s0`, `border-gold-b2`). For JS-side inline styles where you can't
   use a class (gradients, multi-layer box-shadows), import from
   [`lib/tokens.ts`](../lib/tokens.ts) — never hardcode hex. The CSS `@theme`
   block in [`app/globals.css`](../app/globals.css) is the source of truth;
   `tokens.ts` mirrors it for JS.
3. **Keep React files small.** Prefer multiple pure components over one
   bloated file. If a component file is over ~150 lines, split. Examples:
   `SessionView` orchestrates, but `MessageBubble`, `AssistantMessage`,
   `UserMessage`, `MarkdownAnswer`, `SourcesFooter`, `AgentProgress`,
   `ChatInput` are all their own files.

---

## File / folder rules

- **All DB writes go through `lib/db.ts`.** Components never call
  `db.table.put/update/delete` directly. Helpers there (`appendMessage`,
  `addMemoryBlock`, `updatePlaythrough`, etc.) maintain invariants like
  `updatedAt` bumping. Reads via `useLiveQuery` are fine inline.
- **All AI calls go through `lib/agent/`** (chat) **or `app/api/session-end/route.ts`**
  (one-shot). Don't add ad-hoc `streamText`/`generateObject` calls elsewhere
  — extend the agent.
- **All model ids live in `lib/models.ts`.** Adding a new model is one entry
  in `MODELS` + (if a new provider) a case in `lib/provider.ts`.
- **Theme tokens in two places, kept in sync:** `app/globals.css` (`@theme`)
  for CSS, `lib/tokens.ts` for JS. If you change one, change the other.

---

## Visual rules

- **No `border-radius` anywhere.** Everything hard-edged. The aesthetic is
  carved-stone-with-gilded-edges; rounded corners break it.
- **Two fonts only:** `Cinzel` (`.font-ui`) for caps chrome labels (panel
  titles, button text, section headers); `Crimson Text` (default) for body.
- **Letter-spacing for Cinzel** should be in the `0.12em–0.22em` range —
  larger sizes get larger spacing. Set via `style={{ letterSpacing: '...' }}`
  or `tracking-[...]`.
- **Use `stoneSurface(elevation)`** for any panel/sheet/header background:
  `raised` (chrome highlights), `mid` (neutral), `recessed` (message wall),
  `deep` (modals/drawers).
- **Use `Panel`** for any boxed content with the gilded border treatment.
  It comes with corner rivets and the multi-layer shadow already.
- **Use `Btn`** with one of the variants (`metal`, `confirm`, `dim`,
  `danger`, `default`) instead of building buttons from scratch. Size is
  `sm | md | lg`. `icon` boolean for square icon-only buttons.
- **For an icon button with tooltip**, use `IconButton` — it wires
  `aria-label` + `Tooltip` correctly. Don't roll your own.
- **For form inputs**, use the dedicated primitives — never an unstyled
  `<input>` / `<select>` / native checkbox / radio. All apply the same
  hard-edged gold-bordered treatment so forms read as one family:
  - `TextField` — single-line text
  - `TextAreaField` — multi-line text
  - `SelectField<T extends string>` — themed `<select>` with custom arrow
  - `CheckField` — checkbox with a gold check-mark fill
  - `RadioField<T extends string>` — radio with a gold inner-square fill
- **For chip-style tags** (e.g. categories, domain pills), use `Pill`.
  Has an optional `onRemove` for removable chips and a `muted` style for
  locked/default items.
- **For ordered reorderable lists**, use `SortableListRow`. Provides drag-to-
  reorder (HTML5 DnD) plus up/down arrow buttons as a touch-friendly
  fallback. Parent owns the array and reorder logic.
- **For destructive actions**, use `Btn variant="danger"` inside a `Modal`
  for confirmation. Two-step pattern: open the modal, then click "Delete
  forever".
- **For section headings inside drawers/modals/panels**, use `SectionLabel`
  — small Cinzel caps, gold by default, `tone="blood"` for danger zones.
  Never hand-roll a Cinzel uppercase `<h3>` again.

---

## `/design` discipline

The `/design` route showcases **real components**, never re-implementations.
When you build a new primitive, add it to `/design` by importing it
directly — don't paste markup that "looks like" the primitive. This
guarantees the design page can never drift from the live component as the
component evolves.

If you find yourself wanting to "preview a different state" of a component
in `/design`, the right answer is to drive that state with props on the
*real* component, not to inline a styled placeholder.
- **Motion**: keep durations short (100–200ms). RPG UIs are snappy. Panel
  entrances fade-in-from-y, modals scale 0.96→1, sidebar slides x.

---

## Assets

- **Textures** live in `public/textures/`. Currently:
  - `rough-stone.jpg` — the chrome stone texture used by `stoneSurface()`.
  - `sidebar-pattern.png` *(optional)* — a tileable CC0 pattern that
    paints behind the **messages region** via the `.message-overlay` rule
    in [`app/globals.css`](../app/globals.css). (The filename is legacy;
    rename when convenient — keep the CSS url in sync.) Drop one in at
    ~80–160px and tune `opacity` / `background-size` to taste. The
    overlay gracefully renders without it. Sidebar uses the dark
    `stoneSurface("recessed")` directly — no pattern.
  - **Sourcing**: prefer CC0 from
    [OpenGameArt](https://opengameart.org/content/cc0-backgrounds),
    [Patternlet](https://patternlet.com),
    [Subtle Patterns](https://www.toptal.com/designers/subtlepatterns/).
    Don't generate patterns with code — find a real asset.
- **Icons** in `public/icons/` are single-path SVGs with no fill — see
  [`docs/local-dev.md`](./local-dev.md) for adding one.

---

## Code style

- TypeScript strict; no `any` without a comment explaining why.
- Prefer `interface` for object shapes used as component props/state.
- Pure functions in `lib/` should be testable in isolation — no React
  imports, no Dexie calls inside them. `build-system-prompt.ts`,
  `parse-citations.ts`, `parse-proposals.ts` are examples.
- Comments: only the WHY when non-obvious. Skip "renders the user message"
  on `UserMessage`. Write "Groq's tool-call validator rejects parallel calls
  mid-stream; force serial." on the non-obvious config.
- No multi-line comment blocks. One short line max.
- Don't write CSS modules. Tailwind classes + occasional `style={...}` for
  dynamic values (e.g. `stoneSurface(elevation)`).
