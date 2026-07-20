import { test } from "node:test";
import assert from "node:assert/strict";
import { pickRandom, selectAll, reselectOne } from "../src/selection.js";

test("pickRandom returns null for an empty list", () => {
  assert.equal(pickRandom([]), null);
  assert.equal(pickRandom([], { rng: () => 0 }), null);
  assert.equal(pickRandom(undefined), null);
});

test("pickRandom returns the sole item for a single-item list", () => {
  assert.equal(pickRandom(["only"]), "only");
  assert.equal(pickRandom(["only"], { exclude: "only" }), "only");
});

test("pickRandom always returns a member of the list", () => {
  const list = ["a", "b", "c"];
  for (const r of [0, 0.34, 0.5, 0.66, 0.99]) {
    assert.ok(list.includes(pickRandom(list, { rng: () => r })));
  }
});

test("pickRandom stays in range when rng() is near 1", () => {
  assert.equal(pickRandom(["a", "b"], { rng: () => 0.999999 }), "b");
});

test("pickRandom never returns the excluded value for lists > 1", () => {
  const list = ["a", "b", "c"];
  for (const r of [0, 0.3, 0.5, 0.9]) {
    assert.notEqual(pickRandom(list, { exclude: "a", rng: () => r }), "a");
  }
});

test("selectAll produces one entry per category, null for empty", () => {
  const cats = [
    { id: "x", name: "X", exercises: ["a", "b"] },
    { id: "y", name: "Y", exercises: [] },
  ];
  const state = selectAll(cats, { rng: () => 0 });
  assert.deepEqual(Object.keys(state).sort(), ["x", "y"]);
  assert.ok(["a", "b"].includes(state.x));
  assert.equal(state.y, null);
});

test("reselectOne changes only the target category and excludes current value", () => {
  const cats = [
    { id: "x", name: "X", exercises: ["a", "b", "c"] },
    { id: "y", name: "Y", exercises: ["p", "q"] },
  ];
  const state = { x: "a", y: "p" };
  const next = reselectOne(state, cats, "x", { rng: () => 0 });
  assert.equal(next.y, "p"); // untouched
  assert.notEqual(next.x, "a"); // changed
  assert.ok(["b", "c"].includes(next.x));
});

test("reselectOne on a single-item category yields that item", () => {
  const cats = [{ id: "z", name: "Z", exercises: ["only"] }];
  const next = reselectOne({ z: "only" }, cats, "z", { rng: () => 0.5 });
  assert.equal(next.z, "only");
});

test("reselectOne does not mutate the input state", () => {
  const cats = [{ id: "x", name: "X", exercises: ["a", "b"] }];
  const state = { x: "a" };
  const next = reselectOne(state, cats, "x", { rng: () => 0 });
  assert.notEqual(next, state);
  assert.equal(state.x, "a");
});

test("reselectOne with unknown categoryId returns an unchanged copy", () => {
  const cats = [{ id: "x", name: "X", exercises: ["a", "b"] }];
  const state = { x: "a" };
  const next = reselectOne(state, cats, "nope", { rng: () => 0 });
  assert.deepEqual(next, state);
});
