# Storage Contract: Daily Workout Randomizer

**Feature**: 001-workout-randomizer

Defines the browser persistence contract implemented by `src/storage.js`. Persistence is per-device, per-browser (Decision 2).

## Key

- **Store**: `window.localStorage`
- **Key**: `workout-randomizer:v1`  (namespaced + versioned)

## Value schema (JSON string)

```json
{
  "version": 1,
  "selections": {
    "<categoryId>": "<exercise text>"
  },
  "updatedAt": "<ISO-8601 timestamp>"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `version` | integer | Schema version. Current: `1`. |
| `selections` | object | Map of category `id` → selected exercise text. May omit categories that were empty at save time. |
| `updatedAt` | string (ISO-8601) | Timestamp of last write. Informational. |

## API (module functions)

| Function | Behavior | Failure handling |
|----------|----------|------------------|
| `loadState()` | Read + `JSON.parse` the key. Return the parsed object, or `null` if the key is missing, unparseable, not an object, or `version !== 1`. | Never throws. On any error (including `localStorage` access blocked), returns `null`. |
| `saveState(selectionState)` | Serialize `{ version: 1, selections, updatedAt: now }` and write to the key. | Never throws. On failure (quota exceeded, storage disabled), swallow the error; the app continues for the current session (FR degrade, SC unaffected). |

## Behavioral rules

1. **Fallback on load failure**: If `loadState()` returns `null`, the app generates a fresh routine via `selectAll(config)` (FR-004, FR-008).
2. **Reconcile after load**: A non-null `loadState()` result is passed through `reconcile(config, stored.selections)` before rendering; the loader never trusts stored values blindly (Decision 4). Reconciliation may add/replace values without immediately re-persisting (persist happens on next user action) — acceptable because a subsequent load will reconcile again.
3. **Write triggers**: `saveState` is called after every successful `selectAll` (randomize-all) and `reselectOne` (per-category re-roll) (FR-009).
4. **No PII**: Only exercise selection text and a timestamp are stored. No user identifiers, no analytics.
5. **Corruption tolerance**: Any malformed stored value is treated as absent (returns `null`), never surfaced as an error to the user (Edge Cases).

## Versioning / migration

- The key embeds the schema version (`:v1`) and the payload repeats it (`version: 1`) so future changes can migrate or discard cleanly.
- v1 has no migration logic: a mismatched version is treated as "no valid state" → fresh selection.
