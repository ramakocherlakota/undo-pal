// UI wiring: load/reconcile selections, render cards, handle randomize actions,
// and persist after every change. Pure logic lives in the imported modules.

import { CATEGORIES } from "./data.js";
import { selectAll, reselectOne } from "./selection.js";
import { reconcile } from "./reconcile.js";
import { loadState, saveState } from "./storage.js";

const appEl = document.getElementById("app");

/** @type {Record<string, string|null>} current selection state */
let state = {};

function init() {
  const stored = loadState();
  state = stored ? reconcile(CATEGORIES, stored.selections) : selectAll(CATEGORIES);
  // Persist the normalized state so a first visit (or a drift-corrected reload)
  // survives closing the app even without any user interaction.
  saveState(state);

  render();

  const allBtn = document.getElementById("randomize-all");
  allBtn.addEventListener("click", onRandomizeAll);
}

function render() {
  appEl.textContent = "";
  const frag = document.createDocumentFragment();
  for (const cat of CATEGORIES) {
    frag.appendChild(renderCard(cat));
  }
  appEl.appendChild(frag);
}

function renderCard(cat) {
  const card = document.createElement("section");
  card.className = "card";
  card.dataset.categoryId = cat.id;

  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("h2");
  title.className = "card-title";
  title.textContent = cat.name;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-reroll";
  btn.setAttribute("aria-label", `Randomize ${cat.name}`);
  btn.textContent = "↻"; // ↻
  const isEmpty = !Array.isArray(cat.exercises) || cat.exercises.length === 0;
  if (isEmpty) {
    btn.disabled = true;
  } else {
    btn.addEventListener("click", () => onReroll(cat.id));
  }

  header.append(title, btn);

  const exercise = document.createElement("p");
  exercise.className = "exercise";
  exercise.setAttribute("aria-live", "polite");
  applyExerciseText(exercise, state[cat.id]);

  card.append(header, exercise);
  return card;
}

function applyExerciseText(el, value) {
  if (value == null) {
    el.classList.add("exercise-empty");
    el.textContent = "No exercises available";
  } else {
    el.classList.remove("exercise-empty");
    el.textContent = value;
  }
}

function updateCard(categoryId) {
  const card = appEl.querySelector(
    `[data-category-id="${CSS.escape(categoryId)}"]`
  );
  if (!card) return;
  applyExerciseText(card.querySelector(".exercise"), state[categoryId]);
}

function onReroll(categoryId) {
  state = reselectOne(state, CATEGORIES, categoryId);
  saveState(state);
  updateCard(categoryId);
}

function onRandomizeAll() {
  state = selectAll(CATEGORIES);
  saveState(state);
  for (const cat of CATEGORIES) updateCard(cat.id);
}

init();
