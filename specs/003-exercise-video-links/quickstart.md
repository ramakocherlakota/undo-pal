# Quickstart & Validation: Exercise Video Search Links

**Feature**: `003-exercise-video-links` | **Date**: 2026-07-21

How to run and validate the feature end-to-end. Assertions trace to [contracts/](./contracts/), [data-model.md](./data-model.md), and the spec's Success Criteria.

## Prerequisites

- Node.js ≥ 18 (for unit tests only; the app itself has no runtime dependencies).
- A modern browser (Safari/Chrome).
- Repo checked out on branch `003-exercise-video-links`.

## 1. Unit tests (pure URL logic)

```bash
npm test          # runs: node --test tests/*.test.js
```

**Expected**: all tests pass, including the new `tests/videoSearch.test.js`, which enforces [search-url-contract.md](./contracts/search-url-contract.md):
- URL starts with `https://www.youtube.com/results?search_query=`
- decoded `search_query` equals `"<name> exercise how to"`
- special characters (`"`, `/`, `,`, `!`, parentheses) are percent-encoded and round-trip correctly
- `new URL(...)` is valid for every representative name
- output is deterministic

## 2. Run the app

Serve the static files from the repo root (a server avoids ES-module `file://` restrictions):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

## 3. Manual validation scenarios

| # | Steps | Expected | Trace |
|---|-------|----------|-------|
| V1 | Load the page. Inspect any card's exercise. | Exercise name is a link (`<a class="exercise-link">`), visibly styled as a link. | U1, U7, SC-001 |
| V2 | Click an exercise name. | A **new tab** opens on a YouTube search for that exercise (`… exercise how to`); the app tab is unchanged with the same selections. | U2, U3, SC-002, FR-006 |
| V3 | Note a card's exercise, press its ↻ re-roll, click the new name. | The opened search matches the **newly shown** exercise (no stale link). | U4, SC-004 |
| V4 | Press "Randomize all", then click several exercise names. | Every opened search matches the exercise currently shown on that card. | U4, SC-004 |
| V5 | Tab with the keyboard to an exercise link; observe focus; press Enter. | Link receives a **visible focus outline** (light and dark), and Enter opens the search. | U6, U7 |
| V6 | Toggle OS dark mode and reload. | Link styling and focus indicator remain legible/visible in both themes. | U7 |
| V7 | On a 320px-wide viewport, view a long name (e.g. `Bobber Goblet Squat (side to side under imaginary bar)`). | Name wraps; no horizontal scrolling; link still activatable. | U7, Constraints |
| V8 | Click an exercise whose name has special characters (`12" sit to stand`, `1/2 kneeling chop/rotation`). | Search opens correctly for the intended exercise (URL well-formed). | FR-008, search-url-contract |
| V9 | Spot-check ambiguous names ("Superman", "Bicycle", "Bridge"). | Top results are the **exercise/movement** demonstrations, not the unrelated meaning. | SC-003, FR-003 |

## 4. Empty-state check (code path)

Every category in `data.js` currently has exercises, so `"No exercises available"` is **not reachable** through the UI. To confirm the non-link path (FR-005 / U5), temporarily set one category's `exercises` to `[]` in `src/data.js`, reload, and verify that card shows plain italic `"No exercises available"` with **no** `<a>` element. **Revert the change afterward.** (This is a manual verification aid, not a committed change.)

## Done / acceptance

- [ ] `npm test` green (includes `videoSearch.test.js`).
- [ ] V1–V9 pass.
- [ ] Empty-state code path verified (section 4) and revert confirmed.
- [ ] No console errors on load or interaction.
