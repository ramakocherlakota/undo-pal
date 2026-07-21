# Phase 1 Data Model: Exercise Video Search Links

**Feature**: `003-exercise-video-links` | **Date**: 2026-07-21

This feature introduces **no new persisted data** and changes **no stored schema**. `data.js` (categories/exercises) and the `localStorage` selection state are unchanged. The only "new" concept is a *derived* value — a video search URL computed from an exercise name at render time. This document captures that derivation and its rules.

## Entities

### Exercise (existing, unchanged)

The named movement currently selected for a category — the string already displayed on a card.

| Attribute | Type | Notes |
|-----------|------|-------|
| name | string | e.g. `"Hammer curl"`, `12" sit to stand`. Sourced verbatim from `data.js`. Used as both the visible link text and the search subject. |

No fields are added. The current selection remains `Record<categoryId, exerciseName \| null>` in memory and in `localStorage`.

### VideoSearchLink (new, derived — not persisted)

A value object computed on the fly from an `Exercise.name`. It exists only in the DOM as an anchor's `href`/text; it is never stored.

| Attribute | Type | Derivation |
|-----------|------|------------|
| query | string | `` `${name} exercise how to` `` (fixed context suffix — see research Decision 2) |
| href | string (URL) | `https://www.youtube.com/results?search_query=<encodeURIComponent(query)>` |
| text | string | The exercise `name`, shown verbatim as the link label |

**Producer**: `videoSearchUrl(name)` in `src/videoSearch.js` (pure; returns `href`). See [contracts/search-url-contract.md](./contracts/search-url-contract.md).

## Validation & derivation rules

- **R1 — Non-empty selection ⇒ link.** When `state[categoryId]` is a non-null exercise name, the card renders an `<a>` whose `href = videoSearchUrl(name)` and whose text is `name`. (FR-001, FR-002)
- **R2 — Context always included.** The query is never the bare name; the fixed `" exercise how to"` suffix is always appended. (FR-003)
- **R3 — Full encoding.** The entire query is URL-encoded so quotes, slashes, parentheses, commas, and other punctuation produce a valid `href` targeting the intended exercise. (FR-008)
- **R4 — Freshness.** The `href` and text are recomputed from the currently displayed exercise whenever a card updates (single re-roll or "Randomize all"); no stale link may remain. (FR-004)
- **R5 — Empty state ⇒ no link.** When `state[categoryId]` is `null`, the card renders plain text `"No exercises available"` with **no** anchor. (FR-005)
- **R6 — New tab, hardened.** Anchors use `target="_blank"` and `rel="noopener noreferrer"` so following them preserves the app's state. (FR-006)
- **R7 — Native link semantics.** The link is a real `<a>` (focusable, keyboard-activatable, announced as a link), styled to be visually distinguishable, inside the existing `aria-live="polite"` container. (FR-007)

## State transitions

The selection state machine is unchanged (initial select → re-roll one → randomize all → persist). The only addition is that each render/update of a card's exercise element **also** recomputes the derived `VideoSearchLink` from the (possibly new) selected name:

```
selected name changes (init | reselectOne | selectAll)
        │
        ▼
card exercise element re-rendered
        ├─ name != null → <a href=videoSearchUrl(name)>name</a>   (R1–R4, R6, R7)
        └─ name == null → "No exercises available" (plain text)    (R5)
```

## Non-goals (explicitly not modeled)

- No stored mapping of exercise → video/URL (links are derived, never persisted).
- No new categories, exercises, or config keys.
- No change to randomization, reconciliation, or persistence logic.
