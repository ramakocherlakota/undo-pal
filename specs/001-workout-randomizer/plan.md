# Implementation Plan: Daily Workout Randomizer

**Branch**: `001-workout-randomizer` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-workout-randomizer/spec.md`

## Summary

A static, client-only single-page web app that shows one randomly selected exercise per configured workout category (initially leg, core, arm, hernia). The user can re-roll all categories at once or any single category, and the most recent selections persist in the browser between visits. Exercise lists are bundled as data (no back end). The technical approach is dependency-free vanilla HTML/CSS/JavaScript (ES modules) with `localStorage` persistence, delivered as static files hosted from an AWS S3 bucket configured for website hosting.

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript (ES2020+ modules). No transpilation/build step.

**Primary Dependencies**: None at runtime (no frameworks, no libraries, no bundler). Tooling: AWS CLI v2 for deployment; Node.js ≥18 (optional) only for running unit tests via the built-in `node --test` runner.

**Storage**: Browser `localStorage` (single JSON entry under one key) for the most-recent selection state. No server, database, or cookies.

**Testing**: `node --test` (Node's built-in test runner, zero dependencies) for pure selection logic; manual/quickstart validation for DOM rendering, persistence, and responsive layout.

**Target Platform**: Modern mobile and desktop browsers (Safari iOS, Chrome/Android, plus desktop equivalents). Primary target is phone-sized viewports.

**Project Type**: Static single-page web application (client-only), hosted on AWS S3 static website hosting.

**Performance Goals**: Initial complete routine rendered within 1 second of load; randomize-all and single-category re-rolls reflected within 1 second (effectively instantaneous — all in-memory).

**Constraints**: Fully offline-capable after load (no network calls for data). Must render without horizontal scrolling and with tappable controls at viewport widths down to 320px. Must degrade gracefully when `localStorage` is unavailable or holds stale/corrupt data.

**Scale/Scope**: Single user; no auth. Roughly 3–10 categories, each with a handful to a few dozen exercises. One screen.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution at `.specify/memory/constitution.md` is an unpopulated template (no ratified principles). No project-specific gates apply. In their absence, the plan is evaluated against general best-practice gates:

| Gate | Status | Notes |
|------|--------|-------|
| Simplicity / YAGNI | ✅ Pass | Vanilla static site, no build tooling, no runtime dependencies. Simplest approach that satisfies all requirements. |
| No unnecessary dependencies | ✅ Pass | Zero runtime deps; test runner is Node built-in; deploy uses AWS CLI only. |
| Testability | ✅ Pass | Pure selection logic isolated into a dependency-free module unit-tested with `node --test`; UI/persistence covered by quickstart validation. |
| Data-driven configurability | ✅ Pass | Categories/exercises live in a single data module (FR-002, SC-006). |
| Scope discipline | ✅ Pass | No back end, accounts, or cross-device sync (per spec assumptions). |

**Result**: PASS (no violations; Complexity Tracking not required).

## Project Structure

### Documentation (this feature)

```text
specs/001-workout-randomizer/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── ui-contract.md
│   ├── storage-contract.md
│   └── deployment-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
index.html               # Single page: markup shell + mounts the app
styles.css               # Mobile-first responsive styles
src/
├── data.js              # Hard-coded categories + exercise lists (single source of truth)
├── selection.js         # Pure random-selection logic (no DOM, no storage) — unit tested
├── storage.js           # localStorage load/save wrapper with safe fallbacks
├── reconcile.js         # Merge stored state with current config (drop removed, add new) — pure
└── app.js               # UI wiring: render cards, bind buttons, orchestrate select/persist

tests/
└── selection.test.js    # node --test coverage for selection.js + reconcile.js

deploy/
├── deploy.sh            # aws s3 sync + cache headers
└── bucket-policy.json   # Public-read policy for website hosting (template)
```

**Structure Decision**: Static single-page web app at repository root so the deployable artifacts (`index.html`, `styles.css`, `src/`) map directly to S3 object keys with no build/output step. Logic is split into small ES modules: pure, side-effect-free logic (`selection.js`, `reconcile.js`) is separated from I/O (`storage.js`) and DOM (`app.js`) so the core rules are unit-testable with Node's built-in runner. Deployment tooling lives under `deploy/` and is excluded from the S3 sync.

## Complexity Tracking

No constitution violations. Section intentionally left empty.
