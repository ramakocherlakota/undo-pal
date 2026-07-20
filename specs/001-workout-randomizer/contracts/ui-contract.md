# UI Contract: Daily Workout Randomizer

**Feature**: 001-workout-randomizer

Defines the observable UI structure and interaction behavior the app must honor. This is the contract the quickstart validation checks against. Element names below are logical; markup may differ as long as behavior and accessibility hold.

## Screen layout (single page)

```text
┌───────────────────────────────────┐
│  Today's Workout            (title)│
│                                   │
│  ┌─────────────────────────────┐  │
│  │ Leg                    [ ↻ ] │  │  ← category card
│  │ 30s wall sit                 │  │     name + selected exercise + re-roll
│  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │
│  │ Core                   [ ↻ ] │  │
│  │ 30s plank                    │  │
│  └─────────────────────────────┘  │
│  … one card per configured category
│                                   │
│      [   Randomize all   ]        │  ← primary action
└───────────────────────────────────┘
```

## Elements & required behavior

| Element | Required behavior |
|---------|-------------------|
| **Page title** | Static friendly heading (e.g., "Today's Workout"). |
| **Category card** (one per configured category, in config order) | Displays the category `name` and the currently selected exercise text. Renders for every configured category (FR-001, FR-011). |
| **Selected exercise text** | Shows the current `SelectionState[categoryId]`. If the category list is empty, shows a placeholder such as "No exercises available" and the re-roll button is disabled or a no-op (FR-012, Edge Cases). |
| **Per-category re-roll button** | One per card. On activate: re-selects only this category (excluding its current value when list length > 1), updates only this card, and persists. Other cards are unchanged (FR-006, SC-003). Must be a real, labeled control (accessible name e.g. "Randomize Leg"). |
| **Randomize-all button** | Single primary control. On activate: re-selects every category, updates all cards, and persists (FR-005, SC-002). |

## Interaction contract

| Trigger | Precondition | Effect | Postcondition |
|---------|-------------|--------|---------------|
| App load | — | Load → reconcile or fresh `selectAll` | Every configured category shows exactly one exercise (or placeholder if empty) within 1s (SC-001) |
| Tap "Randomize all" | Any state | `selectAll(config)` → persist → re-render | All cards updated; storage updated (SC-002) |
| Tap category re-roll | Category has ≥1 exercise | `reselectOne(state, id)` → persist → re-render that card | Only that card changed; if list length > 1 the value is different from before (SC-003); storage updated |
| Tap category re-roll | Category list empty | No-op (or disabled control) | No error; placeholder remains |
| Reopen after close | Valid stored state exists | Restore reconciled selections | Previously shown selections reappear (SC-004) |

## Responsive & accessibility requirements

- **No horizontal scrolling** at viewport widths down to 320px (SC-005).
- **Tap targets** for all buttons ≥ 44×44 CSS px.
- Mobile-first single-column stack; may center within a max-width container on larger screens.
- Buttons are focusable, keyboard-activatable, and have discernible accessible names (per-category buttons distinguished by category, e.g., `aria-label="Randomize Leg"`).
- Selected exercise updates are conveyed to assistive tech (e.g., the exercise text node is updated in place; consider `aria-live="polite"` on cards).
- Color/contrast meets WCAG AA for text.

## Non-goals (v1)

- No animation requirements, no history/undo, no "one per day" lock, no settings screen, no cross-device sync.
