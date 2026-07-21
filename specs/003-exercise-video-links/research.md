# Phase 0 Research: Exercise Video Search Links

**Feature**: `003-exercise-video-links` | **Date**: 2026-07-21

The Technical Context in `plan.md` had no open `NEEDS CLARIFICATION` markers — the spec's Assumptions section already resolved the two user-facing decisions (destination and new-tab). This document records those decisions with rationale and the alternatives weighed, plus the small implementation choices that follow.

## Decision 1 — Video search destination & URL format

**Decision**: Link to a YouTube search results page:
`https://www.youtube.com/results?search_query=<url-encoded query>`

**Rationale**:
- YouTube is the dominant source of free exercise/how-to demonstration videos, so its top results are the most likely to show the movement.
- A plain results URL needs no API key, no account, no embed, and no network call to construct — it is just a string, which fits a fully static, dependency-free, offline-capable app.
- The `search_query` parameter is a long-stable, well-known YouTube contract.

**Alternatives considered**:
- **Google Video search** (`https://www.google.com/search?tbm=vid&q=…`): aggregates multiple sources but adds a click-through/redirect layer and more ad/interstitial noise; results quality for "how to do X exercise" is comparable but less consistently video-first.
- **Vimeo / other platforms**: far smaller fitness how-to catalog; many exercise searches return little.
- **Embedded player / YouTube Data API**: would add a dependency, an API key, quota management, and network calls on load — rejected as over-engineering for "open a search" (out of scope per spec Assumptions).
- **Curated per-exercise video links**: high maintenance for ~200 exercises and brittle as videos are removed — rejected (spec Assumption: no per-exercise curation).

## Decision 2 — Search query context term

**Decision**: Build the query as the exercise name followed by a fixed context suffix so ambiguous names disambiguate toward the movement and toward tutorials. Query template:

```
<exercise name> exercise how to
```

**Rationale**:
- FR-003 requires the query to include workout/exercise context, not the bare name. Names like "Superman", "Bicycle", "Bridge", "Good morning", "Turkish Getup" are ordinary words or proper nouns; "exercise" biases results to the movement and "how to" biases toward instructional videos, matching the user's intent ("videos on how to do that exercise").
- A single fixed suffix keeps the helper trivial and fully testable, with no per-exercise special-casing.

**Alternatives considered**:
- **Bare name only**: fails FR-003 (ambiguous results). Rejected.
- **Only append "exercise"** (no "how to"): disambiguates the subject but weakens tutorial intent. The user explicitly asked for how-to videos, so "how to" is retained.
- **Strip parenthetical/author notes** from names (e.g. `Bobber Goblet Squat (side to side under imaginary bar)`, `Squat jump - legs, not cardio!`): could tighten results, but requires guessing which trailing text is noise vs. meaningful, risks mangling legitimate names, and is not required by the spec. **Deferred** as a possible future refinement; the name is used verbatim for now. Recorded as a known limitation below.

## Decision 3 — Link open target & security

**Decision**: Render the exercise as an anchor with `target="_blank"` and `rel="noopener noreferrer"`.

**Rationale**:
- Opening in a new tab satisfies FR-006 (following a link must not discard the user's current workout selections) — the app tab is left untouched, so the user returns to identical state. This is the simplest way to preserve state in a client-only app with no router.
- `rel="noopener noreferrer"` is the standard hardening for `target="_blank"`: it prevents the opened page from accessing `window.opener` (reverse-tabnabbing) and suppresses the referrer. No downside for an outbound search link.

**Alternatives considered**:
- **Same-tab navigation**: would unload the app; returning relies on Back and (since state persists in `localStorage`) would restore selections, but it's a worse experience and still risks re-render/scroll loss. Rejected in favor of a new tab.

## Decision 4 — URL encoding / special characters

**Decision**: Encode the full query with `encodeURIComponent(...)`. Spaces become `%20`; this is safe and correct inside `search_query` and is what the browser produces via `URLSearchParams`/`URL`.

**Rationale**:
- Exercise names include `"` (`12" sit to stand`), `/` (`1/2 kneeling chop/rotation`), parentheses, commas, and `!` (`Squat jump - legs, not cardio!`). `encodeURIComponent` correctly escapes all of these so the resulting `href` is a valid URL that targets the intended exercise (FR-008).
- Building the URL with the `URL` + `URLSearchParams` API (or `encodeURIComponent`) avoids manual escaping bugs. `URLSearchParams` encodes spaces as `+`, which YouTube also accepts; either is acceptable. The contract mandates only that the decoded query equals `"<name> exercise how to"`.

**Alternatives considered**:
- **Manual string concatenation without encoding**: breaks on `&`, `/`, `"`, `#`, etc. Rejected.

## Decision 5 — Accessibility & rendering approach

**Decision**: Keep the existing `<p class="exercise" aria-live="polite">` container as the live region, and place an `<a class="exercise-link">` inside it for real exercises. For the empty state, keep plain text inside the same `<p>` with the `exercise-empty` class and **no** anchor.

**Rationale**:
- A native `<a>` is focusable, keyboard-activatable (Enter), and announced as a link by assistive technology with zero extra ARIA (FR-007).
- Retaining the `<p aria-live="polite">` wrapper means re-rolls continue to be announced (the anchor text changing inside the live region is announced), preserving existing behavior.
- The empty-state placeholder has no exercise to search, so it must not be a link (FR-005) — plain text in the same container keeps the live-region announcement working when a category is empty.

**Alternatives considered**:
- **Make the whole card clickable**: conflicts with the existing per-card re-roll button and muddies focus/semantics. Rejected — link only the exercise name, as specified.
- **`role="link"` on a `<span>`**: reinvents the anchor and needs manual key handling. Rejected in favor of a real `<a>`.

## Known limitations (accepted for this feature)

- Exercise names containing clarifying notes or asides (parentheticals, `"- legs, not cardio!"`) are searched verbatim, which may slightly dilute results. Acceptable per Decision 2; revisit only if results prove poor.
- Search-result *quality* depends on YouTube's ranking, which is outside the app's control. SC-003 is validated on a representative sample, not guaranteed per-video.
- The empty state ("No exercises available") is not reachable with the current `data.js` (every category has exercises), but the non-link code path is still implemented and covered so future empty categories behave correctly.

## Resolved unknowns

All Technical Context items are concrete; **no `NEEDS CLARIFICATION` remain**. Ready for Phase 1.
