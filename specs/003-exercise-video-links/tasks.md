---
description: "Task list for Exercise Video Search Links implementation"
---

# Tasks: Exercise Video Search Links

**Input**: Design documents from `/specs/003-exercise-video-links/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: A unit test IS included for the new pure module (`src/videoSearch.js`) because plan.md (Testing), research.md, and quickstart.md §1 require `node --test` coverage, and contracts/search-url-contract.md defines explicit test obligations. DOM rendering, new-tab behavior, keyboard access, theming, and re-roll freshness are validated manually via quickstart.md (no automated UI tests in scope).

**Organization**: Tasks are grouped by user story so each can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Exact file paths are included in each description

## Path Conventions

Existing static single-page app at repository root (per plan.md Structure Decision): `index.html`, `styles.css`, `src/`, `tests/`, `deploy/`. No build step, no new runtime dependencies.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a known-good baseline before changing anything

- [X] T001 Run `npm test` (`node --test tests/*.test.js`) from repo root and confirm the existing `selection.test.js` and `reconcile.test.js` suites pass, establishing a green baseline before changes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure video-search URL builder that BOTH user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Create pure module `src/videoSearch.js` exporting `videoSearchUrl(name)` that returns `https://www.youtube.com/results?search_query=<encoded>` where the decoded `search_query` equals `` `${name} exercise how to` ``; encode the whole query (via `encodeURIComponent` or `URL`/`URLSearchParams`) so quotes, slashes, parentheses, commas, and `!` produce a valid URL. Pure, synchronous, no DOM/storage imports. Per contracts/search-url-contract.md and data-model.md (VideoSearchLink, rules R2/R3).
- [X] T003 [P] Create `tests/videoSearch.test.js` (`node --test`) covering the 5 obligations in contracts/search-url-contract.md: URL prefix, decoded `search_query` starts with the name and ends with ` exercise how to`, special characters (`"`, `/`) are percent-encoded and round-trip correctly, `new URL(...)` is valid for the representative names, and determinism.
- [X] T004 Run `npm test` and confirm the new `videoSearch.test.js` cases pass (alongside the existing suites). — depends on T002, T003.

**Checkpoint**: `videoSearchUrl` exists and is unit-tested — user stories can begin.

---

## Phase 3: User Story 1 - Look up how to perform the shown exercise (Priority: P1) 🎯 MVP

**Goal**: Each card's exercise name renders as a link that opens a video search for that exercise; the empty state stays plain text.

**Independent Test**: Load the app → every card showing an exercise presents it as a link; clicking one opens a new-tab YouTube search for that exercise while the app tab keeps its selections (quickstart.md V1–V2).

- [X] T005 [P] [US1] Add a `.exercise-link` rule to `styles.css` that makes the exercise visibly a link within the existing `.exercise` type scale, with `:hover` and `:focus-visible` states and a focus indicator visible in both light and dark themes (use the existing `--accent`/theme custom properties; no hardcoded theme colors); ensure long names still wrap with no horizontal scroll at 320px. Per contracts/ui-contract.md §Styling (FR-007).
- [X] T006 [US1] Modify `src/app.js`: import `videoSearchUrl` from `./videoSearch.js` and update `applyExerciseText(el, value)` so that for a non-null `value` it renders `<a class="exercise-link" href="videoSearchUrl(value)" target="_blank" rel="noopener noreferrer">value</a>` (built with `createElement`/`textContent`/`setAttribute`, not `innerHTML`), and for `null` it renders plain text `"No exercises available"` with the `exercise-empty` class and **no** anchor; clear the element's contents before inserting so nothing stacks. Keep the `<p class="exercise" aria-live="polite">` wrapper. Per contracts/ui-contract.md (U1–U3, U5, U8) and data-model.md rules R1/R5/R6/R7. — depends on T002.

**Checkpoint**: MVP — on load, exercise names are working video-search links; empty categories show plain text. Independently demoable/deployable.

---

## Phase 4: User Story 2 - Link stays correct after re-randomizing (Priority: P2)

**Goal**: After a single-category re-roll or "Randomize all", every card's link `href` and text match the exercise currently shown — no stale or duplicated links.

**Independent Test**: Re-roll a category (and use "Randomize all"), then click the new names → each opened search matches the currently displayed exercise (quickstart.md V3–V4).

- [X] T007 [US2] In `src/app.js`, confirm the update path routes through the updated `applyExerciseText`: `onReroll`→`updateCard` and `onRandomizeAll`→`updateCard` must rebuild each affected card's exercise element from the current `state[categoryId]` so the link's `href`+text refresh and the previous anchor is fully replaced (no leftover/duplicate nodes). Adjust `updateCard` if needed so it clears and re-renders rather than appends. Per contracts/ui-contract.md (U4) and data-model.md rule R4 (FR-004). — depends on T006.

**Checkpoint**: US1 + US2 both work — links are correct on first render and after any re-randomization.

---

## Phase 5: Polish & Cross-Cutting

**Purpose**: Full validation and ship

- [X] T008 Run `npm test` and confirm all suites pass (`selection`, `reconcile`, `videoSearch`), per quickstart.md §1.
- [X] T009 Execute quickstart.md manual scenarios V1–V9 (link rendering, new-tab open with state preserved, re-roll freshness, randomize-all freshness, keyboard focus/Enter, dark/light theming, 320px wrap, special-character names, ambiguous-name result quality) and the §4 empty-state code-path check (temporarily set one category's `exercises` to `[]`, verify no anchor, then **revert**); confirm each expected outcome and no console errors.
- [ ] T010 [P] Deploy the change via `deploy/deploy.sh` and verify on the live site that exercise names are links and open the correct video search (final ship step; optional if not deploying now).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS both user stories.
- **User Stories (Phases 3–4)**: Both depend on Foundational. US2 extends the same `src/app.js` update path that US1 establishes, so in a single-developer flow they proceed US1 → US2.
- **Polish (Phase 5)**: Depends on the desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: After Foundational. No dependency on other stories. MVP.
- **US2 (P2)**: After Foundational; builds on US1's `applyExerciseText` change (T006) via the `updateCard` path.

### Within Each User Story

- The pure module + its tests (Foundational) precede the `app.js` wiring that imports it.
- `styles.css` (T005) and the `app.js` render change (T006) are different files; T006 depends on T002 (needs `videoSearchUrl`), not on T005.

### Parallel Opportunities

- **Foundational**: T002 (`src/videoSearch.js`) and T003 (`tests/videoSearch.test.js`) are different files → run in parallel; T004 after both.
- **US1**: T005 (`styles.css`) can run in parallel with T006 (`src/app.js`).
- **Polish**: T010 (deploy) is independent of the test/validation tasks once they pass.

---

## Parallel Example: Foundational Phase

```bash
# Different files, no interdependencies — build together:
Task: "Create src/videoSearch.js (pure videoSearchUrl)"   # T002
Task: "Create tests/videoSearch.test.js"                   # T003
# Then verify:
Task: "Run npm test; confirm videoSearch cases pass"       # T004
```

## Parallel Example: User Story 1

```bash
# Styling and rendering live in different files:
Task: "Add .exercise-link styling to styles.css"           # T005
Task: "Render exercise as <a> in src/app.js applyExerciseText"  # T006
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1.
4. **STOP and VALIDATE**: quickstart V1–V2 (names are links; clicking opens the correct search in a new tab, app state preserved).
5. Deploy the MVP (T010) if desired — clickable how-to links already deliver the feature's value.

### Incremental Delivery

1. Foundation ready (Phases 1–2, unit-tested URL builder).
2. + US1 → validate → deploy (MVP: exercise names are video-search links).
3. + US2 → validate → links stay correct after re-roll / randomize-all.
4. Polish: full test run + quickstart pass + deploy verification.

### Total: 10 tasks

- Setup: 1 (T001)
- Foundational: 3 (T002–T004)
- US1: 2 (T005–T006)
- US2: 1 (T007)
- Polish: 3 (T008–T010)

---

## Notes

- [P] tasks = different files, no dependency on an incomplete task.
- `videoSearchUrl` is pure (no DOM/storage), so its tests are deterministic — assert on the **decoded** `search_query`, not the exact escaping of spaces (`%20` vs `+` are both acceptable per the contract).
- `src/app.js` is edited by both US1 (T006) and US2 (T007); those tasks are intentionally sequential (same file) to avoid conflicts.
- The empty state is not reachable with current `data.js` (every category has exercises); T009 §4 verifies the non-link code path with a temporary, reverted data edit.
- No new runtime dependencies and no build step are introduced; new files ship as-is via the existing `deploy/` sync.
- Commit after each task or logical group; stop at the US1 checkpoint to validate/ship the MVP independently.
