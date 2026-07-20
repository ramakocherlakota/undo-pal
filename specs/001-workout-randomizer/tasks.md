---
description: "Task list for Daily Workout Randomizer implementation"
---

# Tasks: Daily Workout Randomizer

**Input**: Design documents from `/specs/001-workout-randomizer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Unit tests ARE included for the pure logic modules (`selection.js`, `reconcile.js`) because plan.md (Testing) and research.md (Decision 6) explicitly require `node --test` coverage, and quickstart.md §1 runs them. DOM rendering, persistence round-trip, and responsive layout are validated manually via quickstart.md (no automated UI tests in scope).

**Organization**: Tasks are grouped by user story so each can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Exact file paths are included in each description

## Path Conventions

Static single-page app at repository root (per plan.md Structure Decision): `index.html`, `styles.css`, `src/`, `tests/`, `deploy/`. No build step.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project skeleton

- [X] T001 Create the static-site skeleton at repo root: create directories `src/`, `tests/`, `deploy/`, and empty placeholder files `index.html` and `styles.css`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Config data and pure selection logic that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Create `src/data.js` exporting `CATEGORIES` — an ordered array of `{ id, name, exercises[] }` for leg, core, arm, hernia with example exercises, per data-model.md. This is the single source of truth for categories/exercises (FR-002, SC-006).
- [X] T003 [P] Create pure selection module `src/selection.js` implementing `pickRandom(exercises, { exclude, rng })` (empty→`null`, single-item→that item, otherwise uniform random; when `exclude` set and list length>1 the result differs from `exclude`; `rng` defaults to `Math.random` and is injectable) and `selectAll(categories, { rng })` returning a `SelectionState` map, per data-model.md (FR-003, FR-004, Decision 3). No DOM, no storage imports.
- [X] T004 [P] Create `tests/selection.test.js` (`node --test`) covering `pickRandom` (empty→null, single item, uniform membership, `exclude` never returned for lists>1 using a deterministic `rng`) and `selectAll` (one entry per category, `null` for empty category), per quickstart.md §1.

**Checkpoint**: Config + core randomization exist and are unit-tested — user stories can begin.

---

## Phase 3: User Story 1 - See today's workout at a glance (Priority: P1) 🎯 MVP

**Goal**: On opening the app, the user immediately sees one randomly chosen exercise per configured category in a friendly, mobile layout — auto-generated on first visit.

**Independent Test**: Clear storage, load the page → exactly one exercise (or placeholder) renders per category within ~1s, with no manual action (quickstart.md Scenario A).

- [X] T005 [P] [US1] Create `index.html` shell: page `<title>` and friendly heading (e.g., "Today's Workout"), a `<main id="app">` mount point, link to `styles.css`, and `<script type="module" src="src/app.js"></script>`, per contracts/ui-contract.md.
- [X] T006 [P] [US1] Create mobile-first `styles.css`: single-column stack of category cards, ≥44×44px tap targets, no horizontal scroll down to 320px, readable contrast (WCAG AA), optional max-width container on wide screens, per contracts/ui-contract.md (FR-010, SC-005).
- [X] T007 [US1] Create `src/app.js`: import `CATEGORIES` and `selectAll` from `src/data.js`/`src/selection.js`; on `DOMContentLoaded` compute an initial `SelectionState` via `selectAll(CATEGORIES)` and render one card per category into `#app` (category name + selected exercise). Empty-list categories render a "No exercises available" placeholder; each card exposes its selection to assistive tech (`aria-live="polite"`). (FR-001, FR-004, FR-011, FR-012) — depends on T002, T003, T005, T006.

**Checkpoint**: MVP — a complete random routine renders on load. Fully demoable/deployable on its own.

---

## Phase 4: User Story 2 - Randomize everything at once (Priority: P2)

**Goal**: A single "Randomize all" control re-selects every category at once.

**Independent Test**: With cards displayed, tap Randomize all repeatedly → every card updates each tap and values vary over taps (quickstart.md Scenario B).

