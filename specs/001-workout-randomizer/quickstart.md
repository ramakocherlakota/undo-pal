# Quickstart & Validation: Daily Workout Randomizer

**Feature**: 001-workout-randomizer

Runnable steps that prove the feature works end-to-end. Assumes the implementation exists per [plan.md](./plan.md) (files at repo root: `index.html`, `styles.css`, `src/`, `tests/`, `deploy/`). References [contracts/](./contracts/) and [data-model.md](./data-model.md) rather than restating details.

## Prerequisites

- A modern browser.
- Node.js ≥ 18 (only to run the unit tests; the app itself needs no Node).
- To exercise ES modules locally you need to serve over HTTP (not `file://`). Any static server works, e.g. Python's built-in one.
- For deployment: AWS CLI v2 configured (see [deployment-contract.md](./contracts/deployment-contract.md)).

## 1. Run the unit tests (pure logic)

```bash
node --test tests/*.test.js
# or: npm test
```

**Expected**: all tests pass (16 checks), covering (per [data-model.md](./data-model.md) "Derived operations"):
- `pickRandom` returns `null` for an empty list, the sole item for a 1-item list, and a member for larger lists.
- `pickRandom` with `exclude` never returns the excluded value when the list has > 1 item.
- `reselectOne` changes only the target category and (for lists > 1) changes its value.
- `reconcile` keeps still-valid stored values, replaces removed ones, drops unknown categories, and yields `null` for empty categories.

## 2. Run the app locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000 in a browser
```

### Scenario A — First-time visit (User Story 1 / SC-001)
1. Open a fresh browser profile or clear `localStorage` for the origin.
2. Load the page.
3. **Expected**: one card per configured category (Leg, Core, Arm, Hernia by default), each showing exactly one exercise, within ~1s. No manual step required.

### Scenario B — Randomize all (User Story 2 / SC-002)
1. Note the current exercises.
2. Tap **Randomize all** a few times.
3. **Expected**: every card updates on each tap; over repeated taps the shown exercises vary (for categories with > 1 exercise).

### Scenario C — Randomize a single workout (User Story 3 / SC-003)
1. Note all current exercises.
2. Tap the re-roll button on one card (e.g., Leg) several times.
3. **Expected**: only that card changes; all other cards stay identical. For a list with > 1 item, the value differs from the previous one on each tap (avoid-immediate-repeat, Decision 3).

### Scenario D — Persistence across visits (User Story 4 / SC-004)
1. Randomize to a known state; note all exercises.
2. Fully close the tab/window (or reload).
3. Reopen the page.
4. **Expected**: the exact previously shown selections reappear (not a fresh random set).
5. Inspect `localStorage` key `workout-randomizer:v1` (DevTools → Application → Local Storage) and confirm it matches the [storage-contract.md](./contracts/storage-contract.md) schema.

### Scenario E — Graceful degradation & edge cases
- **Stale value**: In `src/data.js`, remove the exercise currently stored for one category, reload → that category shows a fresh valid exercise; others unchanged.
- **New/removed category**: Add a category to `src/data.js` and reload → the new category gets a fresh selection; removing one drops it (its stored entry is ignored) — demonstrates SC-006 (data-only change).
- **Empty category**: Set a category's `exercises` to `[]` → that card shows the "No exercises available" placeholder, re-roll is a no-op, and other cards still work (FR-012).
- **Storage blocked**: In DevTools, block/deny storage (or use a private window with storage disabled) → the app still renders and re-rolls for the session without errors; it simply doesn't persist.

### Scenario F — Mobile layout (SC-005)
1. Open DevTools device toolbar; set width to 320px.
2. **Expected**: single-column layout, no horizontal scrolling, all buttons tappable (≥44px targets) per [ui-contract.md](./contracts/ui-contract.md).

## 3. Deploy to S3 (FR-014 / SC-007)

Follow [deployment-contract.md](./contracts/deployment-contract.md):

```bash
export BUCKET=daily-workout-randomizer-<suffix>
export REGION=us-east-1
# one-time: mb, website config, public-read policy (see contract)
aws s3 sync . s3://$BUCKET --exclude "*" --include "index.html" --include "styles.css" --include "src/*" --delete
```

**Expected**: opening `http://$BUCKET.s3-website-$REGION.amazonaws.com` on a phone shows a working routine with re-roll and persistence, and no back end running.

## Success mapping

| Scenario | Validates |
|----------|-----------|
| 1 | FR-003, FR-012, reconcile/selection logic |
| A | US1, FR-001/004, SC-001 |
| B | US2, FR-005, SC-002 |
| C | US3, FR-006, SC-003 |
| D | US4, FR-007/008/009, SC-004 |
| E | FR-002/008/012, Edge Cases, SC-006 |
| F | FR-010, SC-005 |
| 3 | FR-013/014, SC-007 |
