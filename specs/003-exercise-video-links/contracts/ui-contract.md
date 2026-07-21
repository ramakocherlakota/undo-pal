# Contract: Card exercise link (UI/DOM)

**Owner**: `src/app.js` (rendering) + `styles.css` (styling) | **Feature**: `003-exercise-video-links`

Defines the observable DOM contract for how each card presents its exercise, replacing the current plain-text `<p class="exercise">…</p>` content.

## Rendered structure

**When a card has a selected exercise (`state[categoryId] != null`):**

```html
<p class="exercise" aria-live="polite">
  <a class="exercise-link"
     href="https://www.youtube.com/results?search_query=…"
     target="_blank"
     rel="noopener noreferrer">Hammer curl</a>
</p>
```

- `href` = `videoSearchUrl(name)` (see [search-url-contract.md](./search-url-contract.md)).
- Link text = the exercise name, verbatim.
- The `<p class="exercise" aria-live="polite">` wrapper is **retained** as the live region.

**When a card has no exercise (`state[categoryId] == null`):**

```html
<p class="exercise exercise-empty" aria-live="polite">No exercises available</p>
```

- No `<a>`. Plain text only. (FR-005 / data-model R5)

## Behavioral requirements

| ID | Requirement | Trace |
|----|-------------|-------|
| U1 | Exercise name renders as an activatable `<a>`, not plain text. | FR-001 |
| U2 | Activating the link opens the exercise's YouTube video search. | FR-002 |
| U3 | Link opens in a new tab (`target="_blank"`) with `rel="noopener noreferrer"`; the app tab/state is unaffected. | FR-006, research D3 |
| U4 | On single-category re-roll and "Randomize all", the link's `href` and text update to match the newly displayed exercise (no stale link). | FR-004 |
| U5 | Empty state renders `"No exercises available"` as plain text with **no** anchor. | FR-005 |
| U6 | Link is keyboard-focusable, activatable with Enter, and announced as a link by assistive tech (native `<a>` semantics; no custom key handling). | FR-007 |
| U7 | Link is visually distinguishable from surrounding text and shows a visible focus indicator on keyboard focus. | FR-007 |
| U8 | The `<p aria-live="polite">` container is preserved so exercise changes remain announced. | Existing behavior |

## Styling contract (`styles.css`)

- Add a `.exercise-link` rule so the link is visibly a link while fitting the card's existing type scale (the `.exercise` size/weight is retained on the text). Provide `:hover` and `:focus-visible` states; the focus indicator must be visible in both light and dark themes.
- Must not introduce horizontal scrolling at 320px; long names continue to wrap (`word-break` behavior inherited from `.exercise` is preserved).
- Must respect the existing dark/light CSS custom properties (use `--accent` etc.; do not hardcode theme colors).

## Rendering-path notes (implementation guidance, not asserted)

- The existing `applyExerciseText(el, value)` in `app.js` is the single choke point for both initial render and `updateCard` (re-roll / randomize-all). Updating it to build an `<a>` (or clear to plain text for `null`) satisfies U1–U5 in one place and preserves U4 automatically, since `updateCard` already re-invokes it.
- Build the anchor with DOM APIs (`createElement`, `textContent`, `setAttribute`) rather than `innerHTML` to avoid injection and keep encoding correct.