- [X] T008 [US2] Add a primary "Randomize all" button (in `index.html` markup or rendered by `src/app.js`) and wire its click handler in `src/app.js` to recompute `selectAll(CATEGORIES)` and re-render all cards. (FR-005, SC-002) — depends on T007.

**Checkpoint**: US1 + US2 both work — user sees a routine and can re-roll the whole set.

---

## Phase 5: User Story 3 - Randomize a single workout (Priority: P2)

**Goal**: Each category has its own re-roll button that changes only that category, avoiding an immediate repeat.

**Independent Test**: Tap one card's re-roll several times → only that card changes and its value differs each tap (for multi-item lists); all other cards unchanged (quickstart.md Scenario C).

- [X] T009 [US3] Add `reselectOne(state, categories, categoryId, { rng })` to `src/selection.js`: return a new `SelectionState` identical to `state` except `categoryId`, re-picked via `pickRandom` with `exclude` = the current value; other categories untouched; empty category stays `null`. (FR-006, Decision 3) — depends on T003.
- [X] T010 [US3] Add `reselectOne` cases to `tests/selection.test.js`: only the target key changes, its value differs for lists>1 (deterministic `rng`), and an empty category yields `null`. — depends on T009.
- [X] T011 [US3] In `src/app.js` render, add a per-category re-roll button to each card with an accessible name (e.g., `aria-label="Randomize Leg"`); wire its handler to `reselectOne` and update only that card's exercise text; disable/no-op the button for empty categories. (FR-006, FR-012, SC-003) — depends on T007, T009.

**Checkpoint**: US1 + US2 + US3 all independently functional.

---

## Phase 6: User Story 4 - Keep my selections between visits (Priority: P3)

**Goal**: The most recent selections persist in the browser and are restored (reconciled against current config) on reopen; storage failures degrade gracefully.

**Independent Test**: Randomize to a known state, close/reload, reopen → the same selections reappear; blocking storage still lets the app run for the session (quickstart.md Scenarios D & E).

- [X] T012 [P] [US4] Create `src/storage.js` with `loadState()` (read/parse key `workout-randomizer:v1`; return `null` on missing/unparseable/non-object/`version!==1`/blocked storage; never throws) and `saveState(selectionState)` (write `{ version:1, selections, updatedAt }`; swallow quota/disabled errors), per contracts/storage-contract.md (FR-007).
- [X] T013 [P] [US4] Create `src/reconcile.js` with `reconcile(categories, storedSelections)`: keep stored values still present in a category's `exercises`, re-pick removed/missing ones via `selectAll`/`pickRandom`, drop entries for unknown categories, `null` for empty categories, per data-model.md (FR-008, Decision 4). Pure; no DOM/storage.
- [X] T014 [P] [US4] Create `tests/reconcile.test.js` (`node --test`): keep valid stored value, replace a value no longer in the list, drop an unknown-category entry, and yield `null` for an empty category. — depends on T013.
- [X] T015 [US4] Update `src/app.js` load + mutation flow: on load call `loadState()`; if present, render `reconcile(CATEGORIES, stored.selections)`, else `selectAll(CATEGORIES)`; call `saveState(currentState)` after every Randomize-all (T008) and per-category re-roll (T011). (FR-007, FR-008, FR-009, SC-004) — depends on T007, T008, T011, T012, T013.

**Checkpoint**: All four user stories independently functional; selections persist across visits.

---

## Phase 7: Polish, Deployment & Cross-Cutting

**Purpose**: Deployment tooling, full validation, and docs

