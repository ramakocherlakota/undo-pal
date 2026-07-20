# Data Model: Daily Workout Randomizer

**Feature**: 001-workout-randomizer
**Date**: 2026-07-20

All data is client-side and in-memory, with the selection state mirrored to `localStorage`. There is no server schema. Entities below map to the spec's Key Entities and drive `src/data.js`, `src/selection.js`, `src/reconcile.js`, and `src/storage.js`.

## Entities

### Category (configuration data)

A named group of candidate exercises. Defined in `src/data.js` as the single source of truth (FR-002, SC-006). The authoritative exercise content is supplied by the user in [`workouts.md`](./workouts.md) — 5 categories (`arms`, `legs`, `core`, `hernia`, `cardio`), ~188 exercises total — and is transcribed into `src/data.js` during implementation (T002).

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | Required. Stable, unique key used to correlate persisted selections with config (e.g., `"leg"`, `"core"`, `"arm"`, `"hernia"`). Must not change when display name changes. |
| `name` | string | Required. Human-readable label shown on the card (e.g., `"Leg"`). |
| `exercises` | string[] | Required (may be empty). Ordered list of candidate exercise texts. Duplicates allowed but discouraged. |

**Constraints**:
- The category set is ordered; display order follows array order in `data.js`.
- `id` values must be unique across the configured categories.
- An empty `exercises` array is valid and must render a placeholder, not an error (FR-012).

**Example** (`src/data.js`):

```js
export const CATEGORIES = [
  { id: "leg",     name: "Leg",     exercises: ["20 bodyweight squats", "30s wall sit", "walking lunges x10"] },
  { id: "core",    name: "Core",    exercises: ["30s plank", "15 dead bugs", "20 bicycle crunches"] },
  { id: "arm",     name: "Arm",     exercises: ["10 push-ups", "12 dips", "15 band curls"] },
  { id: "hernia",  name: "Hernia",  exercises: ["diaphragmatic breathing x10", "gentle pelvic tilts x10"] },
];
```

### Exercise

A single workout task belonging to a category. Modeled as a plain string within `Category.exercises` (no separate object needed for v1). Its identity for reconciliation is its exact string value.

### SelectionState (runtime + persisted)

The current routine: exactly one chosen exercise per configured category. This is what renders on screen, what is persisted, and what is updated on every re-roll.

**In-memory shape**: a map keyed by category `id`.

| Field | Type | Rules |
|-------|------|-------|
| `<categoryId>` | string \| null | The chosen exercise text for that category. `null` only when the category's list is empty (placeholder shown). |

**Persisted shape** (`localStorage`, one key — see [storage-contract.md](./contracts/storage-contract.md)):

```json
{
  "version": 1,
  "selections": {
    "leg": "30s wall sit",
    "core": "30s plank",
    "arm": "10 push-ups",
    "hernia": "gentle pelvic tilts x10"
  },
  "updatedAt": "2026-07-20T14:03:00.000Z"
}
```

**Constraints / invariants**:
- After load + reconcile, `selections` has exactly one entry per currently configured category (`null` allowed only for empty categories).
- `selections` never contains keys for categories not present in the current config (they are dropped on reconcile).
- A stored value that is no longer in its category's `exercises` list is replaced with a fresh valid selection on load (FR-008, Edge Cases).
- `version` gates future migrations; unknown/greater versions fall back to a fresh selection.

## Derived operations (pure functions)

These define behavior; full implementation lives in the code, not here.

### `pickRandom(exercises, opts?) → string | null`
- Returns `null` if `exercises` is empty.
- Returns the sole item if length is 1.
- Otherwise returns a uniformly random item; if `opts.exclude` is provided and the list has >1 item, the returned item is guaranteed `!== opts.exclude` (avoid-immediate-repeat, Decision 3).
- Accepts an injectable `opts.rng` (defaulting to `Math.random`) for deterministic tests.

### `selectAll(categories, opts?) → SelectionState`
- Produces a fresh `SelectionState` by calling `pickRandom` for each category.

### `reselectOne(state, categories, categoryId) → SelectionState`
- Returns a new state identical to `state` except `categoryId`, which is re-picked excluding the current value. All other categories unchanged (FR-006, SC-003).

### `reconcile(categories, storedSelections) → SelectionState`
- For each configured category: keep the stored value iff it still exists in `exercises`; otherwise pick fresh. Empty categories → `null`. Drops stored keys for unknown categories (Decision 4).

## State transitions

```text
App load
  │
  ├─ read localStorage
  │     ├─ present & parseable & version==1 → reconcile(config, stored.selections) → SelectionState
  │     └─ missing / unparseable / version mismatch → selectAll(config) → SelectionState   [FR-004, FR-008]
  │
  ├─ render SelectionState  ────────────────────────────────────────────────┐
  │                                                                          │
  ├─ user taps "Randomize all"   → selectAll(config)      → persist → render │
  ├─ user taps category re-roll  → reselectOne(state, id) → persist → render │
  └─ (persist failures are swallowed; session continues)  ───────────────────┘
```
