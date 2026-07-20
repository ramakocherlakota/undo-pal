# Feature Specification: Daily Workout Randomizer

**Feature Branch**: `001-workout-randomizer`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "Create a single-page web app that selects workouts for me to do every day. I'll provide lists of tasks, one for each of leg, core, arm and hernia, but the app should be flexible enough to have more or fewer lists. These lists will be hard-coded in the app, no need to do any fancy fetching from a back end. The basic goal is to select a random value from each list and display it in a friendly UI. There should be a button to randomize all of the workouts. There should also be a button for each workout just to randomize that one, in case I'm bored of a particular workout or it uses equipment that's not available. Persist the most recent workout selections in browser-level persistence so that if I close the window and open it again the selection is still available. Mobile-friendly layout for phone use. Deploy to an AWS S3 bucket configured for hosting."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See today's workout at a glance (Priority: P1)

The person opens the app on their phone and immediately sees one chosen exercise for each workout category (for example leg, core, arm, hernia), presented in a clear, friendly layout. If they have never used the app before, a selection is chosen for them automatically so they always have something to do.

**Why this priority**: This is the core value of the app — turning several lists of possible exercises into one concrete, decided routine for the day. Without this, nothing else matters.

**Independent Test**: Open the app with no prior data and confirm that exactly one exercise per category is displayed, each drawn from that category's list, in a readable layout.

**Acceptance Scenarios**:

1. **Given** a first-time visitor with no saved selections, **When** they open the app, **Then** one exercise is shown for every configured category, each chosen from that category's list.
2. **Given** the app is displaying selections, **When** the visitor reads the screen, **Then** each selection is clearly labeled with its category name and the chosen exercise.
3. **Given** a category whose list contains a single exercise, **When** the app selects for that category, **Then** that one exercise is shown.

---

### User Story 2 - Randomize everything at once (Priority: P2)

The person wants a completely fresh routine, so they tap a single "randomize all" control and every category is re-selected at once.

**Why this priority**: Re-rolling the full routine is the primary interaction after the initial view and directly supports daily variety, but the app is still usable (showing a routine) without it.

**Independent Test**: With selections displayed, tap the randomize-all control and confirm every category shows a newly chosen exercise from its list.

**Acceptance Scenarios**:

1. **Given** selections are displayed, **When** the person activates the randomize-all control, **Then** every category is re-selected from its list and the display updates.
2. **Given** a category list has more than one exercise, **When** randomize-all is used repeatedly, **Then** the selected exercise varies over repeated uses (not fixed to one value).

---

### User Story 3 - Randomize a single workout (Priority: P2)

The person is bored of one particular exercise, or it needs equipment they don't have right now, so they re-roll just that one category without disturbing the others.

**Why this priority**: A key convenience the user explicitly called out; it makes the routine practical when one item doesn't fit the day, but the app still delivers value with only whole-routine randomization.

**Independent Test**: With selections displayed, activate the per-category control for one category and confirm only that category's exercise changes while all others stay the same.

**Acceptance Scenarios**:

1. **Given** selections are displayed, **When** the person activates the randomize control for one category, **Then** only that category's selection changes and all other categories remain unchanged.
2. **Given** a category list has more than one exercise, **When** its single-category randomize control is used, **Then** a value from that category's list is shown (with no immediate value change appearing "stuck" on the same item across repeated uses).

---

### User Story 4 - Keep my selections between visits (Priority: P3)

The person closes the browser or navigates away, then returns later and finds the same routine they last saw, so they can pick up where they left off during the day.

**Why this priority**: Persistence improves continuity across the day, but the app already delivers a valid routine on every visit even without remembering prior selections.

**Independent Test**: Randomize selections, fully close the app/tab, reopen it, and confirm the previously shown selections reappear rather than a fresh random set.

**Acceptance Scenarios**:

1. **Given** selections are displayed and the person closes the app, **When** they reopen it later on the same device and browser, **Then** the most recently shown selections are restored.
2. **Given** stored selections exist, **When** the person randomizes (all or one category), **Then** the stored selections are updated to reflect the new choices.
3. **Given** stored data cannot be read or is missing/corrupted, **When** the app opens, **Then** it falls back to generating a fresh valid selection without error.

---

### Edge Cases

