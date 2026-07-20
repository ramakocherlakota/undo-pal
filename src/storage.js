// Browser persistence wrapper. Never throws — all failures degrade gracefully.
// See contracts/storage-contract.md.

export const STORAGE_KEY = "workout-randomizer:v1";
const SCHEMA_VERSION = 1;

/**
 * Read persisted state.
 * @returns {{ version: number, selections: Record<string, string>, updatedAt?: string }|null}
 *   null if missing, unparseable, wrong shape/version, or storage is unavailable.
 */
export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.version !== SCHEMA_VERSION) return null;
    if (!parsed.selections || typeof parsed.selections !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Persist the given selection state. Swallows quota/disabled-storage errors.
 * @param {Record<string, string|null>} selections
 * @returns {boolean} true if written, false if it could not be saved
 */
export function saveState(selections) {
  try {
    const payload = {
      version: SCHEMA_VERSION,
      selections,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}
