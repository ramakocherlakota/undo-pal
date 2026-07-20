// Pure random-selection logic. No DOM, no storage imports.
// `rng` is injectable (defaults to Math.random) so tests can be deterministic.

/**
 * Pick a random exercise from a list.
 * @param {string[]} exercises
 * @param {{ exclude?: string|null, rng?: () => number }} [opts]
 * @returns {string|null} null when the list is empty
 */
export function pickRandom(exercises, opts = {}) {
  const { exclude, rng = Math.random } = opts;
  if (!Array.isArray(exercises) || exercises.length === 0) return null;
  if (exercises.length === 1) return exercises[0];

  let pool = exercises;
  if (exclude !== undefined && exclude !== null) {
    const filtered = exercises.filter((e) => e !== exclude);
    // Only narrow the pool if excluding still leaves something to choose from.
    if (filtered.length > 0) pool = filtered;
  }

  const idx = Math.floor(rng() * pool.length);
  // Guard against rng() returning exactly 1 (out-of-range index).
  return pool[Math.min(idx, pool.length - 1)];
}

/**
 * Produce a fresh SelectionState: one pick per category.
 * @param {Array<{ id: string, exercises: string[] }>} categories
 * @param {{ rng?: () => number }} [opts]
 * @returns {Record<string, string|null>}
 */
export function selectAll(categories, opts = {}) {
  const { rng = Math.random } = opts;
  const state = {};
  for (const cat of categories) {
    state[cat.id] = pickRandom(cat.exercises, { rng });
  }
  return state;
}

/**
 * Re-pick a single category, excluding its current value so the result visibly
 * changes (for lists with > 1 item). All other categories are left untouched.
 * Returns a new state object (does not mutate the input).
 * @param {Record<string, string|null>} state
 * @param {Array<{ id: string, exercises: string[] }>} categories
 * @param {string} categoryId
 * @param {{ rng?: () => number }} [opts]
 * @returns {Record<string, string|null>}
 */
export function reselectOne(state, categories, categoryId, opts = {}) {
  const { rng = Math.random } = opts;
  const next = { ...state };
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return next;
  next[categoryId] = pickRandom(cat.exercises, { exclude: state[categoryId], rng });
  return next;
}
