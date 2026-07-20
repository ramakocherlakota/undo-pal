// Pure reconciliation of stored selections against the current category config.
// No DOM, no storage imports.

import { pickRandom } from "./selection.js";

/**
 * Merge persisted selections with the live category configuration:
 *  - keep a stored value if it still exists in that category's list
 *  - otherwise pick a fresh value
 *  - empty categories -> null
 *  - stored entries for categories no longer configured are dropped
 * Guarantees the returned state has exactly one entry per current category.
 * @param {Array<{ id: string, exercises: string[] }>} categories
 * @param {Record<string, unknown>|null|undefined} storedSelections
 * @param {{ rng?: () => number }} [opts]
 * @returns {Record<string, string|null>}
 */
export function reconcile(categories, storedSelections, opts = {}) {
  const { rng = Math.random } = opts;
  const stored =
    storedSelections && typeof storedSelections === "object" ? storedSelections : {};

  const state = {};
  for (const cat of categories) {
    const prev = stored[cat.id];
    if (typeof prev === "string" && cat.exercises.includes(prev)) {
      state[cat.id] = prev;
    } else {
      state[cat.id] = pickRandom(cat.exercises, { rng });
    }
  }
  return state;
}
