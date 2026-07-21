import { test } from "node:test";
import assert from "node:assert/strict";
import { videoSearchUrl } from "../src/videoSearch.js";

const PREFIX = "https://www.youtube.com/results?search_query=";
const SUFFIX = " exercise how to";

// Representative names from the contract (ordinary, ambiguous, and special-char).
const NAMES = [
  "Hammer curl",
  "Superman",
  "Bicycle",
  '12" sit to stand',
  "1/2 kneeling chop/rotation",
  "Squat jump - legs, not cardio!",
  "Bobber Goblet Squat (side to side under imaginary bar)",
];

// Decode the query the way a browser would, so assertions are agnostic to
// %20-vs-+ space escaping (both are acceptable per the contract).
function decodedQuery(url) {
  return new URL(url).searchParams.get("search_query");
}

// Obligation 1: prefix.
test("videoSearchUrl starts with the YouTube results prefix", () => {
  for (const name of NAMES) {
    assert.ok(videoSearchUrl(name).startsWith(PREFIX), name);
  }
});

// Obligation 2: context suffix, name preserved verbatim.
test("decoded search_query is `<name> exercise how to`", () => {
  for (const name of NAMES) {
    const q = decodedQuery(videoSearchUrl(name));
    assert.equal(q, `${name}${SUFFIX}`);
    assert.ok(q.startsWith(name));
    assert.ok(q.endsWith(SUFFIX));
  }
});

// Obligation 3: special characters are percent-encoded and round-trip.
test("special characters are percent-encoded and round-trip", () => {
  const name = '12" sit / stand';
  const url = videoSearchUrl(name);
  const query = url.slice(PREFIX.length);
  assert.ok(!query.includes('"'), 'query must not contain a literal "');
  assert.ok(!query.includes("/"), "query must not contain a literal /");
  assert.equal(decodedQuery(url), `${name}${SUFFIX}`);
});

// Obligation 4: validity for every representative name.
test("output is always a valid absolute URL", () => {
  for (const name of NAMES) {
    assert.doesNotThrow(() => new URL(videoSearchUrl(name)), name);
  }
});

// Obligation 5: determinism.
test("videoSearchUrl is deterministic", () => {
  for (const name of NAMES) {
    assert.equal(videoSearchUrl(name), videoSearchUrl(name));
  }
});