- **Empty category list**: A category configured with no exercises shows a clear placeholder (e.g., "No exercises available") instead of a broken or blank slot, and does not block other categories from displaying.
- **Single-item category**: Randomizing a category with only one exercise always yields that exercise; the control still responds without appearing broken.
- **Stored data references a removed exercise**: If a persisted selection points to an exercise no longer present in its category list, the app replaces it with a valid current selection on load.
- **Categories added or removed in configuration**: When the configured categories change, the display reflects the current set; stored data for removed categories is ignored and newly added categories receive a fresh selection.
- **Persistence unavailable**: If browser storage is disabled or full, the app still functions for the current session and simply does not persist between visits.
- **Very small screens**: On narrow phone widths the layout remains readable with no horizontal scrolling and controls remain tappable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST display exactly one selected exercise for each configured workout category, chosen from that category's list.
- **FR-002**: The app MUST support a configurable set of categories, allowing more or fewer than the initial four (leg, core, arm, hernia) by changing only the category/exercise data, with no other changes required.
- **FR-003**: The app MUST select exercises randomly from each category's list.
- **FR-004**: On first use (no saved selections), the app MUST automatically generate an initial selection for every category so the user always sees a complete routine.
- **FR-005**: The app MUST provide a single control that re-selects an exercise for every category at once.
- **FR-006**: The app MUST provide, for each category, a separate control that re-selects an exercise for only that category, leaving all other categories unchanged.
- **FR-007**: The app MUST persist the most recent selections in browser-level storage so they survive closing and reopening the app on the same device and browser.
- **FR-008**: The app MUST restore the persisted selections when reopened, and MUST fall back to a freshly generated selection when no valid persisted data is available.
- **FR-009**: The app MUST update persisted selections whenever the user randomizes all or a single category.
- **FR-010**: The app MUST present selections and controls in a mobile-friendly layout that is readable and operable on a phone without horizontal scrolling.
- **FR-011**: Each displayed selection MUST clearly identify its category and the chosen exercise.
- **FR-012**: The app MUST handle categories with an empty list gracefully, showing a clear placeholder rather than an error or blank.
- **FR-013**: The app MUST be operable entirely within the browser without requiring any back-end service or network fetch of workout data (exercise lists are bundled with the app).
- **FR-014**: The app MUST be deployable as a static single-page web app to a static file host (target: an AWS S3 bucket configured for website hosting) and reachable via a URL from a phone browser.

### Key Entities *(include if feature involves data)*

- **Category**: A named group of related exercises (e.g., "Leg", "Core", "Arm", "Hernia"). Attributes: display name, ordered position, and a list of candidate exercises. The set of categories is configurable.
- **Exercise**: A single workout task belonging to a category, represented by its display text (e.g., "20 bodyweight squats").
- **Selection State**: The currently chosen exercise for each category — the routine the user sees. This is what gets persisted between visits and updated on randomization.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On opening the app, the user sees a complete routine (one exercise per category) within 1 second, with no manual step required.
- **SC-002**: Activating randomize-all updates every category's selection in a single action, with the change visible within 1 second.
- **SC-003**: Activating a single-category randomize control changes only that category's selection 100% of the time, never altering another category.
- **SC-004**: A returning user on the same device and browser sees their most recent selections restored on 100% of reopens where browser storage is available and unmodified.
- **SC-005**: The layout displays without horizontal scrolling and with tappable controls on screens as narrow as 320px wide.
- **SC-006**: Changing the configured categories (adding or removing one) or editing any category's exercise list requires editing only the workout data in one place, with no other changes needed for the app to reflect it.
- **SC-007**: The app loads and runs from its hosted URL on a phone browser with no back-end service running.

## Assumptions

- The specific exercise text for each category will be supplied by the user and hard-coded/bundled into the app; the exact contents do not affect the requirements above.
- The four initial categories are leg, core, arm, and hernia, but the app treats the category set as data so it can grow or shrink.
- "Browser-level persistence" is satisfied by a standard client-side store on the user's device/browser; persistence is per-device and per-browser (not synced across devices).
- Random selection may allow the same exercise to be chosen again on a later randomization; for categories with more than one item, single-category re-rolls should avoid appearing stuck on the same value where practical, but true statistical independence across rolls is acceptable.
- A single user uses the app; there are no accounts, authentication, or multi-user separation.
- The target deployment is a static website hosted from an AWS S3 bucket; no server-side processing, database, or API is required.
- Standard modern mobile and desktop browsers are the supported environment; older/legacy browsers are out of scope for v1.
- There is no notion of "one selection per calendar day" enforcement — the user re-rolls whenever they choose; the app simply shows the latest selections.
