# Phase 0 Research: Daily Workout Randomizer

**Feature**: 001-workout-randomizer
**Date**: 2026-07-20

The feature specification left no `[NEEDS CLARIFICATION]` markers. This document records the technical decisions that resolve the open implementation choices, each with rationale and rejected alternatives.

## Decision 1: Runtime stack — vanilla HTML/CSS/JS, no framework, no build step

- **Decision**: Build the app as plain `index.html` + `styles.css` + ES-module JavaScript under `src/`, with no framework, bundler, or transpiler.
- **Rationale**: The app is a single screen with a handful of controls, hard-coded data, and no network calls. A framework (React/Vue/Svelte) or bundler adds tooling, a build step, and output artifacts that complicate the "just upload files to S3" deployment for zero user-facing benefit. Native ES modules are supported by all target browsers and are served correctly over HTTP from S3. This is the simplest thing that fully satisfies the spec (Constitution simplicity gate).
- **Alternatives considered**:
  - *React + Vite*: Familiar and componentized, but introduces `npm install`, a build step, and a `dist/` output — unnecessary weight for one screen.
  - *Single inline `<script>` in index.html*: Even simpler to deploy, but harder to unit test and reason about. Rejected in favor of small ES modules that keep pure logic testable.

## Decision 2: Persistence — `localStorage`, single JSON key

- **Decision**: Persist the current selection state as one JSON string under a single `localStorage` key (e.g., `workout-randomizer:v1`).
- **Rationale**: The spec requires selections to survive closing/reopening on the same device/browser (FR-007). `localStorage` is synchronous, simple, ~5MB (far more than needed), and requires no serialization ceremony beyond `JSON.stringify`/`parse`. A single key holding the whole state keeps reads/writes atomic and easy to version.
- **Alternatives considered**:
  - *Cookies*: Sent on every request, size-limited, awkward API. No benefit here since there is no server. Rejected.
  - *IndexedDB*: Async, transactional, overkill for a few kilobytes of state. Rejected.
  - *One key per category*: More granular but multiplies edge cases (partial writes, orphan keys). A single versioned blob is simpler.

## Decision 3: Randomization behavior — uniform random with "avoid immediate repeat"

- **Decision**: Selection picks uniformly at random from a category's list. For a single-category re-roll where the list has more than one item, exclude the currently displayed item so the value always visibly changes. Randomize-all rolls each category independently (immediate-repeat avoidance not required across a full re-roll, but applied per category is acceptable).
- **Rationale**: Directly serves the user's stated motivation for the per-category button ("bored of a particular workout / equipment unavailable") — a re-roll that returns the same item feels broken (SC-003 / User Story 3 acceptance #2). Excluding only the current item preserves near-uniform randomness while guaranteeing visible change. Single-item lists trivially return that item.
- **Alternatives considered**:
  - *Pure independent uniform random every time*: Simplest, but a re-roll can return the same item, which reads as a bug for the single-category case. Rejected for the per-category path.
  - *Full non-repeating shuffle/bag per category*: Guarantees maximum spread but adds per-category cursor state to persist and reason about — more than the spec needs. Rejected.

## Decision 4: Handling config/state drift — reconcile stored state against current config on load

- **Decision**: On load, merge persisted state with the current category configuration: keep stored selections that still exist in their category's list; for categories that are new, empty in storage, or whose stored value was removed, generate a fresh selection; ignore stored entries for categories no longer configured.
- **Rationale**: The spec requires graceful handling when the config changes or storage is stale/corrupt (Edge Cases; FR-008). A pure `reconcile(config, storedState)` function makes this deterministic and unit-testable, and guarantees the user always sees a complete, valid routine.
- **Alternatives considered**:
  - *Trust stored state blindly*: Breaks when a referenced exercise or category was removed. Rejected.
  - *Discard all stored state whenever config changes*: Loses the user's still-valid selections unnecessarily. Rejected.

## Decision 5: Responsive/mobile layout — mobile-first single column, CSS only

- **Decision**: Mobile-first CSS with a single-column stack of category cards; each card shows the category name, the selected exercise, and a per-category re-roll button. A prominent "Randomize all" button is fixed/primary. Use relative units and flex/grid; ensure tap targets ≥44px and no horizontal overflow down to 320px.
- **Rationale**: Primary use is on a phone (FR-010, SC-005). A single-column stack is the most legible phone layout and scales up gracefully on wider screens (optional max-width container). Pure CSS avoids JS layout logic.
- **Alternatives considered**:
  - *CSS framework (Tailwind/Bootstrap)*: Adds a dependency/build or a large CDN file (and CDN fetch conflicts with offline-capable goal). Hand-written CSS is small and sufficient. Rejected.

## Decision 6: Testing approach — Node built-in test runner for pure logic

- **Decision**: Unit-test `selection.js` and `reconcile.js` with `node --test` (no installed dependencies). Cover: selection from a list, single-item lists, avoid-immediate-repeat, empty lists, and reconcile drift cases. DOM rendering, `localStorage` round-trip, and responsive layout are validated manually via `quickstart.md`.
- **Rationale**: Keeps the project dependency-free while still giving automated coverage of the tricky, high-value logic (randomness edge cases, reconciliation). Node's built-in runner needs no `package.json` deps. Pure functions accept the RNG/injected values as parameters where needed for determinism.
- **Alternatives considered**:
  - *Jest/Vitest*: More features (mocks, jsdom) but requires `npm install` and config. Not worth it for a couple of pure modules. Rejected.
  - *No automated tests*: Fastest, but the randomness/reconcile rules are exactly where regressions hide. Rejected.

## Decision 7: Deployment — AWS S3 static website hosting via AWS CLI

- **Decision**: Host the static files in an S3 bucket configured for website hosting (index document `index.html`). Deploy with `aws s3 sync` from the repo root, excluding non-web files (`specs/`, `tests/`, `deploy/`, dotfiles). Provide a public-read bucket policy template. Document the CloudFront/HTTPS option as a follow-on, not required for v1.
- **Rationale**: Matches the user's explicit request (FR-014). `aws s3 sync` is idempotent and only uploads changed files. A documented, scripted deploy makes the process repeatable.
- **Alternatives considered**:
  - *S3 + CloudFront + custom domain + HTTPS*: The production-grade setup (S3 website endpoints are HTTP-only). Noted as an optional enhancement in the deployment contract, but out of scope for the v1 requirement of "an S3 bucket configured for hosting."
  - *Manual console upload*: Not repeatable/reviewable. Rejected in favor of a script.

## Summary of Resolved Unknowns

| Topic | Resolution |
|-------|-----------|
| Framework vs. vanilla | Vanilla ES modules, no build step |
| Persistence mechanism | `localStorage`, single versioned JSON key |
| Re-roll semantics | Uniform random; per-category re-roll avoids the current value |
| Config/state drift | Pure `reconcile()` merges stored state with live config |
| Layout | Mobile-first single-column CSS, no framework |
| Tests | `node --test` on pure logic; quickstart for UI/storage/layout |
| Deployment | S3 static website hosting via `aws s3 sync` |
