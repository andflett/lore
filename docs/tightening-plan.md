# Tightening plan

Observations from a visual review of `/design` and the live app after the
last design pass (overlay unification, prototype-style bubbles + input,
texture pulled back to chrome, form primitives added). Each item is a small,
independent improvement — pick them off ad-hoc, in any order. Nothing here is
a bug; everything is "could read tighter."

Organised by impact: **High** items shape the feel of the whole app and pay
back most; **Medium** are visible-but-localised; **Low** are details to
revisit when nothing else is louder.

---

## High impact

### 1. `/design` is now out of sync with the live UI

The "Sample message bubble (with citation)" section in
[`app/design/page.tsx`](../app/design/page.tsx) is still the *old* design —
gold-bordered rectangles, no role pip, no warm assistant background. The live
bubbles now use a thick side accent + role pip + warm parchment bg. Anyone
reading `/design` would learn the wrong style.

**Proposal:** delete the inline sample from `app/design/page.tsx` and import
`MessageBubble` directly so the design page renders the *real* component.
Same logic for any other section that hand-rolled what's now a primitive
(scan for inline `border-2 border-gold-b2` etc.). Going forward, the rule for
`/design` is "showcase the real component, never re-style."

### 2. Empty-state for an empty session feels stranded

"Ask anything about diablo 2 resurrected." sits mid-screen in dim grey, no
icon, no anchor, and renders the game name in whatever case the user typed
(today: lowercase). Currently in
[`components/chat/SessionView.tsx`](../components/chat/SessionView.tsx).

