import { test } from "node:test";
import assert from "node:assert/strict";
import { reconcile } from "../src/reconcile.js";

const cats = [
  { id: "x", name: "X", exercises: ["a", "b", "c"] },
  { id: "y", name: "Y", exercises: ["p", "q"] },
  { id: "z", name: "Z", exercises: [] },
];

test("reconcile keeps stored values that are still valid", () => {
  const state = reconcile(cats, { x: "b", y: "q" }, { rng: () => 0 });
  assert.equal(state.x, "b");
  assert.equal(state.y, "q");
});

test("reconcile replaces a stored value no longer in the list", () => {
  const state = reconcile(cats, { x: "removed", y: "p" }, { rng: () => 0 });
  assert.ok(["a", "b", "c"].includes(state.x));
  assert.notEqual(state.x, "removed");
  assert.equal(state.y, "p");
});

test("reconcile drops entries for unknown categories", () => {
  const state = reconcile(cats, { x: "a", gone: "whatever" }, { rng: () => 0 });
  assert.equal("gone" in state, false);
  assert.deepEqual(Object.keys(state).sort(), ["x", "y", "z"]);
});

test("reconcile yields null for an empty category", () => {
  const state = reconcile(cats, { z: "anything" }, { rng: () => 0 });
  assert.equal(state.z, null);
});

test("reconcile always covers every current category", () => {
  const state = reconcile(cats, {}, { rng: () => 0 });
  assert.deepEqual(Object.keys(state).sort(), ["x", "y", "z"]);
  assert.ok(["a", "b", "c"].includes(state.x));
  assert.ok(["p", "q"].includes(state.y));
  assert.equal(state.z, null);
});

test("reconcile tolerates missing/garbage stored input", () => {
  for (const bad of [null, undefined, 42, "str", []]) {
    const state = reconcile(cats, bad, { rng: () => 0 });
    assert.deepEqual(Object.keys(state).sort(), ["x", "y", "z"]);
  }
});