- [X] T016 [P] Create `deploy/bucket-policy.json`: public-read `s3:GetObject` policy template (with `BUCKET_NAME` placeholder), per contracts/deployment-contract.md.
- [X] T017 [P] Create `deploy/deploy.sh`: idempotent `aws s3 sync . s3://$BUCKET` with `--exclude "*"` + explicit `--include` for `index.html`, `styles.css`, `src/*`, and `--delete`; include commented one-time `mb`/`website`/`put-bucket-policy` steps, per contracts/deployment-contract.md (FR-014).
- [X] T018 [P] Create `README.md` at repo root: local run instructions (`python3 -m http.server 8000`), test command (`node --test tests/`), and deploy pointer to the deployment contract.
- [X] T019 Run `node --test tests/` and confirm all `selection.js` and `reconcile.js` tests pass (quickstart.md §1).
- [X] T020 Execute quickstart.md Scenarios A–F manually (first visit, randomize-all, single re-roll, persistence/reload, edge cases — stale value/new+removed category/empty list/storage blocked, 320px mobile layout) and confirm each expected outcome.
- [X] T021 Deploy to S3 per contracts/deployment-contract.md and verify the site loads and functions (routine renders, re-roll + persistence work) on a phone at the website endpoint with no back end running (FR-013, FR-014, SC-007).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phases 3–6)**: All depend on Foundational. US2, US3, US4 also touch `src/app.js` created in US1, so in a single-developer flow they proceed in order US1 → US2 → US3 → US4. The pure new-file tasks (T009 selection.js edit, T012/T013 new modules, their tests) can be built ahead of the `app.js` wiring.
- **Polish (Phase 7)**: Deployment/validation depend on the desired stories being complete; T016–T018 (deploy files/README) can be authored anytime after Setup.

### User Story Dependencies

- **US1 (P1)**: After Foundational. No dependency on other stories. MVP.
- **US2 (P2)**: After Foundational; extends US1's `app.js` (T007).
- **US3 (P2)**: After Foundational; adds `reselectOne` (T009, independent of US1) then wires into US1's render (T011 needs T007).
- **US4 (P3)**: After Foundational; new modules T012/T013 are independent, but the wiring T015 integrates US1 (T007), US2 (T008), and US3 (T011) handlers.

### Within Each User Story

- Pure logic + its tests before the `app.js` wiring that uses it.
- `index.html`/`styles.css` before `app.js` render (T007).

### Parallel Opportunities

- **Foundational**: T002, T003, T004 are all different files → run in parallel.
- **US1**: T005 (`index.html`) and T006 (`styles.css`) in parallel; T007 after both.
- **US4**: T012 (`storage.js`) and T013 (`reconcile.js`) in parallel; T014 after T013; T015 after all.
- **Polish**: T016, T017, T018 in parallel.

---

## Parallel Example: Foundational Phase

```bash
# Different files, no interdependencies — build together:
Task: "Create src/data.js exporting CATEGORIES"          # T002
Task: "Create src/selection.js (pickRandom, selectAll)"  # T003
Task: "Create tests/selection.test.js"                   # T004
```

## Parallel Example: User Story 1

```bash
# Shell and styles are independent files:
Task: "Create index.html shell"   # T005
Task: "Create mobile-first styles.css"  # T006
# Then wire the render:
Task: "Create src/app.js load→selectAll→render"  # T007
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1.
4. **STOP and VALIDATE**: quickstart Scenario A (fresh load shows a full routine).
5. Deploy the MVP (Phase 7 T016/T017/T021) if desired — a random daily routine already delivers value.

### Incremental Delivery

1. Foundation ready (Phases 1–2).
2. + US1 → validate → deploy (MVP: see today's workout).
3. + US2 → validate → randomize-all.
4. + US3 → validate → per-category re-roll.
5. + US4 → validate → persistence across visits.
6. Polish + deploy verification (Phase 7).

### Total: 21 tasks

- Setup: 1 (T001)
- Foundational: 3 (T002–T004)
- US1: 3 (T005–T007)
- US2: 1 (T008)
- US3: 3 (T009–T011)
- US4: 4 (T012–T015)
- Polish/Deploy: 6 (T016–T021)

---

## Notes

- [P] tasks = different files, no dependency on an incomplete task.
- Pure modules (`selection.js`, `reconcile.js`) take an injectable `rng` so tests are deterministic — verify tests fail before implementing if practicing TDD.
- `src/app.js` is edited across US1–US4; those tasks are intentionally sequential (same file) to avoid conflicts.
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.
