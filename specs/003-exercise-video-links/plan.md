# Implementation Plan: Exercise Video Search Links

**Branch**: `003-exercise-video-links` | **Date**: 2026-07-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-exercise-video-links/spec.md`

## Summary

Render the exercise name shown on each workout card as a clickable link that opens a video search for that exercise, instead of the current plain text. The link target is derived from the exercise name by a small, pure URL-building helper (`src/videoSearch.js`) that URL-encodes the name and appends exercise/how-to context so ambiguously named movements (e.g. "Superman", "Bicycle") return relevant demonstrations. The card renderer in `src/app.js` is updated to emit an anchor (opening in a new tab, `rel="noopener noreferrer"`) for real exercises and to keep the plain "No exercises available" text — with no link — for empty categories. The link is rebuilt to match the current exercise on every single-category re-roll and "Randomize all". No new runtime dependencies, no build step, and no changes to categories, exercise data, randomization, or persistence.

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript (ES2020+ modules). No transpilation/build step.

**Primary Dependencies**: None at runtime (no frameworks, no libraries, no bundler). Tooling: Node.js ≥18 (optional) only for running unit tests via the built-in `node --test` runner; AWS CLI v2 for deployment (unchanged).

**Storage**: Browser `localStorage` (unchanged). This feature reads no new state and writes none — the link is derived on the fly from the already-selected exercise name.

**Testing**: `node --test` (Node's built-in runner, zero dependencies) for the pure `videoSearch.js` URL-building logic; manual/quickstart validation for anchor rendering, new-tab behavior, keyboard access, and re-roll link freshness.

**Target Platform**: Modern mobile and desktop browsers (Safari iOS, Chrome/Android, plus desktop equivalents). Primary target is phone-sized viewports.

**Project Type**: Static single-page web application (client-only), hosted on AWS S3 static website hosting.

**Performance Goals**: No measurable impact. Link/URL construction is a synchronous string operation per card (≤ ~10 cards); initial render and re-rolls remain effectively instantaneous.

**Constraints**: Fully offline-capable for rendering the workout (URL construction needs no network; only *following* a link requires connectivity). Must preserve existing accessibility (tap targets, `aria-live` announcement of exercise changes, dark/light theming) and add standard link affordances (visible styling, keyboard operable, announced as a link). Must handle exercise names containing quotes, slashes, parentheses, and punctuation.

**Scale/Scope**: Single user; no auth. ~5 categories, each with a handful to a few dozen exercises. One screen. Change touches `src/app.js`, adds `src/videoSearch.js`, adds link styling to `styles.css`, and adds one unit-test file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution at `.specify/memory/constitution.md` is an unpopulated template (no ratified principles). No project-specific gates apply. In their absence, the plan is evaluated against the same general best-practice gates used by the existing features:

| Gate | Status | Notes |
|------|--------|-------|
| Simplicity / YAGNI | ✅ Pass | One small pure helper + a renderer tweak + CSS. No new dependencies, no build step, no per-exercise data. |
| No unnecessary dependencies | ✅ Pass | Zero runtime deps added; test runner remains Node built-in. |
| Testability | ✅ Pass | URL-building logic isolated in a pure, DOM-free module (`videoSearch.js`) unit-tested with `node --test`; DOM/behavior covered by quickstart. |
| Data-driven configurability | ✅ Pass | Exercise/category data (`data.js`) is unchanged and remains the single source of truth; links derive from it. |
| Scope discipline | ✅ Pass | No back end, accounts, embedded player, or curated per-exercise videos. Only the presentation of the existing exercise name changes. |
| Accessibility preserved | ✅ Pass | Anchor is natively focusable and announced as a link; existing `aria-live` region and theming retained; new focus-visible styling added. |

**Result**: PASS (no violations; Complexity Tracking not required).

## Project Structure

### Documentation (this feature)

```text
specs/003-exercise-video-links/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── search-url-contract.md
│   └── ui-contract.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (/speckit-specify output)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
index.html               # Unchanged (cards still injected by src/app.js)
styles.css               # + .exercise-link styling (link affordance, focus-visible, theming)
src/
├── data.js              # Unchanged (categories + exercise lists)
├── selection.js         # Unchanged (pure selection logic)
├── storage.js           # Unchanged (localStorage wrapper)
├── reconcile.js         # Unchanged (state/config merge)
├── videoSearch.js       # NEW — pure: exercise name -> video search URL (no DOM, no storage)
└── app.js               # MODIFIED — render exercise as <a> link; empty state stays non-link;
                         #            rebuild link on reroll / randomize-all

tests/
├── selection.test.js    # Unchanged
├── reconcile.test.js    # Unchanged
└── videoSearch.test.js  # NEW — node --test coverage for videoSearch.js (encoding, context, edge cases)

deploy/                  # Unchanged (static sync; new files ship as-is)
```

**Structure Decision**: Keep the existing static single-page layout at the repository root so files map directly to S3 object keys with no build step. Follow the established module split: put the new pure, side-effect-free URL logic in its own module (`videoSearch.js`) so it is unit-testable with Node's built-in runner, and confine DOM changes to `app.js`. Styling is added to the existing `styles.css`. No new directories are introduced.

## Complexity Tracking

No constitution violations. Section intentionally left empty.
