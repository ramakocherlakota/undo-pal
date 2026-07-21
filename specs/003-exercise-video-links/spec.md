# Feature Specification: Exercise Video Search Links

**Feature Branch**: `003-exercise-video-links`

**Created**: 2026-07-21

**Status**: Draft

**Input**: User description: "change the text in each card to be a link to a search for videos on how to do that exercise"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Look up how to perform the shown exercise (Priority: P1)

A person is reviewing their daily workout and sees an exercise name they don't recognize or aren't sure how to perform correctly. They tap or click the exercise name on the card and are taken to a video search for that exercise, where they can watch a demonstration before doing it.

**Why this priority**: This is the entire feature. Without it, the exercise names remain static text and the user has no in-app way to learn an unfamiliar movement. It delivers the complete value on its own.

**Independent Test**: Load the app, click the exercise name on any card, and confirm a video search for that exact exercise opens. This alone is a shippable, useful improvement.

**Acceptance Scenarios**:

1. **Given** a card is showing an exercise (e.g. "Bulgarian split squat"), **When** the user clicks/taps the exercise name, **Then** a video search for that exercise opens.
2. **Given** a card is showing an exercise, **When** the user views the exercise name, **Then** it is visually and functionally identifiable as a link (distinct styling and standard link affordances).
3. **Given** the user follows the exercise link, **When** the video search opens, **Then** the workout app and its current selections remain intact and available to return to.

---

### User Story 2 - Link stays correct after re-randomizing (Priority: P2)

The user re-randomizes a single category or all categories. Every card that now shows a new exercise must link to a video search for the newly shown exercise, not the previous one.

**Why this priority**: Re-randomizing is a core existing behavior of the app. A stale link that points to the previously shown exercise would be misleading and erode trust, but the feature still delivers value for the initial render without it.

**Independent Test**: Randomize a category, note the new exercise, click its name, and confirm the search matches the currently displayed exercise.

**Acceptance Scenarios**:

1. **Given** a card showing exercise A, **When** the user re-randomizes that category and it now shows exercise B, **Then** clicking the name searches for exercise B.
2. **Given** all cards are showing exercises, **When** the user uses "Randomize all", **Then** every card's link matches the exercise it currently displays.

---

### Edge Cases

- **Empty category / no exercise available**: A card whose category has no exercises shows "No exercises available". This placeholder MUST NOT be a link, since there is no exercise to search for.
- **Ambiguous exercise names**: Some names are common words (e.g. "Superman", "Bicycle", "Bridge") that would return unrelated video results on their own. The search MUST include exercise/workout context so results are relevant to the movement, not the unrelated meaning.
- **Names with special characters**: Some exercises contain quotes, slashes, or parentheses (e.g. `12" sit to stand`, `1/2 kneeling chop/rotation`, `Squat jump - legs, not cardio!`). These MUST be handled so the resulting search still targets the intended exercise.
- **Keyboard and assistive-technology users**: The link MUST be reachable and activatable without a mouse and announced as a link to assistive technology.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The exercise name shown on each card MUST be rendered as an activatable link instead of plain text.
- **FR-002**: Activating an exercise link MUST open a video search whose query targets the exercise named on that card.
- **FR-003**: The search query MUST include workout/exercise context (not the exercise name alone) so that ambiguously named exercises return relevant how-to results.
- **FR-004**: Each exercise link MUST always reflect the exercise currently displayed on its card, including after single-category re-randomization and "Randomize all".
- **FR-005**: The "No exercises available" placeholder MUST NOT be rendered as a link.
- **FR-006**: Following an exercise link MUST NOT discard or reset the user's current workout selections; the user MUST be able to return to their workout unchanged.
- **FR-007**: Exercise links MUST be visually distinguishable as links and MUST be operable via keyboard and announced as links to assistive technology.
- **FR-008**: The link MUST correctly target exercises whose names contain special characters (quotes, slashes, parentheses, punctuation).

### Key Entities *(include if feature involves data)*

- **Exercise**: The named movement currently selected for a category (e.g. "Hammer curl"). It is the text displayed on a card and the subject of the video search. No new data is introduced — the existing exercise name is reused as both the visible label and the search subject.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of cards that display an exercise present that exercise as a working link to a video search for it.
- **SC-002**: From viewing a card, a user can reach a video search for the shown exercise in a single interaction (one click/tap or keyboard activation).
- **SC-003**: For every exercise across all categories, the opened search's top results are demonstrations of that exercise/movement (verified on a representative sample including ambiguously named exercises such as "Superman" and "Bicycle").
- **SC-004**: After any re-randomization, 100% of displayed exercises link to a search matching the currently shown exercise (0% stale links).
- **SC-005**: Cards showing "No exercises available" present 0 links.

## Assumptions

- **Video search destination**: Links point to a general-purpose video search (YouTube search), the industry-standard source for exercise how-to videos. No account, embedded player, or curated per-exercise video is in scope — only a search for the exercise.
- **Opens separately**: Links open in a new browser tab/window so the workout app state is preserved, satisfying FR-006 for this static, client-side app.
- **Search context term**: The query augments the exercise name with an exercise/how-to context term (e.g. appending "exercise" or "how to") to keep results relevant; the exact phrasing is an implementation detail chosen to maximize relevance.
- **No data changes**: The set of categories and exercises is unchanged; this feature only changes how the already-displayed exercise name is presented and does not alter randomization or persistence behavior.
- **No per-exercise curation**: Each exercise reuses the same search mechanism; there is no hand-picked video or link per exercise to maintain.