**Proposal:** a small empty-state component with a centred GameIcon (e.g.
`crystal-ball` at ~32px), the prompt above it in body-text size, the game
name title-cased, and maybe 3–4 starter-question chips below ("Where do I
find...", "How do I beat...", "What's a good build for..."). Even just the
icon + title-case would lift it.

### 3. Header icon button gap

Four icon buttons in the header (`open-book`, `quill-ink`, `sunrise`,
`moon-bats`) sit flush against one another. Visually crowded on mobile;
they read as a single mass.

**Proposal:** `gap-1.5` or `gap-2` on the `headerRight` flex container in
[`components/playthrough/PlaythroughClient.tsx`](../components/playthrough/PlaythroughClient.tsx).
Also worth considering: a tiny vertical hairline (gold-b1, 1px wide, full
button height) between the *primary* trio (memory / settings / new session)
and *destructive/contextual* end-session. Visual grouping at almost no cost.

### 4. Tooltip positioning drift

"MEMORY" tooltip on a right-aligned header button currently floats *down-left*
toward the page centre rather than straight below the trigger. BaseUI's
`Positioner` defaults to side-collision-aware placement.

**Proposal:** Pass `align="center"` (already default) and `side="bottom"`
(already set), but also pass `collisionAvoidance="auto"` with explicit padding
so it nudges in-place instead of pivoting. Or pre-empt collisions: header
tooltips on the right-side cluster should default to `side="bottom"` with
`align="end"` so they extend left from the trigger rather than centre over
the chat.

### 5. Bottom-chrome top edge competes with the answer

The chrome bar around `ChatInput` adds `inset 0 1px 0 rgba(200,146,26,0.10)`
which puts a thin warm line at the top of the bar. Combined with the 2px
solid gold border above it, the chrome reads as two-line-thick, and steals
focus from the answer text just above when scrolling.

**Proposal:** drop the inset highlight (the `border-t-2 border-gold` alone is
plenty), or replace it with a softer `rgba(200,146,26,0.04)` so it whispers
rather than punctuates.

---

## Medium impact

### 6. Read-only "Game" field in Settings drawer

The drawer's first field is the game name, with helper text "Game name can't
be changed once set." The field is visually identical to the editable ones —
nothing signals it's read-only until the user tries.

**Proposal:** add an `disabled` / `readonly` variant to `TextField` that
lowers opacity to 0.6 and locks the cursor to `not-allowed`. Pass it for the
Game field. Could also hide the helper text once they've absorbed it —
collapse-on-focus or show on hover only.

### 7. Stone texture still painted behind the chat empty state

`AppShell` paints `stoneSurface("recessed")` on the **whole** main area.
That's fine when messages fill it, but with an empty session it's a lot of
texture for one line of text.

**Proposal:** move the recessed surface from `AppShell`'s main wrapper to
only the message-scroll region inside `SessionView`. The outer main becomes
plain `bg-void` / `bg-stone-s0`, with texture only where messages stack.
Smaller texture footprint, cleaner empty state.

### 8. Source-list rows shift affordance after reorder

In the Settings drawer Sources section, defaults render *without* a Remove ×
when untouched (they're locked). But the moment the user reorders any
default, all defaults gain Remove × (they're now in user `include[]`). The
shift is jarring — affordances should change for a reason the user can read.

**Proposal:** show a small `(default)` `Pill muted` next to default-origin
domains *always*, regardless of whether they've been materialised into
`include[]`. Then the Remove × can be present from the start, and the
"default" pill subtly explains the row's origin.

### 9. Source-row "TOP PRIORITY" label wraps for long domains

A row like "very-long-wiki-name-here.fextralife.com" pushes the "· TOP
PRIORITY" label below the domain. Looks broken on the priority row only.

**Proposal:** right-align the "TOP PRIORITY" label on the row (push it to
the far right, before the move/remove buttons). Or move it above the list as
a section sub-label: "These domains are searched in priority order — top
first."

### 10. Onboarding background reads as flat black

`NewPlaythroughFlow` wraps the page in `stoneSurface("recessed")`. The
overlay is so dark (52–66% black on top of the texture) that the texture is
nearly imperceptible — the screen looks like solid `#0a0a0a`.

**Proposal:** drop to `stoneSurface("mid")` so the texture is faintly visible
and the page has the same "you're inside a carved hall" feel as the rest of
the app. The Panel will still pop because its noise-tex + gradient is
brighter than mid.

### 11. Settings drawer section spacing

Sections use `space-y-5` (20px) between, headings use `mb-1.5` (6px) to their
fields. The rhythm is correct (section-gap > head-to-field-gap) but `mb-1.5`
feels glued. `mb-2` (8px) without changing `space-y-5` breathes a touch more.

### 12. Markdown `<hr>` before SourcesFooter could be ornamental

`MarkdownAnswer`'s `hr` override is a plain `border-t` rule. The app has a
nicer `Divider` (gold-b3 with a tiny centre diamond) used everywhere else.

**Proposal:** swap the `hr` override to render `<Divider color="var(--color-gold-b1)" />`
for inline-content dividers within answers, consistent with the rest of the
overlays.

### 13. Sidebar mobile drawer has no close affordance

On mobile the sidebar opens as a slide-in drawer (left side) and only
dismisses via the dark backdrop. No visible "×" inside. New users on mobile
often try to find a close button before tapping outside.

**Proposal:** add an `IconButton icon="cancel"` at the top-right of the
mobile sidebar drawer. Hidden via `md:hidden` so it doesn't affect desktop.

### 14. Form primitive contrast in the warm-gradient drawer

`CheckField` / `RadioField` use `border-gold-b2` outlines and a `gold-b3`
filled marker. Against the *warm-gradient* drawer background (rather than
flat stone-s0 they appear on in `/design`), the contrast drops. The
unchecked state in particular is easy to miss.

**Proposal:** bump the outline to `border-gold-b3` (or `border-gold` when
unchecked), and the filled marker to `bg-gold` (full saturation). Optionally
add a faint inset shadow on the box so it feels recessed.

---

## Low impact

### 15. Role pip on user message is tiny on mobile

5×5 px to the right of a wide bubble at 390px width is almost invisible. The
prototype likely had this at the same size but on a larger screen.

**Proposal:** keep at 5×5 on `md+`, bump to 6×6 on mobile via `h-1.5 w-1.5
md:h-[5px] md:w-[5px]`. Or replace with a small SVG diamond (echoing
`CornerDeco`) that reads better at small size.

### 16. Pill remove × is faint

`text-gold-b2` on a 10px `cancel` icon next to a 13px label is hard to spot.

**Proposal:** baseline `text-gold-b3`, hover `text-blood`. One token darker
on baseline gives the affordance more weight without screaming.

### 17. Citation `[n]` tap target

The citation link is `text-[10px]` superscript. On mobile, taps regularly
miss. The visible glyph can stay at 10px, but the `<a>` should have
`px-1 -mx-1 py-1 -my-1` so the touch target is ~24×24.

### 18. Message bubble side padding

Bubbles + role pip can sit flush against the right (user) or left (assistant)
edge of the messages scroll region. Adds visual cramping at small widths.

**Proposal:** add `px-1` inside the scroll region wrapper so the role pip
breathes a hair off the edge.

### 19. Empty session prompt should title-case the game

`Ask anything about ${game.name}.` — `diablo 2 resurrected` would read better
as `Diablo 2 Resurrected` (only in this display, not in storage). Same logic
for the header's game references.

**Proposal:** a small `titleCase()` helper in `lib/text.ts` (probably with a
hand-tuned small-words list — "of", "the", "and"). Apply only at display, not
at write.

### 20. ModelPicker label layout

`Crystal-ball icon · MODEL` label row in `MemoryPanel` feels heavy: 14px
icon + 9px Cinzel uppercase on the same line as the field's 13px text.

**Proposal:** put label above field with `space-y-1.5` (already structured
that way after the SelectField refactor). Tighten the icon alignment to
`items-baseline` so the icon visually sits with the caps.

---

## Process / convention notes

### 21. `/design` should render real components, not re-style them

The drift on the message-bubble sample (item 1) is a symptom — `/design`
currently re-implements pieces of UI to "preview" them. That guarantees
they go stale. Going forward, every section in `/design` should *import the
real component* and feed it props. If a component needs a different layout
for the design page (e.g. shown without the surrounding chrome), that's a
prop on the real component, not a re-implementation.

Add to [`docs/conventions.md`](./conventions.md): "`/design` showcases real
components — never re-implement, always import."

### 22. Visual-regression spot-check before merging design changes

A few of these (texture audit, divider duplication, tooltip arrows, message
bubble shape) would have been caught instantly by a side-by-side screenshot
diff. There's no automated visual regression yet — but a manual checklist
in `docs/local-dev.md` ("Visual review: open these 6 pages on mobile width
and walk through this list") would be a low-cost guardrail.

Suggested checklist:
- `/design` — all primitives render and look on-brand
- `/new` — onboarding panel reads against the page bg
- Active playthrough — empty session, with chat, both bubble types
- Memory drawer — open + add a block
- Settings drawer — open + change a field + sources reorder
- Modal — open the delete confirmation, then cancel

Five minutes per release, catches everything in the High and Medium lists.

---

## Out of scope (deliberately)

Not in this plan because they're feature work, not tightening:
- Streaming-token animation on assistant bubbles
- Memory proposal toast position on tall scrolls
- Mobile-keyboard handling for the chat input (visualViewport jitter)
- Skeleton/loading states for the Memory drawer's live data

Those go in regular feature tickets when their time comes.
